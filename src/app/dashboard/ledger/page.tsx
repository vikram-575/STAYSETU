import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate, formatDateTime, initials } from '@/lib/utils'
import {
  BookOpen, PlusCircle, ArrowLeft, Search, Filter,
  TrendingDown, TrendingUp, CheckCircle2, AlertCircle, FileText
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    resident?: string
    category?: string
  }>
}

export default async function DigitalLedgerPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedResidentId = params.resident || ''
  const selectedCategory = params.category || 'all'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  let orgId = user.organization_id
  if (!orgId) {
    const { data: defaultOrg } = await supabase.from('organizations').select('id').limit(1).single()
    orgId = defaultOrg?.id || 'primary'
  }

  // Active residents list for picker
  const { data: residents } = await supabase
    .from('v_resident_current')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name')

  // Target resident
  const currentResidentId = selectedResidentId || (residents && residents.length > 0 ? residents[0].resident_id : '')
  const currentResident = residents?.find((r) => r.resident_id === currentResidentId)

  // Ledger query for resident
  let ledgerQuery = supabase
    .from('ledger_entries')
    .select('*')
    .eq('organization_id', orgId)
    .order('entry_date', { ascending: false })
    .order('entry_time', { ascending: false })

  if (currentResidentId) {
    ledgerQuery = ledgerQuery.eq('resident_id', currentResidentId)
  }
  if (selectedCategory !== 'all') {
    ledgerQuery = ledgerQuery.eq('category', selectedCategory)
  }

  const { data: entries } = await ledgerQuery

  // Calculations
  const totalDebitsPaise = entries?.reduce((s, e) => s + e.debit_paise, 0) || 0
  const totalCreditsPaise = entries?.reduce((s, e) => s + e.credit_paise, 0) || 0
  const currentBalancePaise = currentResident?.total_outstanding_paise || 0

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Resident Digital Ledger</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Immutable, append-only financial accounting trail · Adjustments & Reversals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/billing/add-charge${currentResidentId ? `?resident=${currentResidentId}` : ''}`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> Add Charge
          </Link>
          <Link
            href={`/dashboard/payments/new${currentResidentId ? `?resident=${currentResidentId}` : ''}`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" /> Add Payment
          </Link>
        </div>
      </div>

      {/* Resident Selector Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form method="GET" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Select Resident:</label>
          <select
            name="resident"
            defaultValue={currentResidentId}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-80"
          >
            {residents?.map((r) => (
              <option key={r.resident_id} value={r.resident_id}>
                {r.full_name} ({r.registration_number}) · Room {r.room_number || '—'}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition"
          >
            View Ledger
          </button>
        </form>

        {currentResident && (
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-semibold pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-500">Current Outstanding Due:</span>
            <span className="text-base font-black text-red-600">{formatCurrency(currentBalancePaise)}</span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-red-200 shadow-2xs bg-red-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-red-600">Total Billed / Charges (Debits)</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-lg sm:text-xl font-black text-red-700 mt-1">{formatCurrency(totalDebitsPaise)}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-green-200 shadow-2xs bg-green-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-green-600">Total Paid (Credits)</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-lg sm:text-xl font-black text-green-700 mt-1">{formatCurrency(totalCreditsPaise)}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-200 shadow-2xs bg-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-600">Net Ledger Balance</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg sm:text-xl font-black text-blue-800 mt-1">{formatCurrency(currentBalancePaise)}</p>
        </div>
      </div>

      {/* Ledger Container */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">
            Statement for {currentResident?.full_name || 'Resident'}
          </h2>
          <span className="font-mono text-xs text-blue-600 font-bold">
            {currentResident?.registration_number}
          </span>
        </div>

        {/* 1. Mobile Cards View */}
        <div className="block md:hidden space-y-2.5">
          {entries && entries.length > 0 ? (
            entries.map((entry) => {
              const isDebit = entry.debit_paise > 0
              return (
                <div key={entry.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-gray-900">{entry.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="capitalize px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                          {entry.category || entry.entry_type}
                        </span>
                        {entry.reference_no && (
                          <span className="font-mono text-[10px] text-gray-400">Ref: {entry.reference_no}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isDebit ? (
                        <span className="text-sm font-black text-red-600 block">+{formatCurrency(entry.debit_paise)}</span>
                      ) : (
                        <span className="text-sm font-black text-green-600 block">-{formatCurrency(entry.credit_paise)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-500 font-medium">{formatDate(entry.entry_date)}</span>
                    <span className="text-[11px] font-bold text-gray-800">
                      Balance: {formatCurrency(entry.running_balance_paise)}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
              No ledger transactions recorded yet.
            </div>
          )}
        </div>

        {/* 2. Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase tracking-wider">
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Debit (+)</th>
                <th className="py-3 px-3 text-right">Credit (-)</th>
                <th className="py-3 px-3 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {entries && entries.length > 0 ? (
                entries.map((entry) => {
                  const isDebit = entry.debit_paise > 0
                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        'transition-colors',
                        isDebit ? 'hover:bg-red-50/30' : 'hover:bg-green-50/30'
                      )}
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-gray-600">
                        {formatDate(entry.entry_date)}
                        <span className="block text-[10px] text-gray-400">
                          {formatDateTime(entry.entry_time).split(',')[1]}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-900">{entry.description}</span>
                        {entry.reference_no && (
                          <span className="block font-mono text-[10px] text-gray-400">
                            Ref: {entry.reference_no}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">
                          {entry.category || entry.entry_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-red-600">
                        {entry.debit_paise > 0 ? `+${formatCurrency(entry.debit_paise)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-green-600">
                        {entry.credit_paise > 0 ? `-${formatCurrency(entry.credit_paise)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-gray-900">
                        {formatCurrency(entry.running_balance_paise)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No ledger transactions recorded yet.
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
