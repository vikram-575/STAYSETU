'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Search,
  Filter, RefreshCw, UserCheck, Phone, Mail, Building2,
  Calendar, FileText, Loader2, Check, X, AlertCircle, Eye
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type KycSubTab = 'residents' | 'owners'

interface KycItem {
  id: string
  name: string
  phone: string
  email?: string
  entityType: 'resident' | 'owner'
  orgName?: string
  status: 'pending' | 'verified' | 'rejected'
  idType?: string
  idNumber?: string
  submittedAt?: string
  verifiedAt?: string
  notes?: string
}

export default function KycTab() {
  const [subTab, setSubTab] = useState<KycSubTab>('residents')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')

  const [residentItems, setResidentItems] = useState<KycItem[]>([])
  const [ownerItems, setOwnerItems] = useState<KycItem[]>([])

  // Modal State
  const [reviewItem, setReviewItem] = useState<KycItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionNotes, setRejectionNotes] = useState('')

  const loadKycData = async () => {
    setLoading(true)
    try {
      // 1. Load residents from admin residents API
      const resResidents = await fetch('/api/admin/residents')
      const dataResidents = await resResidents.json()
      if (dataResidents.success && Array.isArray(dataResidents.residents)) {
        const mappedResidents: KycItem[] = dataResidents.residents.map((r: any) => ({
          id: r.id,
          name: r.full_name || 'Resident',
          phone: r.phone || '',
          email: r.email || '',
          entityType: 'resident' as const,
          orgName: r.property_name || r.organizations?.name || 'PG Residence',
          status: r.is_verified ? 'verified' : (r.kyc_status || 'pending'),
          idType: 'Aadhaar e-KYC',
          idNumber: r.id_number_masked || 'XXXX-XXXX-XXXX',
          submittedAt: r.created_at,
          notes: r.kyc_notes,
        }))
        setResidentItems(mappedResidents)
      }

      // 2. Load owners from admin organizations API
      const resOwners = await fetch('/api/admin/organizations')
      const dataOwners = await resOwners.json()
      if (dataOwners.success && Array.isArray(dataOwners.organizations)) {
        const mappedOwners: KycItem[] = dataOwners.organizations.map((o: any) => ({
          id: o.id,
          name: o.owner_name || o.name || 'Owner',
          phone: o.owner_phone || o.phone || '',
          email: o.owner_email || o.email || '',
          entityType: 'owner' as const,
          orgName: o.name,
          status: o.is_verified ? 'verified' : (o.verification_status || 'pending'),
          idType: 'Government Business / PAN',
          idNumber: o.gstin || o.pan || 'Provided in CRM',
          submittedAt: o.created_at,
        }))
        setOwnerItems(mappedOwners)
      }
    } catch (err) {
      console.error('Failed to load KYC verification data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKycData()
  }, [])

  const handleApprove = async (item: KycItem) => {
    setActionLoading(true)
    try {
      if (item.entityType === 'resident') {
        await fetch('/api/admin/residents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_kyc',
            resident_id: item.id,
            status: 'verified',
          }),
        })
      } else {
        await fetch('/api/admin/organizations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: item.id,
            is_verified: true,
            verification_status: 'verified',
          }),
        })
      }
      setReviewItem(null)
      loadKycData()
    } catch (err) {
      console.error('Approval failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (item: KycItem) => {
    setActionLoading(true)
    try {
      if (item.entityType === 'resident') {
        await fetch('/api/admin/residents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_kyc',
            resident_id: item.id,
            status: 'rejected',
            notes: rejectionNotes,
          }),
        })
      } else {
        await fetch('/api/admin/organizations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: item.id,
            is_verified: false,
            verification_status: 'rejected',
            rejection_reason: rejectionNotes,
          }),
        })
      }
      setReviewItem(null)
      setRejectionNotes('')
      loadKycData()
    } catch (err) {
      console.error('Rejection failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  const currentList = subTab === 'residents' ? residentItems : ownerItems
  const filteredList = currentList.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.orgName || '').toLowerCase().includes(q)
    )
  })

  const pendingCount = currentList.filter((i) => i.status === 'pending').length

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white tracking-tight">Aadhaar & Identity KYC Queue</h2>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit official government identity verifications powered by Sandbox Live Aadhaar e-KYC.
          </p>
        </div>

        <button
          onClick={loadKycData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Refresh Queue
        </button>
      </div>

      {/* Sub-Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setSubTab('residents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              subTab === 'residents'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tenant Aadhaar KYC ({residentItems.length})
          </button>
          <button
            onClick={() => setSubTab('owners')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              subTab === 'owners'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Owner Platform KYC ({ownerItems.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, mobile, PG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Verification Statuses</option>
            <option value="pending">Pending Audit</option>
            <option value="verified">Verified (Approved)</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* KYC Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Phone / Contact</th>
                <th className="px-4 py-3">Property / Campus</th>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    No verification records found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100 block">{item.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.entityType === 'resident' ? 'Tenant Resident' : 'PG Owner / Partner'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono text-slate-300 block">{item.phone}</span>
                      {item.email && <span className="text-[10px] text-slate-500">{item.email}</span>}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300 font-medium">
                      {item.orgName || 'Platform General'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                        {item.idType || 'Aadhaar Live'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase inline-flex items-center gap-1 ${
                          item.status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : item.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {item.status === 'verified' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : item.status === 'rejected' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setReviewItem(item)}
                        className="px-3 py-1 bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-400 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-emerald-400" />
                        <span>Audit KYC</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Decision Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Audit Identity Document: {reviewItem.name}
              </h3>
              <button
                onClick={() => setReviewItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Applicant:</span>
                <span className="font-bold text-white">{reviewItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mobile:</span>
                <span className="font-mono text-slate-300">{reviewItem.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Type:</span>
                <span className="font-mono text-emerald-400 font-bold">{reviewItem.idType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Identifier Mask:</span>
                <span className="font-mono text-slate-300">{reviewItem.idNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Associated Property:</span>
                <span className="text-slate-200">{reviewItem.orgName}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">
                Auditor Notes / Rejection Reason (Optional for approval)
              </label>
              <textarea
                rows={3}
                placeholder="Add audit notes or reason for rejection..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleReject(reviewItem)}
                disabled={actionLoading}
                className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject KYC</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReviewItem(null)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprove(reviewItem)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Approve & Verify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
