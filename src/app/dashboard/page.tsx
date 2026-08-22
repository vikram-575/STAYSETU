import { redirect } from 'next/navigation'
import DashboardKPICards from '@/components/dashboard/kpi-cards'
import RevenueBreakdownChart from '@/components/dashboard/revenue-breakdown-chart'
import OutstandingResidentsList from '@/components/dashboard/outstanding-residents'
import RecentPaymentsFeed from '@/components/dashboard/recent-payments-feed'
import DashboardAlerts from '@/components/dashboard/alerts'
import RevenueTrendChart from '@/components/dashboard/revenue-trend-chart'
import ExpectedVsCollected from '@/components/dashboard/expected-vs-collected'
import { formatDate } from '@/lib/utils'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { Sparkles, ArrowUpRight, Plus, Users, BedDouble, Zap, CreditCard } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Executive Dashboard — PG-SETU' }

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()

  let orgId = user.organization_id

  if (!orgId) {
    const { data: defaultOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    orgId = defaultOrg?.id
  }

  if (!orgId && user.role !== 'superadmin') redirect('/onboarding')
  if (!orgId) orgId = 'primary'

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  // --- HIGH PERFORMANCE PARALLEL QUERY FETCH ---
  const [
    { data: bedStats },
    { count: activeResidents },
    { data: monthInvoices },
    { data: allInvoices },
    { data: todayPayments },
    { data: deposits },
    { data: outstandingResidents },
    { data: recentPayments },
    { data: revenueItems },
    { data: monthlyPayments },
    { count: expiringDocs },
  ] = await Promise.all([
    // 1. Bed Stats
    supabase.from('beds').select('status').eq('organization_id', orgId),
    // 2. Active Residents count
    supabase.from('residents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
    // 3. Month invoices
    supabase.from('invoices').select('total_paise, paid_paise, balance_paise, status, due_date').eq('organization_id', orgId).gte('period_start', monthStart).lte('period_start', monthEnd).not('status', 'in', '(cancelled,draft)'),
    // 4. All active invoices for total outstanding
    supabase.from('invoices').select('balance_paise, status, due_date').eq('organization_id', orgId).not('status', 'in', '(cancelled,draft,paid)'),
    // 5. Today's collections
    supabase.from('payments').select('amount_paise, payment_method').eq('organization_id', orgId).eq('payment_date', today).eq('status', 'completed'),
    // 6. Active security deposits held
    supabase.from('deposits').select('amount_paise').eq('organization_id', orgId).eq('is_refunded', false),
    // 7. Top outstanding residents
    supabase.from('v_resident_current').select('*').eq('organization_id', orgId).gt('total_outstanding_paise', 0).eq('status', 'active').order('total_outstanding_paise', { ascending: false }).limit(8),
    // 8. Recent payments feed
    supabase.from('payments').select('*, residents(full_name, registration_number)').eq('organization_id', orgId).eq('status', 'completed').order('payment_time', { ascending: false }).limit(10),
    // 9. Revenue breakdown
    supabase.from('invoice_items').select('category, total_paise, invoices!inner(organization_id, period_start, status)').eq('invoices.organization_id', orgId).gte('invoices.period_start', monthStart).lte('invoices.period_start', monthEnd).not('invoices.status', 'in', '(cancelled,draft)'),
    // 10. 6-Month revenue trend
    supabase.from('payments').select('amount_paise, payment_date').eq('organization_id', orgId).eq('status', 'completed').gte('payment_date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]).order('payment_date'),
    // 11. Expiring KYC documents
    supabase.from('resident_documents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).gt('expiry_date', today),
  ])

  const totalBeds = bedStats?.length ?? 0
  const occupiedBeds = bedStats?.filter((b) => b.status === 'occupied').length ?? 0
  const availableBeds = bedStats?.filter((b) => b.status === 'available').length ?? 0
  const maintenanceBeds = bedStats?.filter((b) => b.status === 'maintenance').length ?? 0
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const monthExpectedPaise = monthInvoices?.reduce((s, i) => s + i.total_paise, 0) ?? 0
  const monthCollectedPaise = monthInvoices?.reduce((s, i) => s + i.paid_paise, 0) ?? 0

  const totalOutstandingPaise = allInvoices?.reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0
  const totalOverduePaise = allInvoices
    ?.filter((i) => i.status === 'overdue' || (i.due_date < today && i.balance_paise > 0))
    .reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0

  const todayCollectedPaise = todayPayments?.reduce((s, p) => s + p.amount_paise, 0) ?? 0
  const collectionRate = monthExpectedPaise > 0
    ? Math.round((monthCollectedPaise / monthExpectedPaise) * 100)
    : 0

  const depositsHeldPaise = deposits?.reduce((s, d) => s + d.amount_paise, 0) ?? 0

  const revenueByCategory: Record<string, number> = {}
  revenueItems?.forEach((item) => {
    const cat = item.category ?? 'other'
    revenueByCategory[cat] = (revenueByCategory[cat] ?? 0) + item.total_paise
  })

  const overdueCount = allInvoices?.filter((i) => i.status === 'overdue' || (i.due_date < today && i.balance_paise > 0)).length ?? 0

  const kpis = {
    totalBeds, occupiedBeds, availableBeds, maintenanceBeds,
    occupancyRate, activeResidents: activeResidents ?? 0,
    monthExpectedPaise, monthCollectedPaise,
    monthOutstandingPaise: monthExpectedPaise - monthCollectedPaise,
    totalOutstandingPaise, totalOverduePaise,
    todayCollectedPaise, collectionRate, depositsHeldPaise,
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Executive Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full px-2.5 py-0.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {formatDate(today)} · Real-time PG financial & operational telemetry
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/residents/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Check In Resident</span>
          </Link>
          <Link
            href="/dashboard/payments/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Collect Rent</span>
          </Link>
        </div>
      </div>

      {/* Actionable Alerts Bar */}
      <DashboardAlerts
        overdueCount={overdueCount}
        overdueAmountPaise={totalOverduePaise}
        outstandingCount={outstandingResidents?.length ?? 0}
        expiringDocs={expiringDocs ?? 0}
        maintenanceBeds={maintenanceBeds}
        availableBeds={availableBeds}
      />

      {/* 10 Executive KPI Cards */}
      <DashboardKPICards kpis={kpis} />

      {/* Expected vs Collected Progress */}
      <ExpectedVsCollected
        expectedPaise={monthExpectedPaise}
        collectedPaise={monthCollectedPaise}
        outstandingPaise={totalOutstandingPaise}
        overduePaise={totalOverduePaise}
        collectionRate={collectionRate}
      />

      {/* Charts + Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2">
          <RevenueTrendChart payments={monthlyPayments ?? []} />
        </div>
        <RevenueBreakdownChart breakdown={revenueByCategory} />
      </div>

      {/* Outstanding + Recent Payments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <OutstandingResidentsList residents={outstandingResidents ?? []} />
        <RecentPaymentsFeed payments={recentPayments ?? []} todayPaise={todayCollectedPaise} />
      </div>
    </div>
  )
}
