'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Store, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  Eye, Search, Filter, ShieldCheck, ShieldAlert, Clock,
  Calendar, Phone, MapPin, ArrowUpRight, MessageSquare, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate } from '@/lib/utils'

export default function MarketplaceTab() {
  const [subTab, setSubTab] = useState<'listings' | 'enquiries' | 'visits'>('listings')
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Action Modals
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModalListing, setRejectModalListing] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [featureModalListing, setFeatureModalListing] = useState<any>(null)
  const [featurePriority, setFeaturePriority] = useState(1)

  const loadMarketplaceData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/marketplace?section=all&status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) {
        setListings(data.listings || [])
        setEnquiries(data.enquiries || [])
        setVisits(data.visits || [])
        setStats(data.stats || null)
      }
    } catch (err) {
      console.error('Failed to load marketplace data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarketplaceData()
  }, [statusFilter])

  // Moderation handler
  const handleModerate = async (propertyId: string, action: string, extraBody: any = {}) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          property_id: propertyId,
          ...extraBody,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setRejectModalListing(null)
        setFeatureModalListing(null)
        setRejectReason('')
        loadMarketplaceData()
      } else {
        alert(data.error || 'Failed to apply moderation action')
      }
    } catch (err) {
      console.error('Moderation failed', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Enquiry status update
  const handleUpdateEnquiry = async (enquiryId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_enquiry_status',
          enquiry_id: enquiryId,
          status,
        }),
      })
      const data = await res.json()
      if (data.success) {
        loadMarketplaceData()
      }
    } catch (err) {
      console.error('Failed to update enquiry status', err)
    }
  }

  const filteredListings = listings.filter((l) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      l.title?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.owner_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('listings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'listings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Property Listings ({stats?.totalListings || listings.length})
          </button>
          <button
            onClick={() => setSubTab('enquiries')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'enquiries'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Leads & Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setSubTab('visits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'visits'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Scheduled Visits ({visits.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/onboarding?returnTo=/admin?mode=renting"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Onboard Property (Wizard)</span>
          </Link>

          {subTab === 'listings' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="all">All Moderation Statuses</option>
              <option value="pending">Pending Moderation</option>
              <option value="approved">Approved & Live</option>
              <option value="featured">Featured Slots</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {/* 1. LISTINGS MODERATION TABLE */}
      {subTab === 'listings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search listing, city, owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{filteredListings.length}</span> listings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Property / Campus</th>
                  <th className="px-4 py-3">Owner / Partner</th>
                  <th className="px-4 py-3">Type & Capacity</th>
                  <th className="px-4 py-3">Starting Rent</th>
                  <th className="px-4 py-3">Moderation Status</th>
                  <th className="px-4 py-3">Featured Slot</th>
                  <th className="px-4 py-3 text-right">Moderator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      No marketplace listings found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100">{l.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {l.city} {l.address ? `· ${l.address}` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{l.owner_name}</div>
                        <div className="text-[11px] text-slate-400">{l.owner_phone || 'No phone'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {l.property_type || 'PG'}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {l.total_rooms || 0} rooms · {l.total_beds || 0} beds
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-bold text-emerald-400 font-mono">
                        {formatCurrency(l.min_rent_paise || 800000)}/mo
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight inline-flex items-center gap-1 uppercase ${
                            l.moderation_status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : l.moderation_status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : l.moderation_status === 'suspended'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {l.moderation_status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {l.moderation_status === 'pending' && <Clock className="w-3 h-3" />}
                          {l.moderation_status === 'suspended' && <ShieldAlert className="w-3 h-3" />}
                          {l.moderation_status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {l.is_featured ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Featured
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Standard</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {l.moderation_status === 'pending' && (
                          <button
                            onClick={() => handleModerate(l.id, 'approve')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                          >
                            Approve
                          </button>
                        )}

                        {l.moderation_status !== 'rejected' && (
                          <button
                            onClick={() => setRejectModalListing(l)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg text-xs font-semibold border border-slate-700 transition"
                          >
                            Reject
                          </button>
                        )}

                        {l.moderation_status === 'approved' && (
                          <button
                            onClick={() => handleModerate(l.id, 'suspend')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold border border-slate-700 transition"
                          >
                            Suspend
                          </button>
                        )}

                        {!l.is_featured ? (
                          <button
                            onClick={() => setFeatureModalListing(l)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/30 transition"
                          >
                            Promote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleModerate(l.id, 'unfeature')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-semibold border border-slate-700 transition"
                          >
                            Unfeature
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ENQUIRIES PIPELINE */}
      {subTab === 'enquiries' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Prospective Tenant Enquiries ({enquiries.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {enquiries.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No tenant enquiries submitted yet.
              </div>
            ) : (
              enquiries.map((e) => (
                <div key={e.id} className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-xs">{e.user_name || 'Prospect'}</span>
                    <select
                      value={e.status || 'new'}
                      onChange={(evt) => handleUpdateEnquiry(e.id, evt.target.value)}
                      className="bg-slate-900 border border-slate-700 text-[10px] font-bold text-emerald-400 rounded-lg px-2 py-1"
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="visit_scheduled">Visit Scheduled</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{e.user_phone || 'No phone'}</span>
                  </div>
                  <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    "{e.message || 'Looking for single/double sharing bed'}"
                  </p>
                  <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800">
                    <span>Target: {e.properties?.name || 'Property'}</span>
                    <span>{formatDate(e.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. SCHEDULED VISITS */}
      {subTab === 'visits' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Property Visit Appointments ({visits.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Prospect</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Target Property</th>
                  <th className="px-4 py-3">Visit Date & Time</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500 text-xs">
                      No visits scheduled yet.
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-100">{v.user_name || 'Prospect'}</td>
                      <td className="px-4 py-3 text-slate-300">{v.user_phone || 'N/A'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-200">{v.properties?.name || 'PG'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">
                        {v.visit_date} · {v.time_slot || '11:00 AM'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {v.status || 'Scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white">
              Reject Listing: {rejectModalListing.title}
            </h3>
            <p className="text-xs text-slate-400">
              Provide a clear reason explaining why this listing does not meet marketplace standards (photos, invalid address, misleading price):
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Blurry pictures, unregistered address, price mismatch..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalListing(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModerate(rejectModalListing.id, 'reject', { reason: rejectReason })}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote to Featured Modal */}
      {featureModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                Promote to Featured Slot
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Promoting <span className="text-white font-semibold">"{featureModalListing.title}"</span> will pin it to the top of city search results and the homepage marketplace hero.
            </p>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Priority Rank (1 = Top Rank)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={featurePriority}
                onChange={(e) => setFeaturePriority(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFeatureModalListing(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModerate(featureModalListing.id, 'feature', { priority: featurePriority })}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition"
              >
                Activate Featured Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
