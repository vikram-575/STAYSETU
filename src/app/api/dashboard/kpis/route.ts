import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/dashboard/kpis
 * Returns dashboard KPIs for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const orgId = profile.organization_id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [
    { data: bedStats },
    { count: activeResidents },
    { data: monthInvoices },
    { data: allOutstandingInvoices },
    { data: todayPayments },
    { data: deposits },
  ] = await Promise.all([
    supabase.from('beds').select('status').eq('organization_id', orgId),
    supabase.from('residents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
    supabase.from('invoices').select('total_paise, paid_paise, balance_paise, status').eq('organization_id', orgId).gte('period_start', monthStart).lte('period_start', monthEnd).not('status', 'in', '(cancelled,draft)'),
    supabase.from('invoices').select('balance_paise, status, due_date').eq('organization_id', orgId).not('status', 'in', '(cancelled,draft,paid)'),
    supabase.from('payments').select('amount_paise').eq('organization_id', orgId).eq('payment_date', today).eq('status', 'completed'),
    supabase.from('deposits').select('amount_paise').eq('organization_id', orgId).eq('is_refunded', false),
  ])

  const totalBeds = bedStats?.length ?? 0
  const occupiedBeds = bedStats?.filter((b) => b.status === 'occupied').length ?? 0
  const availableBeds = bedStats?.filter((b) => b.status === 'available').length ?? 0
  const maintenanceBeds = bedStats?.filter((b) => b.status === 'maintenance').length ?? 0
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
  const monthExpectedPaise = monthInvoices?.reduce((s, i) => s + i.total_paise, 0) ?? 0
  const monthCollectedPaise = monthInvoices?.reduce((s, i) => s + i.paid_paise, 0) ?? 0
  const totalOutstandingPaise = allOutstandingInvoices?.reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0
  const totalOverduePaise = allOutstandingInvoices?.filter((i) => i.status === 'overdue' || (i.due_date < today && i.balance_paise > 0)).reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0
  const todayCollectedPaise = todayPayments?.reduce((s, p) => s + p.amount_paise, 0) ?? 0
  const depositsHeldPaise = deposits?.reduce((s, d) => s + d.amount_paise, 0) ?? 0
  const collectionRate = monthExpectedPaise > 0 ? Math.round((monthCollectedPaise / monthExpectedPaise) * 100) : 0

  return NextResponse.json({
    totalBeds, occupiedBeds, availableBeds, maintenanceBeds,
    occupancyRate, activeResidents: activeResidents ?? 0,
    monthExpectedPaise, monthCollectedPaise,
    monthOutstandingPaise: monthExpectedPaise - monthCollectedPaise,
    totalOutstandingPaise, totalOverduePaise,
    todayCollectedPaise, collectionRate, depositsHeldPaise,
  })
}
