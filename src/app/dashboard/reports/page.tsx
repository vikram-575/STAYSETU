import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import {
  FileText, Download, Printer, Filter, Calendar,
  DollarSign, CreditCard, Users, BedDouble, Zap, ShieldCheck
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    type?: string
  }>
}

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const reportType = params.type || 'revenue'

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

  // Data fetching based on report type
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, residents(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const { data: payments } = await supabase
    .from('payments')
    .select('*, residents(*)')
    .eq('organization_id', orgId)
    .order('payment_date', { ascending: false })

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('organization_id', orgId)
    .order('expense_date', { ascending: false })

  const { data: residents } = await supabase
    .from('v_resident_current')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name')

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Financial Statements</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit-ready reporting · Tax export · Occupancy & Revenue Ledgers
          </p>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold w-fit">
        {[
          { key: 'revenue', label: 'Revenue Statement' },
          { key: 'collections', label: 'Collection Register' },
          { key: 'outstanding', label: 'Outstanding Dues' },
          { key: 'expenses', label: 'Expense Audit' },
          { key: 'occupancy', label: 'Occupancy Log' },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/reports?type=${t.key}`}
            className={cn(
              'px-3 py-1.5 rounded-md transition',
              reportType === t.key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Report Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
            {reportType.replace('_', ' ')} Report
          </h2>
          <span className="text-xs text-gray-500">Live Database Export</span>
        </div>

        {/* Revenue Statement */}
        {reportType === 'revenue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Resident</th>
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{inv.residents?.full_name}</td>
                    <td className="py-2.5 px-3 text-gray-600">{formatDate(inv.period_start)} – {formatDate(inv.period_end)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{formatCurrency(inv.total_paise)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-green-600">{formatCurrency(inv.paid_paise)}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-red-600">{formatCurrency(inv.balance_paise)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-700">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Collection Register */}
        {reportType === 'collections' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-3 px-3">Payment #</th>
                  <th className="py-3 px-3">Resident</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Ref ID</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {payments?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{p.payment_number}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">{p.residents?.full_name}</td>
                    <td className="py-2.5 px-3 text-gray-600">{formatDate(p.payment_date)}</td>
                    <td className="py-2.5 px-3 uppercase font-bold text-gray-700">{p.payment_method}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{p.transaction_id || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-green-600 text-sm">
                      {formatCurrency(p.amount_paise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Outstanding Dues */}
        {reportType === 'outstanding' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-3 px-3">Resident</th>
                  <th className="py-3 px-3">Registration #</th>
                  <th className="py-3 px-3">Room / Bed</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3 text-right">Outstanding Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {residents?.filter((r) => r.total_outstanding_paise > 0).map((r) => (
                  <tr key={r.resident_id} className="hover:bg-red-50/20">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{r.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-500">{r.registration_number}</td>
                    <td className="py-2.5 px-3 text-gray-700">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</td>
                    <td className="py-2.5 px-3 text-gray-700">{r.phone}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-red-600 text-sm">
                      {formatCurrency(r.total_outstanding_paise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expenses Audit */}
        {reportType === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Vendor</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {expenses?.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-600">{formatDate(e.expense_date)}</td>
                    <td className="py-2.5 px-3 capitalize font-bold text-gray-800">{e.category.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-900">{e.description}</td>
                    <td className="py-2.5 px-3 text-gray-700">{e.vendor || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-red-600">
                      {formatCurrency(e.amount_paise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Occupancy Log */}
        {reportType === 'occupancy' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-3 px-3">Resident</th>
                  <th className="py-3 px-3">Registration #</th>
                  <th className="py-3 px-3">Room / Bed</th>
                  <th className="py-3 px-3">Monthly Rent</th>
                  <th className="py-3 px-3">Check-in Date</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {residents?.map((r) => (
                  <tr key={r.resident_id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{r.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-500">{r.registration_number}</td>
                    <td className="py-2.5 px-3 text-gray-700">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900">
                      {r.monthly_rent_paise ? formatCurrency(r.monthly_rent_paise) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{formatDate(r.check_in_date)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
