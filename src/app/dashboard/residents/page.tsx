import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { ResidentsClientView } from '@/components/dashboard/residents-client-view'

interface Props {
  searchParams: Promise<{
    tab?: string
    search?: string
    sort?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function ResidentsPage({ searchParams }: Props) {
  const params = await searchParams
  const activeTab = params.tab || 'all'
  const searchQuery = params.search || ''
  const sortBy = params.sort || 'name'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const orgId = await resolveEffectiveOrgId(user)

  let residents: any[] = []

  if (orgId && isValidUUID(orgId)) {
    try {
      const { data, error } = await supabase
        .from('v_resident_current')
        .select('*')
        .eq('organization_id', orgId)
        .order('full_name', { ascending: true })

      if (!error && data) {
        residents = data
      }
    } catch (err) {
      console.error('Failed fetching residents:', err)
    }
  }

  return (
    <ResidentsClientView
      initialResidents={residents}
      initialTab={activeTab}
      initialSearch={searchQuery}
      initialSort={sortBy}
    />
  )
}
