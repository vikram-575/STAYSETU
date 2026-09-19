import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { BillingClientView } from '@/components/dashboard/billing-client-view'

interface Props {
  searchParams: Promise<{
    tab?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams
  const activeTab = params.tab || 'invoices'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const orgId = await resolveEffectiveOrgId(user)

  let invoices: any[] = []
  let outstandingResidents: any[] = []

  if (orgId && isValidUUID(orgId)) {
    try {
      const [invRes, outRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, period_start, period_end, due_date, total_paise, paid_paise, balance_paise, status, residents(id, full_name, phone, registration_number)')
          .eq('organization_id', orgId)
          .not('status', 'in', '(cancelled,draft)')
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('v_resident_current')
          .select('*')
          .eq('organization_id', orgId)
          .gt('total_outstanding_paise', 0)
          .order('total_outstanding_paise', { ascending: false }),
      ])

      invoices = invRes.data ?? []
      outstandingResidents = outRes.data ?? []
    } catch (err) {
      console.error('Failed fetching billing data:', err)
    }
  }

  return (
    <BillingClientView
      initialInvoices={invoices}
      initialOutstandingResidents={outstandingResidents}
      initialTab={activeTab}
    />
  )
}
