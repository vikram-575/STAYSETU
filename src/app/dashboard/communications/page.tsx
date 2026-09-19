import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectiveOrg, isValidUUID } from '@/lib/org-helper'
import { CommunicationsClientView } from '@/components/dashboard/communications-client-view'

interface Props {
  searchParams: Promise<{
    tab?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function CommunicationsPage({ searchParams }: Props) {
  const params = await searchParams
  const activeTab = params.tab || 'send'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const effectiveOrg = await resolveEffectiveOrg(user)
  const orgId = effectiveOrg?.id && isValidUUID(effectiveOrg.id) ? effectiveOrg.id : null
  const orgName = effectiveOrg?.name || user.organizations?.name || 'PG Management'

  let overdueResidents: any[] = []
  let templates: any[] = []
  let logs: any[] = []

  if (orgId && isValidUUID(orgId)) {
    try {
      const [resData, tData, lData] = await Promise.all([
        supabase
          .from('v_resident_current')
          .select('*')
          .eq('organization_id', orgId)
          .gt('total_outstanding_paise', 0)
          .eq('status', 'active')
          .order('total_outstanding_paise', { ascending: false }),
        supabase
          .from('message_templates')
          .select('*')
          .eq('organization_id', orgId),
        supabase
          .from('message_logs')
          .select('*, residents(full_name, registration_number)')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      overdueResidents = resData.data ?? []
      templates = tData.data ?? []
      logs = lData.data ?? []
    } catch (err) {
      console.error('Failed fetching communications data:', err)
    }
  }

  return (
    <CommunicationsClientView
      initialOverdueResidents={overdueResidents}
      initialTemplates={templates}
      initialLogs={logs}
      orgName={orgName}
      initialTab={activeTab}
    />
  )
}
