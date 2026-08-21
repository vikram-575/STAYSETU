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

import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'

export default async function ResidentDetailPage({ params, searchParams }: Props) {
  const { id: residentId } = await params
  const { tab: activeTab = 'overview' } = await searchParams

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  let orgId = user.organization_id
  if (!orgId) {
    const { data: defaultOrg } = await supabase.from('organizations').select('id').limit(1).single()
    orgId = defaultOrg?.id || 'primary'
  }

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

  // Pre-filled WhatsApp message with Portal Passbook Link
  const waMsg = `Hello ${resident.full_name}, your PG balance is ${formatCurrency(resident.total_outstanding_paise)} (Reg: ${resident.registration_number}). View your itemized bills, payment receipts & passbook online at: ${typeof window !== 'undefined' ? window.location.origin : ''}/portal (Login with your Phone and Date of Birth).`
  const waLink = buildWhatsAppLink(resident.phone, waMsg)
  const smsLink = buildSmsLink(resident.phone, waMsg)

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Back button & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/dashboard/residents"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Residents
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link
            href="/portal"
            target="_blank"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-2 rounded-xl transition shadow-2xs"
          >
            <FileText className="w-4 h-4" /> Tenant Passbook
          </Link>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={smsLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs"
          >
            <Phone className="w-4 h-4" /> SMS
          </a>
          <Link
            href={`/dashboard/payments/new?resident=${residentId}`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs"
          >
            <CreditCard className="w-4 h-4" /> Collect
          </Link>
          <Link
            href={`/dashboard/billing/add-charge?resident=${residentId}`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> Charge
          </Link>
          {resident.status === 'active' && (
            <>
              <Link
                href={`/dashboard/residents/${residentId}/transfer`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition"
              >
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </Link>
              <Link
                href={`/dashboard/residents/${residentId}/checkout`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-700 border border-red-200 text-xs font-bold px-3 py-2 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" /> Check Out
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Top Profile Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg sm:text-xl font-black border border-blue-200 shrink-0">
              {resident.photo_url ? (
                <img src={resident.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                initials(resident.full_name)
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">{resident.full_name}</h1>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                    resident.status === 'active'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  )}
                >
                  {resident.status.replace('_', ' ')}
                </span>
              </div>
              <p className="font-mono text-xs font-bold text-blue-600 mt-0.5">
                {resident.registration_number}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {resident.phone} {resident.email ? `· ${resident.email}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full md:w-auto">
            <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl text-center min-w-0 sm:min-w-[110px]">
              <p className="text-[10px] font-bold text-red-600 uppercase truncate">Outstanding</p>
              <p className="text-sm sm:text-base font-black text-red-700 mt-0.5 truncate">
                {formatCurrency(resident.total_outstanding_paise)}
              </p>
            </div>
            <div className="p-3 bg-green-50/70 border border-green-100 rounded-xl text-center min-w-0 sm:min-w-[110px]">
              <p className="text-[10px] font-bold text-green-600 uppercase truncate">Total Paid</p>
              <p className="text-sm sm:text-base font-black text-green-700 mt-0.5 truncate">
                {formatCurrency(resident.total_paid_paise)}
              </p>
            </div>
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-center min-w-0 sm:min-w-[110px]">
              <p className="text-[10px] font-bold text-purple-600 uppercase truncate">Deposit Held</p>
              <p className="text-sm sm:text-base font-black text-purple-700 mt-0.5 truncate">
                {formatCurrency(resident.deposit_held_paise)}
              </p>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center min-w-0 sm:min-w-[110px]">
              <p className="text-[10px] font-bold text-blue-600 uppercase truncate">Monthly Rent</p>
              <p className="text-sm sm:text-base font-black text-blue-700 mt-0.5 truncate">
                {resident.monthly_rent_paise ? formatCurrency(resident.monthly_rent_paise) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs with horizontal scroll */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold w-max">
          {[
            { key: 'overview', label: 'Overview & KYC' },
            { key: 'ledger', label: `Digital Ledger (${ledgerEntries?.length ?? 0})` },
            { key: 'invoices', label: `Invoices (${invoices?.length ?? 0})` },
            { key: 'payments', label: `Payments (${payments?.length ?? 0})` },
            { key: 'documents', label: `Documents (${documents?.length ?? 0})` },
            { key: 'history', label: `History (${assignments?.length ?? 0})` },
          ].map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/residents/${residentId}?tab=${t.key}`}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition whitespace-nowrap',
                activeTab === t.key
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Current Assignment */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-600 shrink-0" /> Current Room & Bed
            </h3>
            {resident.room_number ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Building</span>
                  <span className="font-bold text-gray-900">{resident.building_name ?? '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Floor & Room</span>
                  <span className="font-bold text-gray-900">
                    {resident.floor_name} · Room {resident.room_number}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Bed Number</span>
                  <span className="font-black text-blue-600">Bed {resident.bed_label}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Check-in Date</span>
                  <span className="font-bold text-gray-900">{formatDate(resident.check_in_date)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Monthly Rent</span>
                  <span className="font-bold text-gray-900">
                    {resident.monthly_rent_paise ? formatCurrency(resident.monthly_rent_paise) : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Billing Cycle</span>
                  <span className="font-bold text-gray-900">{resident.billing_cycle_day ?? 1}st of month</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No active bed assignment.</p>
            )}
          </div>

          {/* Personal & KYC */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-600 shrink-0" /> Personal & KYC Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Full Name</span>
                <span className="font-bold text-gray-900">{fullResident?.full_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Gender / DOB</span>
                <span className="font-bold text-gray-900">
                  {fullResident?.gender ?? '—'} · {formatDate(fullResident?.date_of_birth)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">ID Proof Type</span>
                <span className="font-bold uppercase text-gray-900">{fullResident?.id_type ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">ID Number</span>
                <span className="font-mono font-bold text-gray-900">{fullResident?.id_number ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Permanent Address</span>
                <span className="font-medium text-right text-gray-900 max-w-[180px] truncate">
                  {fullResident?.permanent_address ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">City / State</span>
                <span className="font-bold text-gray-900">
                  {fullResident?.permanent_city ?? '—'}, {fullResident?.permanent_state ?? ''}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" /> Emergency Contact
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Contact Name</span>
                <span className="font-bold text-gray-900">{fullResident?.emergency_name ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Relationship</span>
                <span className="font-bold text-gray-900">{fullResident?.emergency_relation ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Emergency Phone</span>
                <span className="font-black text-blue-600">{fullResident?.emergency_phone ?? '—'}</span>
              </div>
              <div className="py-1.5">
                <span className="text-gray-500 block mb-1 font-semibold">Notes / Special Instructions:</span>
                <p className="text-gray-700 bg-gray-50 p-2.5 rounded-xl text-xs leading-relaxed border border-gray-100">
                  {fullResident?.notes || 'No specific notes recorded.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Complete Financial Ledger</h3>
              <p className="text-[11px] text-gray-500">Append-only audit trail.</p>
            </div>
            <Link
              href={`/dashboard/billing/add-charge?resident=${residentId}`}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition"
            >
              + Add Entry
            </Link>
          </div>

          {/* 1. Mobile Cards View */}
          <div className="block md:hidden space-y-2.5">
            {ledgerEntries && ledgerEntries.length > 0 ? (
              ledgerEntries.map((l) => (
                <div key={l.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-gray-900">{l.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                          {l.category ?? l.entry_type}
                        </span>
                        {l.reference_no && (
                          <span className="font-mono text-[10px] text-gray-400">Ref: {l.reference_no}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {l.debit_paise > 0 ? (
                        <span className="text-sm font-black text-red-600 block">+{formatCurrency(l.debit_paise)}</span>
                      ) : (
                        <span className="text-sm font-black text-green-600 block">-{formatCurrency(l.credit_paise)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-500 font-medium">{formatDate(l.entry_date)}</span>
                    <span className="text-[11px] font-bold text-gray-800">
                      Bal: {formatCurrency(l.running_balance_paise)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                No ledger transactions found.
              </div>
            )}
          </div>

          {/* 2. Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Monthly Invoices</h3>
            <Link
              href={`/dashboard/billing/new?resident=${residentId}`}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition"
            >
              + Create Invoice
            </Link>
          </div>

          {/* 1. Mobile Cards */}
          <div className="block md:hidden space-y-2.5">
            {invoices && invoices.length > 0 ? (
              invoices.map((inv) => (
                <div key={inv.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600 block">{inv.invoice_number}</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(inv.period_start)} – {formatDate(inv.period_end)}</p>
                    </div>
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
                No invoices generated yet.
              </div>
            )}
          </div>

          {/* 2. Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Payment Collection Records</h3>
            <Link
              href={`/dashboard/payments/new?resident=${residentId}`}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition"
            >
              + Record Payment
            </Link>
          </div>

          {/* 1. Mobile Cards */}
          <div className="block md:hidden space-y-2.5">
            {payments && payments.length > 0 ? (
              payments.map((p) => (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-900 block">{p.payment_number}</span>
                      <p className="text-[11px] text-gray-400">{formatDate(p.payment_date)}</p>
                    </div>
                    <span className="text-base font-black text-green-600">{formatCurrency(p.amount_paise)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">
                      {p.payment_method}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500 truncate max-w-[140px]">
                      {p.transaction_id || p.reference_no || '—'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                No payments recorded yet.
              </div>
            )}
          </div>

          {/* 2. Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Bed Assignment & Transfer History</h3>
          <div className="space-y-2.5">
            {assignments && assignments.length > 0 ? (
              assignments.map((a: any) => (
                <div key={a.id} className="p-3.5 border border-gray-200/80 rounded-2xl bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
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
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60">
                    <span className="font-black text-gray-900">{formatCurrency(a.monthly_rent_paise)} / mo</span>
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
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Secure Document Vault</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <div key={doc.id} className="p-3 border border-gray-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <FileBadge className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">{doc.doc_name}</p>
                      <p className="text-gray-400 text-[10px] uppercase">{doc.doc_type} · Status: {doc.status}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 font-bold rounded-full text-[10px] uppercase">
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
