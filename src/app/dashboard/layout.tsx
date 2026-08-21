import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import AppSidebar from '@/components/layout/app-sidebar'
import AppHeader from '@/components/layout/app-header'
import MobileBottomNav from '@/components/layout/mobile-bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  // If user is superadmin, ensure default org context is provided
  let profile = user

  if (!profile.organization_id) {
    const serviceClient = await createServiceClient()
    const { data: defaultOrg } = await serviceClient
      .from('organizations')
      .select('id, name, gst_enabled')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (defaultOrg) {
      profile = {
        ...profile,
        organization_id: defaultOrg.id,
        organizations: defaultOrg,
      }
    } else if (profile.role !== 'superadmin') {
      redirect('/onboarding')
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AppSidebar role={profile.role} orgName={profile.organizations?.name ?? 'PG-SETU Management'} />
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <AppHeader user={profile as any} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-28 md:pb-6">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
