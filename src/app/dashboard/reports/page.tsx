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

  // Parallel Data Fetching
  const [
    { data: invoices },
    { data: payments },
    { data: expenses },
    { data: residents },
  ] = await Promise.all([
    supabase.from('invoices').select('*, residents(*)').eq('organization_id', orgId).order('created_at', { ascending: false }),
    supabase.from('payments').select('*, residents(*)').eq('organization_id', orgId).order('payment_date', { ascending: false }),
    supabase.from('expenses').select('*').eq('organization_id', orgId).order('expense_date', { ascending: false }),
    supabase.from('v_resident_current').select('*').eq('organization_id', orgId).order('full_name'),
  ])

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Reports & Financial Statements</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Audit-ready reporting · Tax export · Occupancy & Revenue Ledgers
          </p>
        </div>
      </div>

      {/* Report Types Tabs with horizontal scroll */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold w-max">
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
                'px-3.5 py-1.5 rounded-lg transition whitespace-nowrap',
                reportType === t.key ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Report Table Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wide">
            {reportType.replace('_', ' ')} Report
          </h2>
          <span className="text-[11px] text-gray-500 font-medium">Live Database Export</span>
        </div>

        {/* Revenue Statement */}
        {reportType === 'revenue' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {invoices && invoices.length > 0 ? (
                invoices.map((inv: any) => (
                  <div key={inv.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600 block">{inv.invoice_number}</span>
                        <p className="font-bold text-xs text-gray-900 mt-0.5">{inv.residents?.full_name}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-700">
                        {inv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded-xl border border-gray-100 text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Total</span>
                        <span className="font-bold text-gray-900">{formatCurrency(inv.total_paise)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Paid</span>
                        <span className="font-bold text-green-600">{formatCurrency(inv.paid_paise)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Balance</span>
                        <span className="font-black text-red-600">{formatCurrency(inv.balance_paise)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  No invoices found.
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
          </div>
        )}

        {/* Collection Register */}
        {reportType === 'collections' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {payments && payments.length > 0 ? (
                payments.map((p: any) => (
                  <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-gray-900 block">{p.payment_number}</span>
                        <p className="font-bold text-xs text-gray-900 mt-0.5">{p.residents?.full_name}</p>
                      </div>
                      <span className="text-base font-black text-green-600">{formatCurrency(p.amount_paise)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">
                        {p.payment_method}
                      </span>
                      <span className="text-[10px] text-gray-500">{formatDate(p.payment_date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  No payments found.
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
          </div>
        )}

        {/* Outstanding Dues */}
        {reportType === 'outstanding' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {residents?.filter((r) => r.total_outstanding_paise > 0).map((r) => (
                <div key={r.resident_id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">{r.full_name}</h3>
                      <p className="text-[11px] text-gray-500">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</p>
                    </div>
                    <span className="text-base font-black text-red-600">{formatCurrency(r.total_outstanding_paise)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <span className="font-mono text-[10px] text-gray-500">{r.registration_number}</span>
                    <span className="text-[10px] text-gray-700 font-bold">{r.phone}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
          </div>
        )}

        {/* Expenses Audit */}
        {reportType === 'expenses' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {expenses?.map((e) => (
                <div key={e.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="capitalize font-bold text-xs text-gray-900 block">{e.category.replace('_', ' ')}</span>
                      <p className="text-xs text-gray-600">{e.description}</p>
                    </div>
                    <span className="text-base font-black text-red-600">{formatCurrency(e.amount_paise)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <span className="text-[11px] text-gray-600">{e.vendor || 'General'}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(e.expense_date)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
          </div>
        )}

        {/* Occupancy Log */}
        {reportType === 'occupancy' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {residents?.map((r) => (
                <div key={r.resident_id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900">{r.full_name}</h3>
                      <p className="text-[11px] text-gray-500">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                      {r.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-900">
                      {r.monthly_rent_paise ? formatCurrency(r.monthly_rent_paise) : '—'} / mo
                    </span>
                    <span className="text-[10px] text-gray-500">Since {formatDate(r.check_in_date)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
          </div>
        )}
      </div>
    </div>
  )
}
