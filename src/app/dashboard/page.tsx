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
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { Sparkles, ArrowUpRight, Plus, Users, BedDouble, CreditCard } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Executive Dashboard — PG-SETU' }

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login?error=session_expired')

  const supabase = await createServiceClient()
  const orgId = await resolveEffectiveOrgId(user)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  let bedStats: any[] = []
  let activeResidents = 0
  let monthInvoices: any[] = []
  let allInvoices: any[] = []
  let todayPayments: any[] = []
  let deposits: any[] = []
  let outstandingResidents: any[] = []
  let recentPayments: any[] = []
  let revenueItems: any[] = []
  let monthlyPayments: any[] = []
  let expiringDocs = 0

  // Execute database queries safely only when a valid UUID org exists
  if (orgId && isValidUUID(orgId)) {
    try {
      const results = await Promise.allSettled([
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

      if (results[0].status === 'fulfilled') bedStats = results[0].value.data ?? []
      if (results[1].status === 'fulfilled') activeResidents = results[1].value.count ?? 0
      if (results[2].status === 'fulfilled') monthInvoices = results[2].value.data ?? []
      if (results[3].status === 'fulfilled') allInvoices = results[3].value.data ?? []
      if (results[4].status === 'fulfilled') todayPayments = results[4].value.data ?? []
      if (results[5].status === 'fulfilled') deposits = results[5].value.data ?? []
      if (results[6].status === 'fulfilled') outstandingResidents = results[6].value.data ?? []
      if (results[7].status === 'fulfilled') recentPayments = results[7].value.data ?? []
      if (results[8].status === 'fulfilled') revenueItems = results[8].value.data ?? []
      if (results[9].status === 'fulfilled') monthlyPayments = results[9].value.data ?? []
      if (results[10].status === 'fulfilled') expiringDocs = results[10].value.count ?? 0
    } catch (err) {
      console.error('Failed fetching dashboard telemetry:', err)
    }
  }

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

      {/* Fresh Setup Banner for empty/new database */}
      {totalBeds === 0 && (
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready for Inventory</span>
            </div>
            <h2 className="text-lg font-bold text-white">Welcome to your PG Executive Dashboard</h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Your system is connected and live. Get started by adding your first room and bed inventory or checking in your first resident.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/dashboard/rooms/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl transition shadow-xs"
            >
              <BedDouble className="w-3.5 h-3.5 text-emerald-700" />
              <span>Add First Room</span>
            </Link>
            <Link
              href="/dashboard/residents/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700/70 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-emerald-500/40 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Check In Resident</span>
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700/70 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-emerald-500/40 transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Complete Setup Wizard</span>
            </Link>
          </div>
        </div>
      )}

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
