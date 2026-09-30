import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrg } from '@/lib/org-helper'
import { createServiceClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/layout/app-sidebar'
import AppHeader from '@/components/layout/app-header'
import MobileBottomNav from '@/components/layout/mobile-bottom-nav'
import { FirebaseProvider } from '@/components/FirebaseProvider'
import LockedErpScreen from '@/components/dashboard/locked-erp-screen'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login?error=session_expired')
  }

  // Strict Role-Based Isolation: Residents and Tenants must NEVER access PG Owner ERP!
  const isSuperAdmin =
    user.role === 'superadmin' || user.email === 'vikramtomar0505@gmail.com'

  const isOwnerOrStaff =
    isSuperAdmin ||
    ['owner', 'manager', 'accountant', 'staff'].includes(user.role)

  if (
    !isOwnerOrStaff &&
    (user.role === 'resident' ||
      (user as any).role === 'tenant' ||
      (user as any).role === 'user')
  ) {
    redirect('/my-profile')
  }

  // Ensure robust effective organization context is provided once
  let effectiveOrg = await resolveEffectiveOrg(user)
  const serviceClient = await createServiceClient()

  // Check lock state for un-onboarded owners: ERP platform remains locked until SuperAdmin unlocks and sets up PG
  if (!isSuperAdmin && user.role === 'owner') {
    const cookieStore = await cookies()

    // 1. Resolve fresh organization if user was recently linked or created
    let orgId = effectiveOrg?.id
    if (!orgId || orgId === 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98') {
      const { data: freshUser } = await serviceClient
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()
      if (
        freshUser?.organization_id &&
        freshUser.organization_id !== 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98'
      ) {
        orgId = freshUser.organization_id
        effectiveOrg = await resolveEffectiveOrg({ ...user, organization_id: orgId || null })
      }
    }

    if (!orgId) {
      const cleanPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''
      const { data: matchedOrg } = await serviceClient
        .from('organizations')
        .select('id, name, slug, gst_enabled')
        .or(`owner_user_id.eq.${user.id}${cleanPhone ? `,phone.ilike.%${cleanPhone}%` : ''}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (matchedOrg?.id) {
        orgId = matchedOrg.id
        effectiveOrg = matchedOrg
      }
    }

    let isUnlocked = false

    // 2. Check if SuperAdmin setup at least 1 property for this organization in Supabase
    if (orgId && orgId !== 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98') {
      const { count: propertyCount } = await serviceClient
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)

      if (propertyCount && propertyCount > 0) {
        isUnlocked = true
      }
    }

    // 3. Query Firestore owner_profiles to check if SuperAdmin marked them unlocked
    if (!isUnlocked) {
      try {
        const { queryDocuments } = await import('@/lib/firebase/firestore')
        const cleanedMobile = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''
        if (cleanedMobile) {
          const ownerDocs = await queryDocuments('owner_profiles', [
            { field: 'mobile', operator: '==', value: cleanedMobile },
          ])
          if (ownerDocs && ownerDocs.length > 0) {
            const ownerDoc = ownerDocs[0]
            if (
              ownerDoc.erp_unlocked === true &&
              ownerDoc.onboarding_status !== 'pending_superadmin'
            ) {
              isUnlocked = true
            }
          }
        }
      } catch (err) {
        console.warn('[Dashboard Layout Owner Check Warning]:', err)
      }
    }

    // 4. Update cookies & gate access
    if (isUnlocked) {
      try {
        cookieStore.delete('erp_locked')
        cookieStore.set('erp_unlocked', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      } catch {}
    } else {
      try {
        cookieStore.set('erp_locked', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
        cookieStore.delete('erp_unlocked')
      } catch {}
      return <LockedErpScreen owner={user} />
    }
  }

  const profile = {
    ...user,
    organization_id: effectiveOrg?.id || user.organization_id || null,
    organizations: effectiveOrg
      ? {
          id: effectiveOrg.id,
          name: effectiveOrg.name,
          slug: effectiveOrg.slug || 'pg-setu',
          gst_enabled: effectiveOrg.gst_enabled,
        }
      : user.organizations || null,
  }

  return (
    <FirebaseProvider
      orgId={profile.organization_id || undefined}
      userProfile={{
        id: profile.id,
        name: profile.full_name,
        role: profile.role,
      }}
    >
      <div className="flex h-screen bg-[#F7FAF7] overflow-hidden">
        <AppSidebar role={profile.role} orgName={profile.organizations?.name ?? 'PG-SETU Management'} />
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
          <AppHeader user={profile as any} isImpersonating={Boolean((await cookies()).get('impersonated_org_id')?.value)} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-28 md:pb-6">
            {children}
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </FirebaseProvider>
  )
}
