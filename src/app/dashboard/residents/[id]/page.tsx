import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate, formatDateTime, buildWhatsAppLink, buildSmsLink, initials } from '@/lib/utils'
import {
  MessageCircle, Phone, CreditCard, PlusCircle, ArrowLeft,
  ShieldCheck, FileText, ArrowRightLeft, LogOut, CheckCircle2,
  Calendar, Home, UserCheck, AlertCircle, Clock, FileBadge
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ResidentDetailPage({ params, searchParams }: Props) {
  const { id: residentId } = await params
  const { tab: activeTab = 'overview' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  const orgId = profile.organization_id

  // Fetch resident with view info
  const { data: resident } = await supabase
    .from('v_resident_current')
    .select('*')
    .eq('resident_id', residentId)
    .eq('organization_id', orgId)
    .single()

  if (!resident) notFound()

  // Full resident profile record (personal details)
  const { data: fullResident } = await supabase
    .from('residents')
    .select('*')
    .eq('id', residentId)
    .single()

  // Invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('resident_id', residentId)
    .order('period_start', { ascending: false })

  // Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('resident_id', residentId)
    .order('payment_date', { ascending: false })

  // Ledger
  const { data: ledgerEntries } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('resident_id', residentId)
    .order('entry_date', { ascending: false })
    .order('entry_time', { ascending: false })

  // Assignment history
  const { data: assignments } = await supabase
    .from('resident_assignments')
    .select('*, beds(*, rooms(*, floors(*, buildings(*))))')
    .eq('resident_id', residentId)
    .order('check_in_date', { ascending: false })

  // Documents
  const { data: documents } = await supabase
    .from('resident_documents')
    .select('*')
    .eq('resident_id', residentId)
    .order('created_at', { ascending: false })

  // Pre-filled WhatsApp message
  const waMsg = `Hello ${resident.full_name}, your PG account balance is ${formatCurrency(resident.total_outstanding_paise)}. Registration Number: ${resident.registration_number}.`
  const waLink = buildWhatsAppLink(resident.phone, waMsg)
  const smsLink = buildSmsLink(resident.phone, waMsg)

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Back button & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard/residents"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Residents
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={smsLink}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm"
          >
            <Phone className="w-4 h-4" /> SMS
          </a>
          <Link
            href={`/dashboard/payments/new?resident=${residentId}`}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm"
          >
            <CreditCard className="w-4 h-4" /> Record Payment
          </Link>
          <Link
            href={`/dashboard/billing/add-charge?resident=${residentId}`}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Add Charge
          </Link>
          {resident.status === 'active' && (
            <>
              <Link
                href={`/dashboard/residents/${residentId}/transfer`}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                <ArrowRightLeft className="w-4 h-4" /> Transfer Bed
              </Link>
              <Link
                href={`/dashboard/residents/${residentId}/checkout`}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-3 py-2 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" /> Check Out
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold border border-blue-200 shrink-0">
              {resident.photo_url ? (
                <img src={resident.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                initials(resident.full_name)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{resident.full_name}</h1>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                    resident.status === 'active'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  )}
                >
                  {resident.status.replace('_', ' ')}
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-blue-600 mt-0.5">
                Permanent ID: {resident.registration_number}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {resident.phone} {resident.email ? `· ${resident.email}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-red-600 uppercase">Outstanding</p>
              <p className="text-base font-extrabold text-red-700 mt-0.5">
                {formatCurrency(resident.total_outstanding_paise)}
              </p>
            </div>
            <div className="p-3 bg-green-50/70 border border-green-100 rounded-xl text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-green-600 uppercase">Total Paid</p>
              <p className="text-base font-extrabold text-green-700 mt-0.5">
                {formatCurrency(resident.total_paid_paise)}
              </p>
            </div>
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-purple-600 uppercase">Deposit Held</p>
              <p className="text-base font-extrabold text-purple-700 mt-0.5">
                {formatCurrency(resident.deposit_held_paise)}
              </p>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-blue-600 uppercase">Monthly Rent</p>
              <p className="text-base font-extrabold text-blue-700 mt-0.5">
                {resident.monthly_rent_paise ? formatCurrency(resident.monthly_rent_paise) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 text-xs font-bold overflow-x-auto pb-px">
        {[
          { key: 'overview', label: 'Overview & KYC' },
          { key: 'ledger', label: `Digital Ledger (${ledgerEntries?.length ?? 0})` },
          { key: 'invoices', label: `Invoices (${invoices?.length ?? 0})` },
          { key: 'payments', label: `Payments (${payments?.length ?? 0})` },
          { key: 'documents', label: `Documents (${documents?.length ?? 0})` },
          { key: 'history', label: `Occupancy History (${assignments?.length ?? 0})` },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/residents/${residentId}?tab=${t.key}`}
            className={cn(
              'px-4 py-2.5 rounded-t-lg transition border-b-2 whitespace-nowrap',
              activeTab === t.key
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Assignment */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-600" /> Current Room & Bed
            </h3>
            {resident.room_number ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Building</span>
                  <span className="font-semibold text-gray-900">{resident.building_name ?? '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Floor & Room</span>
                  <span className="font-semibold text-gray-900">
                    {resident.floor_name} · Room {resident.room_number}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Bed Number</span>
                  <span className="font-bold text-blue-600">Bed {resident.bed_label}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Check-in Date</span>
                  <span className="font-semibold text-gray-900">{formatDate(resident.check_in_date)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Monthly Rent</span>
                  <span className="font-bold text-gray-900">
                    {resident.monthly_rent_paise ? formatCurrency(resident.monthly_rent_paise) : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Billing Cycle Day</span>
                  <span className="font-semibold text-gray-900">{resident.billing_cycle_day ?? 1}st of month</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No active bed assignment.</p>
            )}
          </div>

          {/* Personal & KYC */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600" /> Personal & KYC Details
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Full Name</span>
                <span className="font-semibold text-gray-900">{fullResident?.full_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Gender / DOB</span>
                <span className="font-semibold text-gray-900">
                  {fullResident?.gender ?? '—'} · {formatDate(fullResident?.date_of_birth)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">ID Proof Type</span>
                <span className="font-semibold uppercase text-gray-900">{fullResident?.id_type ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">ID Number</span>
                <span className="font-mono font-semibold text-gray-900">{fullResident?.id_number ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Permanent Address</span>
                <span className="font-medium text-right text-gray-900 max-w-[200px] truncate">
                  {fullResident?.permanent_address ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">City / State</span>
                <span className="font-semibold text-gray-900">
                  {fullResident?.permanent_city ?? '—'}, {fullResident?.permanent_state ?? ''}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600" /> Emergency Contact
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Contact Name</span>
                <span className="font-semibold text-gray-900">{fullResident?.emergency_name ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Relationship</span>
                <span className="font-semibold text-gray-900">{fullResident?.emergency_relation ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Emergency Phone</span>
                <span className="font-bold text-blue-600">{fullResident?.emergency_phone ?? '—'}</span>
              </div>
              <div className="py-1.5">
                <span className="text-gray-500 block mb-1">Notes / Special Instructions:</span>
                <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg text-xs leading-relaxed">
                  {fullResident?.notes || 'No specific notes recorded for this resident.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Complete Financial Ledger</h3>
              <p className="text-xs text-gray-500">Append-only audit trail. Adjustments and reversals recorded.</p>
            </div>
            <Link
              href={`/dashboard/billing/add-charge?resident=${residentId}`}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              + Add Ledger Entry
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Debit (+)</th>
                  <th className="py-2.5 px-3 text-right">Credit (-)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {ledgerEntries && ledgerEntries.length > 0 ? (
                  ledgerEntries.map((l) => (
                    <tr
                      key={l.id}
                      className={cn(
                        'transition-colors',
                        l.debit_paise > 0 ? 'hover:bg-red-50/30' : 'hover:bg-green-50/30'
                      )}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap text-gray-600">
                        {formatDate(l.entry_date)} <span className="text-[10px] text-gray-400">{formatDateTime(l.entry_time).split(',')[1]}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-gray-900">{l.description}</span>
                        {l.reference_no && (
                          <span className="block font-mono text-[10px] text-gray-400">Ref: {l.reference_no}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                          {l.category ?? l.entry_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600">
                        {l.debit_paise > 0 ? `+${formatCurrency(l.debit_paise)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-green-600">
                        {l.credit_paise > 0 ? `-${formatCurrency(l.credit_paise)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-gray-900">
                        {formatCurrency(l.running_balance_paise)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No ledger transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Monthly Invoices & Statements</h3>
            <Link
              href={`/dashboard/billing/new?resident=${residentId}`}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              + Create Invoice
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Billing Period</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {invoices && invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                      <td className="py-2.5 px-3 text-gray-700">
                        {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">{formatDate(inv.due_date)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{formatCurrency(inv.total_paise)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-green-600">{formatCurrency(inv.paid_paise)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-red-600">{formatCurrency(inv.balance_paise)}</td>
                      <td className="py-2.5 px-3">
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No invoices generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Payment Collection Records</h3>
            <Link
              href={`/dashboard/payments/new?resident=${residentId}`}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
            >
              + Record Payment
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-2.5 px-3">Payment #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Transaction / Ref ID</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {payments && payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{p.payment_number}</td>
                      <td className="py-2.5 px-3 text-gray-700">{formatDate(p.payment_date)}</td>
                      <td className="py-2.5 px-3 uppercase font-semibold text-gray-700">{p.payment_method}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{p.transaction_id || p.reference_no || '—'}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-green-600">{formatCurrency(p.amount_paise)}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab (Transfers & Stay Periods) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Bed Assignment & Transfer History</h3>
          <div className="space-y-3">
            {assignments && assignments.length > 0 ? (
              assignments.map((a: any, idx) => (
                <div key={a.id} className="p-3.5 border border-gray-100 rounded-xl bg-gray-50/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900">
                      {a.beds?.rooms?.buildings?.name ?? 'Building'} · Room {a.beds?.rooms?.room_number ?? '—'} · Bed {a.beds?.bed_label ?? '—'}
                    </p>
                    <p className="text-gray-500 mt-0.5">
                      Stay: {formatDate(a.check_in_date)} – {a.check_out_date ? formatDate(a.check_out_date) : <span className="text-green-600 font-bold">Present (Active)</span>}
                    </p>
                    {a.transfer_reason && (
                      <p className="text-[11px] text-purple-600 mt-0.5">Transfer Reason: {a.transfer_reason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(a.monthly_rent_paise)} / mo</p>
                    <span className={cn(
                      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                      !a.check_out_date ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    )}>
                      {!a.check_out_date ? 'Current' : 'Previous'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">No assignment history found.</p>
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Secure Document Vault</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <div key={doc.id} className="p-3 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileBadge className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-bold text-gray-900">{doc.doc_name}</p>
                      <p className="text-gray-400 text-[10px] uppercase">{doc.doc_type} · Status: {doc.status}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 font-bold rounded text-[10px] uppercase">
                    {doc.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-gray-400 text-xs">
                No KYC documents uploaded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
