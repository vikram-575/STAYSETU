'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Store, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  Eye, Search, Filter, ShieldCheck, ShieldAlert, Clock,
  Calendar, Phone, MapPin, ArrowUpRight, MessageSquare, Loader2,
  Zap, Plus, ExternalLink, ArrowRight, User, Users, RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate } from '@/lib/utils'

export default function MarketplaceTab() {
  const [subTab, setSubTab] = useState<'instant_pg' | 'listings' | 'enquiries' | 'visits'>('instant_pg')
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [instantLeads, setInstantLeads] = useState<any[]>([])
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

  // Super Admin Manual Lead Creation Modal
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false)
  const [newLeadName, setNewLeadName] = useState('')
  const [newLeadPhone, setNewLeadPhone] = useState('')
  const [newLeadCity, setNewLeadCity] = useState('Bengaluru')
  const [newLeadGender, setNewLeadGender] = useState('any')
  const [newLeadSharing, setNewLeadSharing] = useState('2-Sharing')
  const [newLeadBudget, setNewLeadBudget] = useState('₹8,000 - ₹12,000')
  const [newLeadNotes, setNewLeadNotes] = useState('')
  const [creatingLead, setCreatingLead] = useState(false)

  const loadMarketplaceData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/marketplace?section=all&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) {
        setListings(data.listings || [])
        setEnquiries(data.enquiries || [])
        setInstantLeads(data.instant_pg_leads || [])
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
  const handleUpdateEnquiry = async (enquiryId: string, status: string, extraUpdates: any = {}) => {
    try {
      const res = await fetch('/api/admin/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_enquiry_status',
          enquiry_id: enquiryId,
          status,
          ...extraUpdates,
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

  // Super Admin Create Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadName.trim() || !newLeadPhone.trim()) return

    setCreatingLead(true)
    try {
      const res = await fetch('/api/admin/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_instant_lead',
          name: newLeadName.trim(),
          phone: newLeadPhone.trim(),
          city: newLeadCity,
          gender: newLeadGender,
          sharing: newLeadSharing,
          budget: newLeadBudget,
          notes: newLeadNotes.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateLeadModal(false)
        setNewLeadName('')
        setNewLeadPhone('')
        setNewLeadNotes('')
        loadMarketplaceData()
      } else {
        alert(data.error || 'Failed to create lead')
      }
    } catch (err) {
      console.error('Create lead failed:', err)
    } finally {
      setCreatingLead(false)
    }
  }

  const newInstantCount = instantLeads.filter((l) => l.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⚡ LIVE DEMAND PIPELINE
            </span>
            <span className="text-xs text-slate-400">Public Website Fast-Track System</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Instant PG Leads & Marketplace Operations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time leads from the public website floating button, listing moderation, and scheduled visits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateLeadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Instant Lead</span>
          </button>

          <button
            onClick={loadMarketplaceData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* SubTabs Navigation */}
      <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('instant_pg')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'instant_pg'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${subTab === 'instant_pg' ? 'fill-slate-950' : 'text-amber-400'}`} />
          <span>⚡ Instant PG Requests</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            subTab === 'instant_pg' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {instantLeads.length} {newInstantCount > 0 && `(${newInstantCount} new)`}
          </span>
        </button>

        <button
          onClick={() => setSubTab('listings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'listings'
              ? 'bg-slate-800 text-white font-black border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span>PG Listings Moderation</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
            {listings.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'enquiries'
              ? 'bg-slate-800 text-white font-black border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>Property Enquiries</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
            {enquiries.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('visits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'visits'
              ? 'bg-slate-800 text-white font-black border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>Scheduled Visits</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
            {visits.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, tracking code, locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadMarketplaceData()}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Statuses</option>
          <option value="new">New (Uncontacted)</option>
          <option value="contacted">Contacted</option>
          <option value="allotted">Allotted / Converted</option>
          <option value="closed">Closed / Lost</option>
        </select>
      </div>

      {/* 1. INSTANT PG REQUESTS (HIGHLIGHTED NEW FEATURE) */}
      {subTab === 'instant_pg' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Instant Leads</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{instantLeads.length}</p>
              <p className="text-[11px] text-slate-500">From public floating button</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Pending Immediate Action</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{newInstantCount}</p>
              <p className="text-[11px] text-slate-500">Awaiting Super Admin call</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Converted / Allotted</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {instantLeads.filter((l) => l.status === 'allotted' || l.status === 'converted').length}
              </p>
              <p className="text-[11px] text-slate-500">Successfully placed in PGs</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">SLA Target</span>
                <p className="text-xs font-bold text-white mt-1">⚡ 15-Minute Allotment Guarantee</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 w-max">
                ● 24/7 Hotline Active
              </span>
            </div>
          </div>

          {/* Leads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instantLeads.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No Instant PG Requests registered yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Test the public floating button on the homepage or click "+ New Instant Lead" above.
                </p>
              </div>
            ) : (
              instantLeads.map((lead) => {
                const isNew = lead.status === 'new'
                const isImmediate = (lead.move_in_date || '').toLowerCase().includes('immediate')

                return (
                  <div
                    key={lead.id || lead.reference_code}
                    className={`bg-slate-900/90 border rounded-2xl p-4 space-y-3 transition shadow-lg ${
                      isNew
                        ? 'border-amber-500/60 ring-1 ring-amber-500/20 shadow-amber-500/5'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Code & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-800 text-amber-300 border border-amber-500/30">
                          {lead.reference_code || 'PG-INSTA'}
                        </span>
                        {isNew && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-rose-500 text-white animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>

                      <select
                        value={lead.status || 'new'}
                        onChange={(e) => handleUpdateEnquiry(lead.id, e.target.value)}
                        className={`text-[10px] font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                          lead.status === 'new'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : lead.status === 'contacted'
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                            : lead.status === 'allotted'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <option value="new">🟡 New Lead</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="allotted">🟢 Allotted (Converted)</option>
                        <option value="closed">⚪ Closed / Lost</option>
                      </select>
                    </div>

                    {/* Prospect Details */}
                    <div>
                      <h4 className="text-sm font-black text-white">{lead.tenant_name || lead.user_name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>+91 {lead.tenant_phone || lead.user_phone}</span>
                      </p>
                    </div>

                    {/* Specs Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] text-slate-300 flex items-center gap-1 font-medium">
                        <MapPin className="w-2.5 h-2.5 text-amber-400" />
                        <span>{lead.property_city || 'City N/A'}</span>
                      </span>

                      <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] text-slate-300 font-medium capitalize">
                        {lead.gender || 'Any'} PG
                      </span>

                      <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] text-slate-300 font-medium">
                        {lead.sharing_choice || 'Sharing N/A'}
                      </span>

                      <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] text-emerald-400 font-bold font-mono">
                        {lead.budget_range || 'Budget N/A'}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isImmediate
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        Move-in: {lead.move_in_date || 'Immediate'}
                      </span>
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                      <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 italic leading-relaxed">
                        "{lead.notes}"
                      </p>
                    )}

                    {/* Assigned PG Allotment info */}
                    {lead.assigned_property_name && (
                      <div className="p-2 bg-emerald-950/60 rounded-xl border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center justify-between">
                        <span>Allotted PG: <strong>{lead.assigned_property_name}</strong></span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}

                    {/* Action Bar: Call, WhatsApp, Allot */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${lead.tenant_phone || lead.user_phone}`}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition"
                          title="Call Lead"
                        >
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>Call</span>
                        </a>

                        <a
                          href={`https://wa.me/91${(lead.tenant_phone || lead.user_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hello ${lead.tenant_name}! This is PG-Setu Super Admin team regarding your Instant PG Request (${lead.reference_code || ''}) for ${lead.property_city}. We have ready verified rooms available for you!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-[#00A884]/20 hover:bg-[#00A884]/30 text-emerald-300 text-[11px] font-bold rounded-lg border border-[#00A884]/40 flex items-center gap-1 transition"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      {/* 1-Click Allot Dropdown */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleUpdateEnquiry(lead.id, 'allotted', { assigned_property_name: e.target.value })
                          }
                        }}
                        className="bg-slate-950 border border-slate-700 text-[10px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="">Allot to PG...</option>
                        {listings.map((p) => (
                          <option key={p.id} value={p.title}>
                            {p.title} ({p.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 2. LISTINGS MODERATION */}
      {subTab === 'listings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Active & Pending PG Listings ({listings.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">City & Locality</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Starting Rent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {listings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                      No listings matching criteria.
                    </td>
                  </tr>
                ) : (
                  listings.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <span>{l.title}</span>
                          {l.is_featured && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">{l.owner_name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {l.locality}, {l.city}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {l.occupied_beds}/{l.total_beds} beds
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-bold font-mono">
                        {formatCurrency(l.monthly_rent_paise)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                          l.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : l.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {l.status !== 'published' && (
                            <button
                              onClick={() => handleModerate(l.id, 'approve')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => setRejectModalListing(l)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-bold rounded-lg text-[10px] border border-slate-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GENERAL ENQUIRIES */}
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

      {/* 4. SCHEDULED VISITS */}
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

      {/* CREATE INSTANT LEAD MODAL (SUPER ADMIN) */}
      {showCreateLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Record New Instant PG Lead</span>
              </h3>
              <button
                onClick={() => setShowCreateLeadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Tenant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ankit Mehra"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    City
                  </label>
                  <select
                    value={newLeadCity}
                    onChange={(e) => setNewLeadCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                    <option value="Delhi-NCR">Delhi-NCR</option>
                    <option value="Kota">Kota</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    PG Type
                  </label>
                  <select
                    value={newLeadGender}
                    onChange={(e) => setNewLeadGender(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="any">Any / Co-live</option>
                    <option value="boys">Boys PG</option>
                    <option value="girls">Girls PG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Sharing
                  </label>
                  <select
                    value={newLeadSharing}
                    onChange={(e) => setNewLeadSharing(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Single Room">Single Room</option>
                    <option value="2-Sharing">2-Sharing</option>
                    <option value="3-Sharing">3-Sharing</option>
                    <option value="Any Sharing">Any Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Budget
                  </label>
                  <select
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Under ₹8,000">Under ₹8,000</option>
                    <option value="₹8,000 - ₹12,000">₹8,000 - ₹12,000</option>
                    <option value="₹12,000 - ₹16,000">₹12,000 - ₹16,000</option>
                    <option value="₹16,000+">₹16,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Notes / College / Office
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs AC room near metro"
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLeadModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  {creatingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-slate-950" />}
                  <span>Save Instant Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Listing Reason Modal */}
      {rejectModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white">
              Reject Listing: {rejectModalListing.title}
            </h3>
            <p className="text-xs text-slate-400">
              Provide a clear reason explaining why this listing does not meet marketplace standards:
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
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
