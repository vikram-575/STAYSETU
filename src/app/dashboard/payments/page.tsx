import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import {
  CreditCard, Plus, Smartphone, Building2, Banknote,
  MoreHorizontal, Calendar, CheckCircle2, ShieldCheck, Scale
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    method?: string
    date?: string
  }>
}

export default async function PaymentsPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedMethod = params.method || 'all'
  const selectedDate = params.date || ''

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
  const today = new Date().toISOString().split('T')[0]

  // Payments Query
  let query = supabase
    .from('payments')
    .select('*, residents(id, full_name, registration_number, phone)')
    .eq('organization_id', orgId)
    .order('payment_time', { ascending: false })

  if (selectedMethod !== 'all') {
    query = query.eq('payment_method', selectedMethod)
  }
  if (selectedDate) {
    query = query.eq('payment_date', selectedDate)
  }

  const { data: payments } = await query

  // Collection Stats by Method for current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data: allMonthPayments } = await supabase
    .from('payments')
    .select('amount_paise, payment_method, payment_date')
    .eq('organization_id', orgId)
    .gte('payment_date', monthStart)
    .eq('status', 'completed')

  let upiTotal = 0
  let cashTotal = 0
  let bankTotal = 0
  let cardTotal = 0
  let todayTotal = 0

  allMonthPayments?.forEach((p) => {
    if (p.payment_method === 'upi') upiTotal += p.amount_paise
    else if (p.payment_method === 'cash') cashTotal += p.amount_paise
    else if (p.payment_method === 'bank_transfer') bankTotal += p.amount_paise
    else if (p.payment_method === 'card') cardTotal += p.amount_paise

    if (p.payment_date === today) todayTotal += p.amount_paise
  })

  const monthTotal = upiTotal + cashTotal + bankTotal + cardTotal

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection & Payment Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time money collection · Payment method intelligence · Daily cash control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/payments/daily-closing"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <Scale className="w-4 h-4" /> Daily Cash Closing
          </Link>
          <Link
            href="/dashboard/payments/new"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </Link>
        </div>
      </div>

      {/* Payment Method Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500">Today&apos;s Collection</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{formatCurrency(todayTotal)}</p>
          <p className="text-[10px] text-gray-400">Cash & online today</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
          <div className="flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
            <p className="text-[10px] uppercase font-bold text-purple-600">UPI Collection</p>
          </div>
          <p className="text-xl font-extrabold text-purple-800 mt-0.5">{formatCurrency(upiTotal)}</p>
          <p className="text-[10px] text-purple-500">
            {monthTotal > 0 ? Math.round((upiTotal / monthTotal) * 100) : 0}% of month
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm bg-green-50/20">
          <div className="flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5 text-green-600" />
            <p className="text-[10px] uppercase font-bold text-green-600">Cash Received</p>
          </div>
          <p className="text-xl font-extrabold text-green-800 mt-0.5">{formatCurrency(cashTotal)}</p>
          <p className="text-[10px] text-green-500">
            {monthTotal > 0 ? Math.round((cashTotal / monthTotal) * 100) : 0}% of month
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <p className="text-[10px] uppercase font-bold text-blue-600">Bank Transfer</p>
          </div>
          <p className="text-xl font-extrabold text-blue-800 mt-0.5">{formatCurrency(bankTotal)}</p>
          <p className="text-[10px] text-blue-500">NEFT / RTGS / IMPS</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500">Total Month Collection</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{formatCurrency(monthTotal)}</p>
          <p className="text-[10px] text-gray-400">All channels</p>
        </div>
      </div>

      {/* Filter by Method */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold w-fit">
        <Link
          href="/dashboard/payments?method=all"
          className={cn(
            'px-3 py-1.5 rounded-md transition',
            selectedMethod === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          All Methods
        </Link>
        <Link
          href="/dashboard/payments?method=upi"
          className={cn(
            'px-3 py-1.5 rounded-md transition',
            selectedMethod === 'upi' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          UPI
        </Link>
        <Link
          href="/dashboard/payments?method=cash"
          className={cn(
            'px-3 py-1.5 rounded-md transition',
            selectedMethod === 'cash' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Cash
        </Link>
        <Link
          href="/dashboard/payments?method=bank_transfer"
          className={cn(
            'px-3 py-1.5 rounded-md transition',
            selectedMethod === 'bank_transfer' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Bank Transfer
        </Link>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Payment Collection Log</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                <th className="py-3 px-3">Receipt / Payment #</th>
                <th className="py-3 px-3">Resident</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Transaction / Ref ID</th>
                <th className="py-3 px-3 text-right">Amount Collected</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {payments && payments.length > 0 ? (
                payments.map((p: any) => {
                  const res = p.residents
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">{p.payment_number}</td>
                      <td className="py-3 px-3">
                        <Link href={`/dashboard/residents/${res?.id}`} className="font-bold text-gray-900 hover:text-blue-600">
                          {res?.full_name ?? '—'}
                        </Link>
                        <p className="font-mono text-[10px] text-gray-400">{res?.registration_number}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-700">{formatDateTime(p.payment_time)}</td>
                      <td className="py-3 px-3">
                        <span className="uppercase font-bold text-[11px] px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">
                        {p.transaction_id || p.reference_no || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-green-600 text-sm">
                        {formatCurrency(p.amount_paise)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
