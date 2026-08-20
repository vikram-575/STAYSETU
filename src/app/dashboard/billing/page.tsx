import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate, buildWhatsAppLink, buildSmsLink, initials } from '@/lib/utils'
import {
  FileText, Plus, Search, MessageCircle, Phone,
  CheckCircle2, Clock, AlertTriangle, ArrowRight, UserCheck, DollarSign
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    tab?: string
    search?: string
  }>
}

export default async function BillingPage({ searchParams }: Props) {
  const params = await searchParams
  const activeTab = params.tab || 'invoices'
  const searchQuery = params.search || ''

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

  // Stats
  const { data: monthInvoices } = await supabase
    .from('invoices')
    .select('total_paise, paid_paise, balance_paise, status, due_date')
    .eq('organization_id', orgId)
    .not('status', 'in', '(cancelled,draft)')

  const totalBilledPaise = monthInvoices?.reduce((s, i) => s + i.total_paise, 0) ?? 0
  const totalCollectedPaise = monthInvoices?.reduce((s, i) => s + i.paid_paise, 0) ?? 0
  const totalOutstandingPaise = monthInvoices?.reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0
  const totalOverduePaise = monthInvoices
    ?.filter((i) => i.status === 'overdue' || (i.due_date < today && i.balance_paise > 0))
    .reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0

  // Invoices list
  let invoicesQuery = supabase
    .from('invoices')
    .select('*, residents(*, resident_assignments(*, beds(*, rooms(*))))')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (activeTab === 'overdue') {
    invoicesQuery = invoicesQuery.or(`status.eq.overdue,and(due_date.lt.${today},balance_paise.gt.0)`)
  } else if (activeTab === 'unpaid') {
    invoicesQuery = invoicesQuery.gt('balance_paise', 0)
  }

  const { data: invoices } = await invoicesQuery

  // Outstanding residents view
  const { data: outstandingResidents } = await supabase
    .from('v_resident_current')
    .select('*')
    .eq('organization_id', orgId)
    .gt('total_outstanding_paise', 0)
    .eq('status', 'active')
    .order('total_outstanding_paise', { ascending: false })

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoicing Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automated monthly invoices · Consumption tracking · Overdue recovery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/billing/add-charge"
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-sm"
          >
            + Add Extra Charge
          </Link>
          <Link
            href="/dashboard/billing/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Generate Invoice
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-blue-600">Total Billed</p>
          <p className="text-xl font-bold text-blue-800 mt-0.5">{formatCurrency(totalBilledPaise)}</p>
          <p className="text-[10px] text-gray-400">All generated invoices</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-green-600">Total Collected</p>
          <p className="text-xl font-bold text-green-800 mt-0.5">{formatCurrency(totalCollectedPaise)}</p>
          <p className="text-[10px] text-green-500">
            {totalBilledPaise > 0 ? Math.round((totalCollectedPaise / totalBilledPaise) * 100) : 0}% Realized
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-orange-600">Outstanding</p>
          <p className="text-xl font-bold text-orange-800 mt-0.5">{formatCurrency(totalOutstandingPaise)}</p>
          <p className="text-[10px] text-orange-500">Pending collection</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-red-600">Overdue</p>
          <p className="text-xl font-bold text-red-800 mt-0.5">{formatCurrency(totalOverduePaise)}</p>
          <p className="text-[10px] text-red-500">Past due date</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold w-fit">
        <Link
          href="/dashboard/billing?tab=invoices"
          className={cn(
            'px-4 py-1.5 rounded-md transition',
            activeTab === 'invoices' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          All Invoices
        </Link>
        <Link
          href="/dashboard/billing?tab=outstanding"
          className={cn(
            'px-4 py-1.5 rounded-md transition',
            activeTab === 'outstanding' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Who Owes Money ({outstandingResidents?.length || 0})
        </Link>
        <Link
          href="/dashboard/billing?tab=overdue"
          className={cn(
            'px-4 py-1.5 rounded-md transition',
            activeTab === 'overdue' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Overdue Invoices
        </Link>
      </div>

      {/* Who Owes Money Tab */}
      {activeTab === 'outstanding' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Outstanding Recovery Center</h2>
              <p className="text-xs text-gray-500">Click WhatsApp or SMS to send instant reminders directly from your phone.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-3 px-3">Resident</th>
                  <th className="py-3 px-3">Room / Bed</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3 text-right">Total Due</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {outstandingResidents && outstandingResidents.length > 0 ? (
                  outstandingResidents.map((r) => {
                    const msg = `Dear ${r.full_name}, your PG outstanding balance is ${formatCurrency(r.total_outstanding_paise)}. Reg No: ${r.registration_number}. Please clear your dues. Thank you!`
                    const waLink = buildWhatsAppLink(r.phone, msg)
                    const smsLink = buildSmsLink(r.phone, msg)

                    return (
                      <tr key={r.resident_id} className="hover:bg-red-50/20 transition-colors">
                        <td className="py-3 px-3">
                          <Link href={`/dashboard/residents/${r.resident_id}`} className="font-bold text-gray-900 hover:text-blue-600">
                            {r.full_name}
                          </Link>
                          <p className="font-mono text-[11px] text-gray-400">{r.registration_number}</p>
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800">
                          {r.room_number ? `Room ${r.room_number} · Bed ${r.bed_label}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-700">{r.phone}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-red-600 text-sm">
                          {formatCurrency(r.total_outstanding_paise)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                            <a
                              href={smsLink}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Phone className="w-3.5 h-3.5" /> SMS
                            </a>
                            <Link
                              href={`/dashboard/payments/new?resident=${r.resident_id}`}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition"
                            >
                              Collect →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      🎉 No outstanding dues from any resident!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices List Tab */}
      {activeTab !== 'outstanding' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {activeTab === 'overdue' ? 'Overdue Invoices' : 'All Invoices & Billing Statements'}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Resident</th>
                  <th className="py-3 px-3">Period</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices && invoices.length > 0 ? (
                  invoices.map((inv: any) => {
                    const resident = inv.residents
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                        <td className="py-3 px-3">
                          <Link href={`/dashboard/residents/${resident?.id}`} className="font-bold text-gray-900 hover:text-blue-600">
                            {resident?.full_name ?? '—'}
                          </Link>
                          <p className="font-mono text-[10px] text-gray-400">{resident?.registration_number}</p>
                        </td>
                        <td className="py-3 px-3 text-gray-700">
                          {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                        </td>
                        <td className="py-3 px-3 text-gray-700">{formatDate(inv.due_date)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900">{formatCurrency(inv.total_paise)}</td>
                        <td className="py-3 px-3 text-right font-semibold text-green-600">{formatCurrency(inv.paid_paise)}</td>
                        <td className="py-3 px-3 text-right font-bold text-red-600">{formatCurrency(inv.balance_paise)}</td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                              inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                              inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                              inv.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            )}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/dashboard/payments/new?resident=${resident?.id}&invoice=${inv.id}`}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-semibold text-gray-800 transition"
                          >
                            Pay →
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
