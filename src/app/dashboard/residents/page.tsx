import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate, buildWhatsAppLink, buildSmsLink, initials } from '@/lib/utils'
import {
  UserPlus, Search, Filter, MessageCircle, Phone,
  FileText, ArrowRight, BedDouble, AlertTriangle, CheckCircle2,
  Clock, XCircle, MoreHorizontal, BookOpen
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    tab?: string
    search?: string
    sort?: string
  }>
}

export default async function ResidentsPage({ searchParams }: Props) {
  const params = await searchParams
  const activeTab = params.tab || 'all'
  const searchQuery = params.search || ''
  const sortBy = params.sort || 'name'

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

  // Query resident view
  let query = supabase
    .from('v_resident_current')
    .select('*')
    .eq('organization_id', orgId)

  if (activeTab === 'active') {
    query = query.eq('status', 'active')
  } else if (activeTab === 'checked_out') {
    query = query.eq('status', 'checked_out')
  } else if (activeTab === 'overdue') {
    query = query.gt('total_outstanding_paise', 0).eq('status', 'active')
  }

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,registration_number.ilike.%${searchQuery}%`)
  }

  if (sortBy === 'outstanding') {
    query = query.order('total_outstanding_paise', { ascending: false })
  } else {
    query = query.order('full_name', { ascending: true })
  }

  const { data: residents } = await query

  // Counts for tabs
  const { count: totalCount } = await supabase
    .from('residents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: activeCount } = await supabase
    .from('residents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  const { count: checkedOutCount } = await supabase
    .from('residents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'checked_out')

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Permanent Registration ID · Digital Ledger · KYC & Occupancy History
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/residents/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm shadow-blue-200"
          >
            <UserPlus className="w-4 h-4" />
            Check In Resident
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
            <Link
              href={`/dashboard/residents?tab=all${searchQuery ? `&search=${searchQuery}` : ''}`}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              All ({totalCount ?? 0})
            </Link>
            <Link
              href={`/dashboard/residents?tab=active${searchQuery ? `&search=${searchQuery}` : ''}`}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Active ({activeCount ?? 0})
            </Link>
            <Link
              href={`/dashboard/residents?tab=overdue${searchQuery ? `&search=${searchQuery}` : ''}`}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'overdue' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              With Due Balance
            </Link>
            <Link
              href={`/dashboard/residents?tab=checked_out${searchQuery ? `&search=${searchQuery}` : ''}`}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all',
                activeTab === 'checked_out' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Checked Out ({checkedOutCount ?? 0})
            </Link>
          </div>

          {/* Search & Sort Form */}
          <form method="GET" className="flex items-center gap-2">
            <input type="hidden" name="tab" value={activeTab} />
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search name, phone, PG-ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <select
              name="sort"
              defaultValue={sortBy}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="outstanding">Highest Outstanding</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Residents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/50 uppercase tracking-wider">
                <th className="py-3 px-3">Resident & ID</th>
                <th className="py-3 px-3">Room / Bed</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Monthly Rent</th>
                <th className="py-3 px-3">Outstanding</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {residents && residents.length > 0 ? (
                residents.map((r) => {
                  const message = `Hello ${r.full_name}, your PG balance is ${formatCurrency(r.total_outstanding_paise)}. Reg No: ${r.registration_number}. Please clear your dues. Thank you!`
                  const waLink = buildWhatsAppLink(r.phone, message)
                  const smsLink = buildSmsLink(r.phone, message)

                  return (
                    <tr key={r.resident_id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                            {r.photo_url ? (
                              <img src={r.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              initials(r.full_name)
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/residents/${r.resident_id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 transition"
                            >
                              {r.full_name}
                            </Link>
                            <p className="font-mono text-[11px] text-gray-500">{r.registration_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {r.room_number ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-800">
                              Room {r.room_number}
                              {r.bed_label ? ` · Bed ${r.bed_label}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No Active Bed</span>
                        )}
                        <p className="text-[10px] text-gray-400">
                          {r.building_name ? `${r.building_name} (${r.floor_name ?? ''})` : ''}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="text-gray-800">{r.phone}</p>
                        {r.email && <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{r.email}</p>}
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-800">
                        {r.monthly_rent_paise ? formatCurrency(r.monthly_rent_paise) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {r.total_outstanding_paise > 0 ? (
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                            {formatCurrency(r.total_outstanding_paise)}
                          </span>
                        ) : (
                          <span className="text-green-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ₹0 (Clear)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            r.status === 'active'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          )}
                        >
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Send WhatsApp from this device"
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={smsLink}
                            title="Send SMS"
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <Link
                            href={`/dashboard/ledger?resident=${r.resident_id}`}
                            title="View Digital Ledger"
                            className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/residents/${r.resident_id}`}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-semibold text-gray-700 transition"
                          >
                            Profile →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No residents found matching criteria.
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
