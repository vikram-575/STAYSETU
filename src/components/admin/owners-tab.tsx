'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Search, ShieldCheck, ShieldAlert, KeyRound,
  ExternalLink, Phone, Mail, MapPin, CheckCircle2,
  Clock, AlertTriangle, ChevronRight, X, Loader2, Edit3, Sparkles, Plus
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate } from '@/lib/utils'

interface OwnersTabProps {
  initialSearch?: string
}

export default function OwnersTab({ initialSearch = '' }: OwnersTabProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('all')

  // Impersonation state
  const [impersonatingOrgId, setImpersonatingOrgId] = useState<string | null>(null)

  // 360 Drawer state
  const [selectedOrg, setSelectedOrg] = useState<any>(null)

  // Verification modal state
  const [verifyModalOrg, setVerifyModalOrg] = useState<any>(null)
  const [targetVerificationStatus, setTargetVerificationStatus] = useState('verified')
  const [rejectionReason, setRejectionReason] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  const loadOrganizations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/organizations')
      const data = await res.json()
      if (data.success) {
        setOrganizations(data.organizations || [])
      }
    } catch (err) {
      console.error('Failed to load organizations', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  // 1-Click PG Impersonation ("Login as PG Owner")
  const handleImpersonate = async (org: any) => {
    setImpersonatingOrgId(org.id)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: org.id }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/dashboard'
      } else {
        alert(data.error || 'Failed to switch context')
      }
    } catch (err) {
      console.error('Impersonation error', err)
    } finally {
      setImpersonatingOrgId(null)
    }
  }

  // Handle Verification Status Update
  const handleUpdateVerification = async () => {
    if (!verifyModalOrg) return
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: verifyModalOrg.id,
          is_verified: targetVerificationStatus === 'verified',
          verification_status: targetVerificationStatus,
          rejection_reason: targetVerificationStatus === 'rejected' ? rejectionReason : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setVerifyModalOrg(null)
        setRejectionReason('')
        loadOrganizations()
      } else {
        alert(data.error || 'Failed to update verification status')
      }
    } catch (err) {
      console.error('Verification error', err)
    } finally {
      setVerifyLoading(false)
    }
  }

  const filteredOrgs = organizations.filter((org) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'verified' && !org.is_verified) return false
      if (statusFilter === 'unverified' && org.is_verified) return false
      if (statusFilter === 'active' && org.subscription_status !== 'active') return false
      if (statusFilter === 'trial' && org.subscription_status !== 'trial') return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      org.name?.toLowerCase().includes(q) ||
      org.city?.toLowerCase().includes(q) ||
      org.phone?.toLowerCase().includes(q) ||
      org.email?.toLowerCase().includes(q) ||
      org.owner?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            PG Owners CRM & Verification Workflow
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage partner operators, SaaS subscription tiers, KYC reviews, and 1-click platform impersonation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/onboarding?returnTo=/admin"
            className="py-2 px-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Onboard New PG (Wizard)</span>
          </Link>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">All Owners & Statuses</option>
            <option value="verified">Verified Operators</option>
            <option value="unverified">Pending Verification</option>
            <option value="active">Active Subscribers</option>
            <option value="trial">Trial Accounts</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by PG name, city, owner name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
            />
          </div>
          <span className="text-xs text-slate-400">
            Total: <span className="text-white font-bold">{filteredOrgs.length}</span> partners
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">PG Business / Enterprise</th>
                <th className="px-4 py-3">Owner Contact</th>
                <th className="px-4 py-3">Fleet Capacity</th>
                <th className="px-4 py-3">Subscription Tier</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3 text-right">Super Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-400">No PG organizations matching your search criteria.</p>
                    <Link
                      href="/onboarding?returnTo=/admin"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline mt-2 font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Launch 7-Step Enterprise Onboarding Wizard →
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{org.name}</span>
                        {org.is_verified && (
                          <span title="Verified PG Operator">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {org.city || 'India'} {org.address ? `· ${org.address}` : ''}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">
                        {org.owner?.full_name || 'Registered Owner'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{org.phone || org.owner?.phone || 'No phone'}</span>
                        <span>·</span>
                        <span>{org.email || org.owner?.email || 'No email'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-slate-200">
                        {org.total_beds || 0} Beds
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-0.5">
                        {org.occupied_beds || 0} Occupied ({org.occupancy_rate || 0}%)
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {org.subscription_plan || 'Pro Plan'}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Status: <span className="text-emerald-400 font-semibold">{org.subscription_status || 'active'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setVerifyModalOrg(org)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                          org.is_verified
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        {org.is_verified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {org.is_verified ? 'Verified' : 'Review KYC'}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                      >
                        360° View
                      </button>

                      <button
                        onClick={() => handleImpersonate(org)}
                        disabled={impersonatingOrgId === org.id}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/30 transition inline-flex items-center gap-1"
                        title="Login as PG Owner into their ERP Dashboard"
                      >
                        {impersonatingOrgId === org.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <KeyRound className="w-3 h-3 text-blue-400" />
                        )}
                        <span>Login as PG</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Owner 360 Slide-Over Drawer */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PG Partner Profile</span>
                <h3 className="text-lg font-black text-white mt-0.5">{selectedOrg.name}</h3>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Fleet Inventory</span>
                <div className="text-xl font-black text-white mt-1">{selectedOrg.total_beds || 0} Beds</div>
                <span className="text-[10px] text-emerald-400">{selectedOrg.occupied_beds || 0} currently occupied</span>
              </div>

              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Verification Posture</span>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {selectedOrg.is_verified ? 'Verified' : 'Pending'}
                </div>
                <span className="text-[10px] text-slate-400">KYC reviewed</span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Primary Contact Info</span>
              <div className="text-slate-200">Phone: {selectedOrg.phone || 'Not recorded'}</div>
              <div className="text-slate-200">Email: {selectedOrg.email || 'Not recorded'}</div>
              <div className="text-slate-200">Location: {selectedOrg.city || 'India'}, {selectedOrg.address || ''}</div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => handleImpersonate(selectedOrg)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <KeyRound className="w-4 h-4" /> Switch to PG Dashboard as Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyModalOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white">
              KYC & Operator Verification: {verifyModalOrg.name}
            </h3>
            <p className="text-xs text-slate-400">
              Update the verification badge for this PG business. Verified partners receive trust seals and higher listing priority.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Target Verification State</label>
              <select
                value={targetVerificationStatus}
                onChange={(e) => setTargetVerificationStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="verified">Verified (Approved Partner)</option>
                <option value="under_review">Under Review</option>
                <option value="rejected">Rejected</option>
                <option value="not_submitted">Reset to Not Submitted</option>
              </select>
            </div>

            {targetVerificationStatus === 'rejected' && (
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unclear business registration or invalid utility bill..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setVerifyModalOrg(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateVerification}
                disabled={verifyLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
