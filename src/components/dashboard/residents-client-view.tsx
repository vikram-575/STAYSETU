'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate, buildWhatsAppLink, buildSmsLink, initials } from '@/lib/utils'
import {
  UserPlus, Search, Filter, MessageCircle, Phone,
  FileText, ArrowRight, BedDouble, AlertTriangle, CheckCircle2,
  Clock, XCircle, MoreHorizontal, BookOpen, X
} from 'lucide-react'

interface ResidentsClientViewProps {
  initialResidents: any[]
  initialTab?: string
  initialSearch?: string
  initialSort?: string
}

export function ResidentsClientView({
  initialResidents = [],
  initialTab = 'all',
  initialSearch = '',
  initialSort = 'name',
}: ResidentsClientViewProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState(initialSort)

  // Instant tab change without server roundtrip
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tabKey)
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Pre-calculated counts
  const totalCount = initialResidents.length
  const activeCount = useMemo(() => initialResidents.filter((r) => r.status === 'active').length, [initialResidents])
  const checkedOutCount = useMemo(() => initialResidents.filter((r) => r.status === 'checked_out').length, [initialResidents])
  const overdueCount = useMemo(() => initialResidents.filter((r) => (r.total_outstanding_paise || 0) > 0).length, [initialResidents])

  // Instant in-memory filtering & sorting
  const filteredResidents = useMemo(() => {
    let list = [...initialResidents]

    // 1. Tab filter
    if (activeTab === 'active') {
      list = list.filter((r) => r.status === 'active')
    } else if (activeTab === 'checked_out') {
      list = list.filter((r) => r.status === 'checked_out')
    } else if (activeTab === 'overdue') {
      list = list.filter((r) => (r.total_outstanding_paise || 0) > 0)
    } else if (activeTab === 'verified') {
      list = list.filter((r) => r.kyc_verified || r.status === 'active')
    }

    // 2. Search query filter
    const q = searchQuery.toLowerCase().trim()
    if (q) {
      list = list.filter((r) =>
        r.full_name?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.registration_number?.toLowerCase().includes(q) ||
        String(r.room_number || '').toLowerCase().includes(q)
      )
    }

    // 3. Sort
    if (sortBy === 'outstanding') {
      list.sort((a, b) => (b.total_outstanding_paise || 0) - (a.total_outstanding_paise || 0))
    } else {
      list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    }

    return list
  }, [initialResidents, activeTab, searchQuery, sortBy])

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Residents CRM</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Permanent Registration ID · Digital Ledger · KYC &amp; Occupancy History
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/residents/new"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200"
          >
            <UserPlus className="w-4 h-4" />
            Check In Resident
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tabs with instant 0ms switching */}
          <div className="overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold w-max">
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                All ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('active')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'active' ? 'bg-white text-blue-600 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Active ({activeCount})
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('verified')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'verified' ? 'bg-white text-emerald-600 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Verified
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('overdue')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'overdue' ? 'bg-white text-red-600 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                With Due Balance {overdueCount > 0 && `(${overdueCount})`}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('checked_out')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'checked_out' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Checked Out ({checkedOutCount})
              </button>
            </div>
          </div>

          {/* Search & Sort Form (Instant In-Memory) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, PG-ID..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="outstanding">Highest Outstanding</option>
              </select>
            </div>
          </div>
        </div>

        {/* 1. Mobile Native Card View (visible on < md screens) */}
        <div className="block md:hidden space-y-2.5 pt-2">
          {filteredResidents && filteredResidents.length > 0 ? (
            filteredResidents.map((r) => {
              const message = `Hello ${r.full_name}, your PG balance is ${formatCurrency(r.total_outstanding_paise)}. Reg No: ${r.registration_number}. Please clear your dues. Thank you!`
              const waLink = buildWhatsAppLink(r.phone, message)
              const smsLink = buildSmsLink(r.phone, message)

              return (
                <div
                  key={r.resident_id}
                  className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-3"
                >
                  {/* Top: Avatar, Name, Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Link
                        href={`/dashboard/residents/${r.resident_id}`}
                        prefetch={true}
                        className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                        title={`View profile of ${r.full_name}`}
                      >
                        {r.photo_url ? (
                          <img src={r.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          initials(r.full_name)
                        )}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/residents/${r.resident_id}`}
                          prefetch={true}
                          className="font-bold text-sm text-gray-900 hover:text-blue-600 block truncate cursor-pointer"
                        >
                          {r.full_name}
                        </Link>
                        <Link
                          href={`/dashboard/residents/${r.resident_id}`}
                          prefetch={true}
                          title={`Resident ID: ${r.registration_number} · Click to view profile`}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50/80 px-1.5 py-0.5 rounded mt-0.5 border border-blue-200/50 cursor-pointer"
                        >
                          {r.registration_number}
                        </Link>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                        r.status === 'active'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      )}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Middle: Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Room &amp; Bed</span>
                      <span className="font-bold text-gray-800">
                        {r.room_number ? `Room ${r.room_number} · Bed ${r.bed_label || '—'}` : 'No Bed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Monthly Rent</span>
                      <span className="font-bold text-gray-800">
                        {r.monthly_rent_paise ? formatCurrency(r.monthly_rent_paise) : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Phone</span>
                      <a
                        href={`tel:${(r.phone || '').replace(/\D/g, '')}`}
                        className="font-semibold text-gray-700 hover:text-blue-600 font-mono text-[11px] block cursor-pointer"
                      >
                        {r.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Outstanding Due</span>
                      {r.total_outstanding_paise > 0 ? (
                        <span className="font-black text-red-600">
                          {formatCurrency(r.total_outstanding_paise)}
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> ₹0 Clear
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: 1-Tap Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${(r.phone || '').replace(/\D/g, '')}`}
                      className="py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <Link
                      href={`/dashboard/ledger?resident=${r.resident_id}`}
                      className="py-1.5 px-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer"
                      title="Ledger"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/dashboard/residents/${r.resident_id}`}
                      prefetch={true}
                      className="py-1.5 px-3 bg-gray-100 text-gray-800 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold active:scale-95 transition cursor-pointer"
                    >
                      Profile →
                    </Link>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">No Residents Found</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Check in your first resident or adjust search filters.</p>
              </div>
              <Link
                href="/dashboard/residents/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" /> Check-in New Resident
              </Link>
            </div>
          )}
        </div>

        {/* 2. Desktop Table View (hidden on < md screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/50 uppercase tracking-wider">
                <th className="py-3 px-3">Resident &amp; ID</th>
                <th className="py-3 px-3">Room / Bed</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Monthly Rent</th>
                <th className="py-3 px-3">Outstanding</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Identity KYC</th>
                <th className="py-3 px-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredResidents && filteredResidents.length > 0 ? (
                filteredResidents.map((r) => {
                  const message = `Hello ${r.full_name}, your PG balance is ${formatCurrency(r.total_outstanding_paise)}. Reg No: ${r.registration_number}. Please clear your dues. Thank you!`
                  const waLink = buildWhatsAppLink(r.phone, message)
                  const cleanPhone = (r.phone || '').replace(/\D/g, '')

                  return (
                    <tr key={r.resident_id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/dashboard/residents/${r.resident_id}`}
                            prefetch={true}
                            className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 hover:ring-2 hover:ring-blue-400 transition cursor-pointer"
                            title={`View profile of ${r.full_name}`}
                          >
                            {r.photo_url ? (
                              <img src={r.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              initials(r.full_name)
                            )}
                          </Link>
                          <div>
                            <Link
                              href={`/dashboard/residents/${r.resident_id}`}
                              prefetch={true}
                              className="font-bold text-gray-900 hover:text-blue-600 transition block leading-tight cursor-pointer"
                            >
                              {r.full_name}
                            </Link>
                            <Link
                              href={`/dashboard/residents/${r.resident_id}`}
                              prefetch={true}
                              title={`Resident ID: ${r.registration_number} · Click to view profile`}
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50/80 hover:bg-blue-100 px-1.5 py-0.5 rounded transition mt-0.5 cursor-pointer border border-blue-200/50"
                            >
                              <span>{r.registration_number}</span>
                            </Link>
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
                        <a
                          href={`tel:${cleanPhone}`}
                          title={`Call ${r.phone}`}
                          className="text-gray-800 hover:text-blue-600 hover:underline font-mono text-xs cursor-pointer block"
                        >
                          {r.phone}
                        </a>
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
                      <td className="py-3 px-3">
                        <Link
                          href={`/dashboard/residents/${r.resident_id}#kyc`}
                          prefetch={true}
                          title={`View KYC Verification for ${r.full_name}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 hover:border-emerald-400 transition cursor-pointer shadow-2xs active:scale-95"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Send WhatsApp message to ${r.full_name}`}
                            className="p-1.5 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-lg transition active:scale-95 cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-green-200"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={`tel:${cleanPhone}`}
                            title={`Call ${r.full_name} (${r.phone})`}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition active:scale-95 cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-blue-200"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <Link
                            href={`/dashboard/ledger?resident=${r.resident_id}`}
                            title={`View Digital Ledger for ${r.full_name}`}
                            className="p-1.5 text-purple-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition active:scale-95 cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-purple-200"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/residents/${r.resident_id}`}
                            prefetch={true}
                            title={`View Profile of ${r.full_name}`}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-bold text-gray-700 transition active:scale-95 cursor-pointer inline-flex items-center gap-1 shadow-2xs"
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
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">No Residents Found</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      {searchQuery ? `No records matching "${searchQuery}"` : 'Get started by registering your first resident, or try clearing your search/filter parameters.'}
                    </p>
                    <Link
                      href="/dashboard/residents/new"
                      className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Check-in New Resident
                    </Link>
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
