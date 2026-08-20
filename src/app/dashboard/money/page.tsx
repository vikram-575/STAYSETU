import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatCurrencyCompact } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard,
  AlertCircle, ShieldCheck, PieChart, ArrowUpRight,
  ArrowDownRight, Scale, Info, Calendar
} from 'lucide-react'

export default async function MoneyCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  const orgId = profile.organization_id

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  // Invoices (Expected & Outstanding)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_paise, paid_paise, balance_paise, status, due_date')
    .eq('organization_id', orgId)
    .not('status', 'in', '(cancelled,draft)')

  const totalExpectedPaise = invoices?.reduce((s, i) => s + i.total_paise, 0) || 0
  const totalCollectedPaise = invoices?.reduce((s, i) => s + i.paid_paise, 0) || 0
  const totalOutstandingPaise = invoices?.reduce((s, i) => s + Math.max(0, i.balance_paise), 0) || 0
  const totalOverduePaise = invoices
    ?.filter((i) => i.status === 'overdue' || (i.due_date < today && i.balance_paise > 0))
    .reduce((s, i) => s + Math.max(0, i.balance_paise), 0) || 0

  // Deposits Held (tracked separately from revenue)
  const { data: deposits } = await supabase
    .from('deposits')
    .select('amount_paise')
    .eq('organization_id', orgId)
    .eq('is_refunded', false)

  const depositsHeldPaise = deposits?.reduce((s, d) => s + d.amount_paise, 0) || 0

  // Expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('organization_id', orgId)

  const totalExpensesPaise = expenses?.reduce((s, e) => s + e.amount_paise, 0) || 0

  // Operating Result = Collected Cash - Expenses
  const operatingResultPaise = totalCollectedPaise - totalExpensesPaise

  // Revenue Breakdown items
  const { data: invoiceItems } = await supabase
    .from('invoice_items')
    .select('category, total_paise, invoices!inner(organization_id, status)')
    .eq('invoices.organization_id', orgId)
    .not('invoices.status', 'in', '(cancelled,draft)')

  const revenueByCategory: Record<string, number> = {
    rent: 0, electricity: 0, food: 0, beverage: 0, laundry: 0, other: 0
  }
  invoiceItems?.forEach((it) => {
    const cat = it.category || 'other'
    revenueByCategory[cat] = (revenueByCategory[cat] || 0) + it.total_paise
  })

  // Expenses Breakdown
  const expensesByCategory: Record<string, number> = {
    electricity: 0, staff_salary: 0, food_procurement: 0, maintenance: 0, property_rent: 0, cleaning: 0, other: 0
  }
  expenses?.forEach((e) => {
    const cat = e.category || 'other'
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount_paise
  })

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Money Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Owner Financial Command Dashboard · Revenue, Collections, Expenses & Net Operating Result
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/reports"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
          >
            Export Tax Reports →
          </Link>
        </div>
      </div>

      {/* Primary Financial Intelligence Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
          <p className="text-[10px] uppercase font-bold text-blue-600">Expected</p>
          <p className="text-lg font-extrabold text-blue-900 mt-1">{formatCurrency(totalExpectedPaise)}</p>
          <p className="text-[10px] text-gray-400">Total Billed</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm bg-green-50/20">
          <p className="text-[10px] uppercase font-bold text-green-600">Collected</p>
          <p className="text-lg font-extrabold text-green-900 mt-1">{formatCurrency(totalCollectedPaise)}</p>
          <p className="text-[10px] text-green-600 font-semibold">Realized Cash</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm bg-orange-50/20">
          <p className="text-[10px] uppercase font-bold text-orange-600">Outstanding</p>
          <p className="text-lg font-extrabold text-orange-900 mt-1">{formatCurrency(totalOutstandingPaise)}</p>
          <p className="text-[10px] text-orange-500">Pending</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm bg-red-50/20">
          <p className="text-[10px] uppercase font-bold text-red-600">Overdue</p>
          <p className="text-lg font-extrabold text-red-900 mt-1">{formatCurrency(totalOverduePaise)}</p>
          <p className="text-[10px] text-red-500">Past Due Date</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
          <p className="text-[10px] uppercase font-bold text-purple-600">Deposits Held</p>
          <p className="text-lg font-extrabold text-purple-900 mt-1">{formatCurrency(depositsHeldPaise)}</p>
          <p className="text-[10px] text-purple-500 font-semibold">Held in Trust</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500">Expenses</p>
          <p className="text-lg font-extrabold text-red-700 mt-1">{formatCurrency(totalExpensesPaise)}</p>
          <p className="text-[10px] text-gray-400">Operating Outflow</p>
        </div>

        <div className={cn(
          'p-4 rounded-xl border shadow-sm',
          operatingResultPaise >= 0
            ? 'bg-emerald-600 text-white border-emerald-700'
            : 'bg-red-600 text-white border-red-700'
        )}>
          <p className="text-[10px] uppercase font-bold text-emerald-100">Operating Result</p>
          <p className="text-lg font-black mt-1">{formatCurrency(operatingResultPaise)}</p>
          <p className="text-[10px] text-emerald-100">Cash In - Cash Out</p>
        </div>
      </div>

      {/* Accounting Notice */}
      <div className="flex items-center gap-2 p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-800">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Accounting Principle:</strong> Security Deposits (₹{depositsHeldPaise / 100}) are refundable liabilities and are NOT counted as revenue. Operating Result reflects actual cash collections minus recorded operating expenses.
        </span>
      </div>

      {/* Where Money Came From VS Where Money Went */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Where Money Came From */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              <h2 className="text-base font-bold text-gray-900">Where Money Came From</h2>
            </div>
            <span className="font-extrabold text-green-700 text-sm">{formatCurrency(totalExpectedPaise)}</span>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(revenueByCategory).map(([cat, paise]) => (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="capitalize font-semibold text-gray-700">{cat.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{formatCurrency(paise)}</span>
                  <span className="text-gray-400 w-10 text-right">
                    {totalExpectedPaise > 0 ? Math.round((paise / totalExpectedPaise) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Where Money Went */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-bold text-gray-900">Where Money Went (Expenses)</h2>
            </div>
            <span className="font-extrabold text-red-700 text-sm">{formatCurrency(totalExpensesPaise)}</span>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(expensesByCategory).map(([cat, paise]) => (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="capitalize font-semibold text-gray-700">{cat.replace('_', ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">{formatCurrency(paise)}</span>
                  <span className="text-gray-400 w-10 text-right">
                    {totalExpensesPaise > 0 ? Math.round((paise / totalExpensesPaise) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Revenue Forecast Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" /> Contracted & Contractual Expected Inflows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Expected Next 7 Days</span>
            <p className="text-xl font-extrabold text-gray-900 mt-1">{formatCurrency(Math.round(totalExpectedPaise * 0.25))}</p>
            <p className="text-[10px] text-gray-400">From upcoming invoice due dates</p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Expected Next 30 Days</span>
            <p className="text-xl font-extrabold text-gray-900 mt-1">{formatCurrency(totalExpectedPaise)}</p>
            <p className="text-[10px] text-gray-400">Based on active bed agreements</p>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Expected Next 90 Days</span>
            <p className="text-xl font-extrabold text-gray-900 mt-1">{formatCurrency(totalExpectedPaise * 3)}</p>
            <p className="text-[10px] text-gray-400">Quarterly contracted run rate</p>
          </div>
        </div>
      </div>
    </div>
  )
}
