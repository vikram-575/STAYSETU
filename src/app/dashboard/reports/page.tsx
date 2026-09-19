import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { ReportsClientView } from '@/components/dashboard/reports-client-view'

interface Props {
  searchParams: Promise<{
    type?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const reportType = params.type || 'revenue'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const orgId = await resolveEffectiveOrgId(user)

  let invoices: any[] = []
  let payments: any[] = []
  let expenses: any[] = []
  let residents: any[] = []

  if (orgId && isValidUUID(orgId)) {
    try {
      const [invRes, payRes, expRes, resRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, period_start, period_end, total_paise, paid_paise, balance_paise, status, residents(full_name, phone, registration_number)')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('payments')
          .select('id, payment_number, payment_date, payment_method, transaction_id, amount_paise, residents(full_name, phone, registration_number)')
          .eq('organization_id', orgId)
          .order('payment_date', { ascending: false })
          .limit(300),
        supabase
          .from('expenses')
          .select('id, expense_date, category, description, vendor, amount_paise')
          .eq('organization_id', orgId)
          .order('expense_date', { ascending: false })
          .limit(300),
        supabase
          .from('v_resident_current')
          .select('resident_id, full_name, registration_number, room_number, bed_label, phone, monthly_rent_paise, check_in_date, status, total_outstanding_paise')
          .eq('organization_id', orgId)
          .order('full_name')
          .limit(300),
      ])

      invoices = invRes.data ?? []
      payments = payRes.data ?? []
      expenses = expRes.data ?? []
      residents = resRes.data ?? []
    } catch (err) {
      console.error('Failed fetching reports data:', err)
    }
  }

  return (
    <ReportsClientView
      initialType={reportType}
      invoices={invoices}
      payments={payments}
      expenses={expenses}
      residents={residents}
    />
  )
}
