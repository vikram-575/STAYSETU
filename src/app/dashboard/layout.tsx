import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppSidebar from '@/components/layout/app-sidebar'
import AppHeader from '@/components/layout/app-header'
import MobileBottomNav from '@/components/layout/mobile-bottom-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user profile
  let { data: profile } = await supabase
    .from('users')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.organization_id) {
    // Auto-link to default organization if available
    const { data: defaultOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (defaultOrg) {
      const { data: newProfile } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          organization_id: defaultOrg.id,
          email: user.email || 'owner@saipg.com',
          full_name: user.user_metadata?.full_name || 'PG Owner',
          role: 'owner',
          is_active: true,
        })
        .select('*, organizations(*)')
        .single()

      profile = newProfile
    }
  }

  if (!profile || !profile.organization_id) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AppSidebar role={profile.role} orgName={profile.organizations?.name ?? 'Sai Executive PG'} />
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        <AppHeader user={profile} />
        <main className="flex-1 overflow-auto p-3.5 sm:p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}
