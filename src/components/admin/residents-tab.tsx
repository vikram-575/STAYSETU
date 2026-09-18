'use client'

import React, { useState, useEffect } from 'react'
import {
  Users2, Search, Filter, ShieldCheck, Copy, Check,
  ExternalLink, Phone, Mail, Calendar, BedDouble,
  Landmark, DollarSign, ChevronRight, X, Loader2,
  AlertCircle, Edit2, Download
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate } from '@/lib/utils'

interface ResidentsTabProps {
  initialSearch?: string
}

export default function ResidentsTab({ initialSearch = '' }: ResidentsTabProps) {
  const [loading, setLoading] = useState(true)
  const [residents, setResidents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Bulk Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const PAGE_SIZE = 25
  const [page, setPage] = useState(1)

  // 360 Drawer state
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null)
  const [profile360, setProfile360] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Rent override modal
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [newRentRupees, setNewRentRupees] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideLoading, setOverrideLoading] = useState(false)

  // CSV Export
  const downloadCSV = () => {
    const targetList = selectedIds.size > 0
      ? residents.filter((r) => selectedIds.has(r.id))
      : residents

    const headers = ['Permanent Reg #', 'Full Name', 'Phone', 'Email', 'PG Organization', 'Room', 'Bed', 'Agreed Rent (INR)', 'KYC Status', 'Tenancy Status']
    const rows = targetList.map((r: any) => [
      r.registration_number || '',
      r.full_name || '',
      r.phone || '',
      r.email || '',
      r.org_name || '',
      r.room_number || '',
      r.bed_name || '',
      ((r.agreed_rent_paise || 0) / 100).toFixed(2),
      r.is_verified ? 'Verified' : 'Pending',
      r.status || 'Active',
    ])
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `residents-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const loadResidents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/residents?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) {
        setResidents(data.residents || [])
      }
    } catch (err) {
      console.error('Failed to load residents', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResidents()
    setPage(1)
  }, [statusFilter])

  const paginatedResidents = residents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(residents.length / PAGE_SIZE)

  // Fetch 360 profile
  const openResident360 = async (residentId: string) => {
    setSelectedResidentId(residentId)
    setLoadingProfile(true)
    try {
      const res = await fetch(`/api/admin/residents?resident_id=${residentId}`)
      const data = await res.json()
      if (data.success) {
        setProfile360(data.resident)
        setNewRentRupees(data.resident?.rent_amount_paise ? String(data.resident.rent_amount_paise / 100) : '')
      }
    } catch (err) {
      console.error('Failed to fetch resident 360', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Rent Override
  const handleRentOverride = async () => {
    if (!selectedResidentId || !newRentRupees || !overrideReason.trim()) return
    setOverrideLoading(true)
    try {
      const rentPaise = Math.round(parseFloat(newRentRupees) * 100)
      const res = await fetch('/api/admin/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'override_rent',
          resident_id: selectedResidentId,
          rent_amount_paise: rentPaise,
          reason: overrideReason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowOverrideModal(false)
        setOverrideReason('')
        openResident360(selectedResidentId)
        loadResidents()
      } else {
        alert(data.error || 'Failed to override rent')
      }
    } catch (err) {
      console.error('Failed to override rent', err)
    } finally {
      setOverrideLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Users2 className="w-4 h-4 text-emerald-400" />
            Tenants Directory & Permanent Registration Numbers
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every tenant is issued a permanent <code className="text-emerald-400 font-mono">PG-2026-XXXXXX</code> number that persists across PG transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">All Tenancy Statuses</option>
            <option value="active">Active Residents</option>
            <option value="pending">Pending Check-in</option>
            <option value="checked_out">Checked Out</option>
          </select>
        </div>
      </div>

      {/* Residents Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by permanent reg # (PG-2026-...), full name, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadResidents()}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadResidents}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Search
            </button>
            <button
              onClick={downloadCSV}
              disabled={residents.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
              title="Export all filtered residents to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="p-3 bg-emerald-950/50 border-b border-emerald-800/40 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">
              {selectedIds.size} resident{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadCSV}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export Selected</span>
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedResidents.length > 0 && selectedIds.size === paginatedResidents.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(paginatedResidents.map((r: any) => r.id)))
                      else setSelectedIds(new Set())
                    }}
                    className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Permanent Reg #</th>
                <th className="px-4 py-3">Tenant Name & Contact</th>
                <th className="px-4 py-3">Assigned PG & Room</th>
                <th className="px-4 py-3">Agreed Rent</th>
                <th className="px-4 py-3">KYC Status</th>
                <th className="px-4 py-3">Tenancy Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : residents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                    No residents matching search or filter.
                  </td>
                </tr>
              ) : (
                paginatedResidents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={(e) => {
                          const next = new Set(selectedIds)
                          if (e.target.checked) next.add(r.id)
                          else next.delete(r.id)
                          setSelectedIds(next)
                        }}
                        className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded text-[11px]">
                          {r.registration_number || `PG-2026-${r.id.slice(0, 6).toUpperCase()}`}
                        </span>
                        <button
                          onClick={() => handleCopy(r.registration_number || `PG-2026-${r.id.slice(0, 6).toUpperCase()}`, r.id)}
                          className="p-1 text-slate-500 hover:text-white rounded"
                          title="Copy Registration Number"
                        >
                          {copiedId === r.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-100">{r.full_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{r.phone}</span>
                        {r.email && <span>· {r.email}</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{r.org_name || 'PG Partner'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.room_number ? `Room ${r.room_number}` : 'Unassigned'}
                        {r.bed_name ? ` · Bed ${r.bed_name}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-bold font-mono text-emerald-400">
                      {formatCurrency(r.rent_amount_paise || 0)}/mo
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.kyc_status === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : r.kyc_status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {r.kyc_status || 'Unverified'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {r.status || 'active'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openResident360(r.id)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition"
                      >
                        360° Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-bold text-white">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-white">{Math.min(page * PAGE_SIZE, residents.length)}</span> of{' '}
              <span className="font-bold text-white">{residents.length}</span> residents
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium transition cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 360 Profile Slide-Over Drawer */}
      {selectedResidentId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                  {profile360?.registration_number || 'PG-2026-N/A'}
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  {profile360?.full_name || 'Resident Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResidentId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingProfile ? (
              <div className="py-24 text-center">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 mt-2 font-medium">Loading 360° ledger and stay telemetry...</p>
              </div>
            ) : profile360 ? (
              <div className="space-y-6">
                {/* Stay & Room Details */}
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Current Room & PG Stay
                    </h4>
                    <button
                      onClick={() => setShowOverrideModal(true)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Rent Override
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Property / PG</span>
                      <span className="font-bold text-slate-200">{profile360.org_name || 'PG Partner'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Room / Bed</span>
                      <span className="font-bold text-slate-200">
                        Room {profile360.room_number || 'N/A'} · Bed {profile360.bed_name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Agreed Monthly Rent</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatCurrency(profile360.rent_amount_paise || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Security Deposit Held</span>
                      <span className="font-bold text-indigo-300 font-mono">
                        {formatCurrency(profile360.deposit_amount_paise || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger Stream */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Resident Passbook Ledger
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {profile360.ledger?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No ledger entries recorded yet.</p>
                    ) : (
                      profile360.ledger?.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-200 block">{item.description}</span>
                            <span className="text-[10px] text-slate-500">{formatDate(item.date)}</span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-mono font-bold block ${
                                item.type === 'payment'
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              {item.type === 'payment' ? '-' : '+'}
                              {formatCurrency(item.amount_paise)}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-slate-500">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Emergency Contact</span>
                  <div className="font-semibold text-slate-300">
                    {profile360.emergency_contact_name || 'Guardian'} · {profile360.emergency_contact_phone || 'Not provided'}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Rent Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white">
              Super Admin Rent Override
            </h3>
            <p className="text-xs text-slate-400">
              Overrides will modify the tenant's monthly billing contract and record an unalterable audit log entry.
            </p>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">New Monthly Rent (₹)</label>
              <input
                type="number"
                value={newRentRupees}
                onChange={(e) => setNewRentRupees(e.target.value)}
                placeholder="e.g. 9500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Mandatory Audit Reason</label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Approved room transfer discount or special promotional concession..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRentOverride}
                disabled={overrideLoading || !newRentRupees || !overrideReason.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
