import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrg } from '@/lib/org-helper'
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

  // Check lock state for un-onboarded owners: ERP platform remains locked until SuperAdmin unlocks
  if (!isSuperAdmin && user.role === 'owner') {
    const cookieStore = await cookies()
    const isCookieLocked = cookieStore.get('erp_locked')?.value === 'true'

    if (isCookieLocked) {
      return <LockedErpScreen owner={user} />
    }

    const effectiveOrg = await resolveEffectiveOrg(user)
    if (!effectiveOrg || !effectiveOrg.id) {
      return <LockedErpScreen owner={user} />
    }

    // Verify against Firestore owner profile
    try {
      const { queryDocuments } = await import('@/lib/firebase/firestore')
      const cleanedMobile = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''
      if (cleanedMobile) {
        const ownerDocs = await queryDocuments('owner_profiles', [
          { field: 'mobile', operator: '==', value: cleanedMobile },
        ])
        if (ownerDocs && ownerDocs.length > 0) {
          const ownerDoc = ownerDocs[0]
          if (ownerDoc.erp_unlocked === false) {
            return <LockedErpScreen owner={user} />
          }
        }
      }
    } catch (err) {
      console.warn('[Dashboard Layout Owner Check Warning]:', err)
    }
  }

  // Ensure robust effective organization context is provided
  const effectiveOrg = await resolveEffectiveOrg(user)

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
          <AppHeader user={profile as any} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-28 md:pb-6">
            {children}
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </FirebaseProvider>
  )
}
