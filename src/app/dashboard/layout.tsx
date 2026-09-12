import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrg } from '@/lib/org-helper'
import AppSidebar from '@/components/layout/app-sidebar'
import AppHeader from '@/components/layout/app-header'
import MobileBottomNav from '@/components/layout/mobile-bottom-nav'
import { FirebaseProvider } from '@/components/FirebaseProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login?error=session_expired')
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
