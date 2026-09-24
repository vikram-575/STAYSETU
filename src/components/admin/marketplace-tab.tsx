'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Store, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  Eye, Search, Filter, ShieldCheck, ShieldAlert, Clock,
  Calendar, Phone, MapPin, ArrowUpRight, MessageSquare, Loader2,
  Zap, Plus, ExternalLink, ArrowRight, User, Users, RefreshCw,
  Edit3, Trash2, Check, X, Building2, ChevronRight, Bed, DollarSign,
  Tag, Award, Star, Send
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate } from '@/lib/utils'

interface MarketplaceTabProps {
  initialSubTab?: 'listings' | 'instant_pg' | 'enquiries' | 'visits'
  initialBadgeFilter?: 'all' | 'verified' | 'featured'
}

export default function MarketplaceTab({ initialSubTab = 'listings', initialBadgeFilter = 'all' }: MarketplaceTabProps) {
  const [subTab, setSubTab] = useState<'listings' | 'instant_pg' | 'enquiries' | 'visits'>(initialSubTab)

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab)
    }
  }, [initialSubTab])
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [instantLeads, setInstantLeads] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [badgeFilter, setBadgeFilter] = useState(initialBadgeFilter) // all, verified, featured
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'pending_first' | 'rent_asc' | 'rent_desc'>('newest')

  // Action Modals
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModalListing, setRejectModalListing] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteModalListing, setDeleteModalListing] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit Modal State
  const [editModalListing, setEditModalListing] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editNewPhotoUrl, setEditNewPhotoUrl] = useState('')
  const [editNewAmenity, setEditNewAmenity] = useState('')
  const [editNewRule, setEditNewRule] = useState('')

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

  // Super Admin Dispatch Lead to Owner Modal
  const [dispatchLead, setDispatchLead] = useState<any>(null)
  const [dispatchOwners, setDispatchOwners] = useState<any[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('')
  const [loadingDispatchOwners, setLoadingDispatchOwners] = useState(false)
  const [dispatchingLead, setDispatchingLead] = useState(false)

  const loadMarketplaceData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        section: 'all',
        status: statusFilter,
        city: cityFilter,
        type: typeFilter,
        search: searchQuery,
        sort: sortBy,
        verified: badgeFilter === 'verified' ? 'true' : 'false',
        featured: badgeFilter === 'featured' ? 'true' : 'false',
      })
      const res = await fetch(`/api/admin/marketplace?${queryParams.toString()}`)
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
  }, [statusFilter, cityFilter, typeFilter, badgeFilter, sortBy])

  // Extract distinct cities for dynamic filter
  const distinctCities = useMemo(() => {
    const set = new Set<string>()
    listings.forEach((l) => {
      if (l.city) set.add(l.city.trim())
    })
    return Array.from(set).sort()
  }, [listings])

  // Moderation handler: Approve / Reject / Feature
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

  // Delete handler
  const handleDeleteProperty = async () => {
    if (!deleteModalListing) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/marketplace?property_id=${deleteModalListing.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setDeleteModalListing(null)
        loadMarketplaceData()
      } else {
        alert(data.error || 'Failed to delete property')
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting property')
    } finally {
      setIsDeleting(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (listing: any) => {
    setEditModalListing(listing)
    setEditForm({
      name: listing.title || listing.name || '',
      city: listing.city || '',
      locality: listing.locality || '',
      address: listing.address || '',
      pincode: listing.pincode || '',
      phone: listing.owner_phone || listing.phone || '',
      email: listing.owner_email || listing.email || '',
      property_type: listing.property_type || 'pg',
      gender_preference: listing.gender_preference || 'coed',
      monthly_rent_paise: listing.monthly_rent_paise || 600000,
      deposit_paise: listing.deposit_paise || 1200000,
      listing_status: listing.status || (listing.is_active ? 'published' : 'pending'),
      is_verified: listing.is_verified ?? true,
      super_host: listing.super_host ?? false,
      is_featured: listing.is_featured ?? false,
      amenities: Array.isArray(listing.amenities) ? [...listing.amenities] : [],
      rules: Array.isArray(listing.rules) ? [...listing.rules] : [],
      images: Array.isArray(listing.images) ? [...listing.images] : [],
      description: listing.description || '',
    })
  }

  // Save Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalListing) return
    setIsSavingEdit(true)

    try {
      const res = await fetch('/api/admin/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_property',
          property_id: editModalListing.id,
          ...editForm,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditModalListing(null)
        loadMarketplaceData()
      } else {
        alert(data.error || 'Failed to save property updates')
      }
    } catch (err: any) {
      alert(err.message || 'Error updating property')
    } finally {
      setIsSavingEdit(false)
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

  // Open Dispatch Modal and load relevant owners
  const handleOpenDispatchModal = async (lead: any) => {
    setDispatchLead(lead)
    setSelectedOwnerId('')
    setLoadingDispatchOwners(true)
    try {
      const res = await fetch('/api/admin/organizations')
      const data = await res.json()
      if (data.success && data.organizations) {
        const leadCity = lead.property_city || ''
        const matched = data.organizations.filter((o: any) =>
          !leadCity || leadCity === 'all'
            ? true
            : (o.city || '').toLowerCase().includes(leadCity.toLowerCase())
        )
        const list = matched.length > 0 ? matched : data.organizations
        setDispatchOwners(list)
        if (list.length > 0) setSelectedOwnerId(list[0].id)
      }
    } catch (err) {
      console.error('Failed to load owners for dispatch', err)
    } finally {
      setLoadingDispatchOwners(false)
    }
  }

  // Confirm Dispatch and notify owner via WhatsApp
  const handleConfirmDispatch = async () => {
    if (!dispatchLead || !selectedOwnerId) return
    const owner = dispatchOwners.find((o) => o.id === selectedOwnerId)
    setDispatchingLead(true)
    try {
      // 1. Dispatch WhatsApp & In-app broadcast alert
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '⚡ New Instant PG Lead Dispatched to You',
          message: `High-intent prospect: ${dispatchLead.tenant_name || dispatchLead.user_name || 'Prospective Tenant'} (+91 ${dispatchLead.tenant_phone || dispatchLead.user_phone || ''}) is looking for a ${dispatchLead.sharing_choice || 'room'} in ${dispatchLead.property_city || 'your city'}. Budget: ${dispatchLead.budget_range || 'Standard'}. Please contact them immediately! — PG-SETU Admin`,
          target_city: dispatchLead.property_city || 'all',
          channel: 'whatsapp',
        }),
      })

      // 2. Update status to 'dispatched'
      await handleUpdateEnquiry(dispatchLead.id, 'dispatched', {
        assigned_property_name: owner?.name || 'Dispatched to Owner',
      })

      setDispatchLead(null)
    } catch (err) {
      console.error('Failed to dispatch lead', err)
    } finally {
      setDispatchingLead(false)
    }
  }

  const newInstantCount = instantLeads.filter((l) => l.status === 'new').length
  const pendingListingsCount = stats?.pendingListings ?? listings.filter((l) => l.status === 'pending' || (!l.is_active && l.status !== 'rejected')).length
  const publishedListingsCount = stats?.publishedListings ?? listings.filter((l) => l.status === 'published' || l.is_active).length

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⚡ PG-SETU PROPERTY RENTING COMMAND CENTER
            </span>
            <span className="text-xs text-slate-400">SuperAdmin Listings Moderation & Inventory Control</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            Manage All Listed Properties & Renting
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Approve properties before they go live on search, edit pricing & terms, delete unlisted units, and monitor real-time demand.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/onboarding?returnTo=/admin"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black rounded-xl shadow-md transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Onboard Property</span>
          </Link>

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
      <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('listings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'listings'
              ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Store className={`w-3.5 h-3.5 ${subTab === 'listings' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>Manage All Listed Properties</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            subTab === 'listings' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
          }`}>
            {listings.length} {pendingListingsCount > 0 && `(${pendingListingsCount} Pending)`}
          </span>
        </button>

        <button
          onClick={() => setSubTab('instant_pg')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'instant_pg'
              ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Instant PG Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
            {instantLeads.length} {newInstantCount > 0 && `(${newInstantCount} new)`}
          </span>
        </button>

        <button
          onClick={() => setSubTab('enquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'enquiries'
              ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            subTab === 'visits'
              ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>Scheduled Visits</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
            {visits.length}
          </span>
        </button>
      </div>

      {/* 1. LISTINGS MANAGEMENT (PRIMARY VIEW) */}
      {subTab === 'listings' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Listed</span>
                <Store className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-white mt-1.5">{listings.length}</p>
              <span className="text-[11px] text-slate-500">All registered PGs on platform</span>
            </div>

            <div
              onClick={() => setStatusFilter('pending')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/60'
              }`}
            >
              <div className="flex items-center justify-between text-amber-300">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Pending SuperAdmin Approval
                </span>
                {pendingListingsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    ACTION NEEDED
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-amber-400 mt-1.5">{pendingListingsCount}</p>
              <span className="text-[11px] text-amber-300/70">Requires SuperAdmin verification before going live</span>
            </div>

            <div
              onClick={() => setStatusFilter('published')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                statusFilter === 'published'
                  ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Published & Live
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-1.5">{publishedListingsCount}</p>
              <span className="text-[11px] text-slate-500">Visible on public marketplace search</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Bed className="w-3 h-3" />
                  Platform Bed Capacity
                </span>
              </div>
              <p className="text-2xl font-black text-blue-400 mt-1.5">
                {listings.reduce((acc, l) => acc + (l.total_beds || 0), 0)}
              </p>
              <span className="text-[11px] text-slate-500">Total rooms & beds inventory</span>
            </div>
          </div>

          {/* Full Filter & Search Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-3 shadow-md">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by property name, city, locality, owner name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadMarketplaceData()}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Statuses ({listings.length})</option>
                <option value="pending">⏳ Pending Approval ({pendingListingsCount})</option>
                <option value="published">🟢 Published & Live ({publishedListingsCount})</option>
                <option value="rejected">🔴 Rejected</option>
                <option value="draft">⚪ Draft / Inactive</option>
              </select>

              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Cities</option>
                {distinctCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Property Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Types</option>
                <option value="pg">PG / Co-Living</option>
                <option value="hostel">Hostel</option>
                <option value="flat">Apartment / Flat</option>
              </select>

              {/* Badge Filter */}
              <select
                value={badgeFilter}
                onChange={(e) => setBadgeFilter(e.target.value as 'all' | 'verified' | 'featured')}
                className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Listings</option>
                <option value="verified">Verified Only</option>
                <option value="featured">Featured Only</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full md:w-auto bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="newest">Newest First</option>
                <option value="pending_first">Pending Approvals First</option>
                <option value="rent_asc">Rent: Low to High</option>
                <option value="rent_desc">Rent: High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Managed Properties ({listings.length})
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Verified platform inventory
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Host & Owner Contact</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Rent / mo</th>
                    <th className="px-4 py-3">Capacity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {listings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500">
                        <Store className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">No properties matching filters</p>
                        <p className="text-[11px] text-slate-500 mt-1">Try resetting your search or status filter</p>
                      </td>
                    </tr>
                  ) : (
                    listings.map((l) => {
                      const isPending = l.status === 'pending' || (!l.is_active && l.status !== 'rejected')
                      const isPublished = l.status === 'published' && l.is_active
                      const isRejected = l.status === 'rejected'

                      return (
                        <tr key={l.id} className="hover:bg-slate-800/40 transition">
                          {/* Property Thumbnail & Title */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-slate-950 relative">
                                <img
                                  src={l.coverImage || l.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80'}
                                  alt={l.title}
                                  className="w-full h-full object-cover"
                                />
                                {l.is_featured && (
                                  <span className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-black px-1 rounded-bl">
                                    ★
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-white text-xs">{l.title}</span>
                                  {l.is_verified && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                      VERIFIED
                                    </span>
                                  )}
                                  {l.is_featured && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      FEATURED
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                                  <Tag className="w-2.5 h-2.5 text-slate-500" />
                                  {l.property_type || 'PG'} · {l.gender_preference || 'Coed'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Host Contact */}
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-200 text-xs">{l.owner_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={`tel:${l.owner_phone || l.phone}`}
                                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 font-mono"
                              >
                                <Phone className="w-2.5 h-2.5 text-emerald-400" />
                                {l.owner_phone || l.phone || 'No phone'}
                              </a>
                              {(l.owner_phone || l.phone) && (
                                <a
                                  href={`https://wa.me/91${(l.owner_phone || l.phone).replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-emerald-400 font-bold hover:underline"
                                >
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3.5 text-slate-300">
                            <p className="font-semibold text-white">{l.city || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]" title={l.address}>
                              {l.locality || l.address || 'Central'}
                            </p>
                          </td>

                          {/* Rent */}
                          <td className="px-4 py-3.5">
                            <p className="text-emerald-400 font-bold font-mono text-xs">
                              {formatCurrency(l.monthly_rent_paise)}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Dep: {formatCurrency(l.deposit_paise)}
                            </p>
                          </td>

                          {/* Capacity */}
                          <td className="px-4 py-3.5 font-mono text-slate-300">
                            <span className="font-bold text-white">{l.occupied_beds || 0}</span>
                            <span className="text-slate-500">/{l.total_beds || 10} beds</span>
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((l.occupied_beds || 0) / (l.total_beds || 10)) * 100))}%`,
                                }}
                              />
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-max animate-pulse">
                                <Clock className="w-3 h-3" />
                                PENDING APPROVAL
                              </span>
                            ) : isPublished ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3" />
                                LIVE & APPROVED
                              </span>
                            ) : isRejected ? (
                              <span
                                className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-max"
                                title={l.flagged_reason || 'Rejected by Admin'}
                              >
                                <XCircle className="w-3 h-3" />
                                REJECTED
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 w-max">
                                DRAFT
                              </span>
                            )}
                          </td>

                          {/* Actions: Approve / Reject / Edit / Delete / View */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1-Click Approve if pending or inactive */}
                              {!isPublished && (
                                <button
                                  onClick={() => handleModerate(l.id, 'approve')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] transition flex items-center gap-1 shadow-xs"
                                  title="Approve & Publish Live on Public Search"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve Live</span>
                                </button>
                              )}

                              {/* Reject Button */}
                              {!isRejected && (
                                <button
                                  onClick={() => setRejectModalListing(l)}
                                  className="px-2 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-bold rounded-xl text-[10px] border border-slate-700 transition"
                                  title="Reject Listing with Reason"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}

                              {/* Edit Modal Button */}
                              <button
                                onClick={() => handleOpenEdit(l)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-[10px] border border-slate-700 transition flex items-center gap-1"
                                title="Edit Property Details & Rent"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                <span>Edit</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setDeleteModalListing(l)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 transition"
                                title="Delete Property Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* View Live on Website */}
                              <Link
                                href={`/property/${l.id}`}
                                target="_blank"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition"
                                title="View Public Listing Page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. INSTANT PG REQUESTS */}
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
                            : lead.status === 'dispatched'
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : lead.status === 'contacted'
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                            : lead.status === 'allotted'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <option value="new">🟡 New Lead</option>
                        <option value="dispatched">🟣 Dispatched</option>
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
                        <span>Assignment: <strong>{lead.assigned_property_name}</strong></span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    )}

                    {/* Action Bar: Call, WhatsApp, Dispatch, Allot */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
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

                        <button
                          onClick={() => handleOpenDispatchModal(lead)}
                          className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-bold rounded-lg border border-indigo-500/30 flex items-center gap-1 transition cursor-pointer"
                          title="Dispatch lead to verified PG owner via WhatsApp"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Dispatch</span>
                        </button>
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

      {/* EDIT PROPERTY MODAL (SUPER ADMIN) */}
      {editModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Property Listing</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ID: <span className="font-mono text-slate-300">{editModalListing.id}</span>
                </p>
              </div>
              <button
                onClick={() => setEditModalListing(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Row 1: Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Property Type
                  </label>
                  <select
                    value={editForm.property_type}
                    onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="pg">PG (Paying Guest)</option>
                    <option value="coliving">Co-Living Space</option>
                    <option value="hostel">Hostel</option>
                    <option value="flat">Independent Flat / 1BHK / 2BHK</option>
                  </select>
                </div>
              </div>

              {/* Row 2: City, Locality, Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    value={editForm.locality}
                    onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Row 3: Rent & Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Starting Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={Math.round((editForm.monthly_rent_paise || 0) / 100)}
                    onChange={(e) =>
                      setEditForm({ ...editForm, monthly_rent_paise: Number(e.target.value) * 100 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={Math.round((editForm.deposit_paise || 0) / 100)}
                    onChange={(e) =>
                      setEditForm({ ...editForm, deposit_paise: Number(e.target.value) * 100 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Listing Status *
                  </label>
                  <select
                    value={editForm.listing_status}
                    onChange={(e) => setEditForm({ ...editForm, listing_status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="published">🟢 Published & Live</option>
                    <option value="pending">⏳ Pending Approval</option>
                    <option value="rejected">🔴 Rejected</option>
                    <option value="draft">⚪ Draft / Inactive</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Host Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Host Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 5: Badges & Toggles */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_verified}
                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Verified Host</span>
                    <span className="text-[10px] text-slate-400">Shows green shield badge</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.super_host}
                    onChange={(e) => setEditForm({ ...editForm, super_host: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Superhost</span>
                    <span className="text-[10px] text-slate-400">Awarded for top ratings</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_featured}
                    onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Featured Listing</span>
                    <span className="text-[10px] text-slate-400">Pin to top of search</span>
                  </div>
                </label>
              </div>

              {/* Photos Gallery Preview & Add Photo */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Property Photos ({editForm.images?.length || 0})
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
                  {(editForm.images || []).map((imgUrl: string, idx: number) => (
                    <div key={idx} className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-950 group">
                      <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editForm.images.filter((_: any, i: number) => i !== idx)
                          setEditForm({ ...editForm, images: updated })
                        }}
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[8px] font-black text-center text-white py-0.2">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    placeholder="Add image URL (https://...)"
                    value={editNewPhotoUrl}
                    onChange={(e) => setEditNewPhotoUrl(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editNewPhotoUrl.trim()) {
                        setEditForm({
                          ...editForm,
                          images: [...(editForm.images || []), editNewPhotoUrl.trim()],
                        })
                        setEditNewPhotoUrl('')
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700"
                  >
                    + Add Photo
                  </button>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalListing(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Publish Updates</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Permanently Delete Property?</h3>
                <p className="text-xs text-rose-300 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <p>
                <strong>Property:</strong> {deleteModalListing.title}
              </p>
              <p>
                <strong>Location:</strong> {deleteModalListing.locality}, {deleteModalListing.city}
              </p>
              <p>
                <strong>Inventory:</strong> {deleteModalListing.total_beds || 0} total beds
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              Deleting this property will unlist it from the marketplace, remove all rooms & beds, and clear its public page.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalListing(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProperty}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Property</span>
                  </>
                )}
              </button>
            </div>
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
                    <option value="Banda">Banda</option>
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
              placeholder="e.g. Incomplete pictures, invalid address, pricing mismatch..."
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

      {/* Dispatch Lead to Verified Owner Modal */}
      {dispatchLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-black text-white">
                  Dispatch Lead to Verified PG Owner
                </h3>
              </div>
              <button
                onClick={() => setDispatchLead(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-xs">
              <p className="font-bold text-slate-200">
                {dispatchLead.tenant_name || dispatchLead.user_name} (+91 {dispatchLead.tenant_phone || dispatchLead.user_phone})
              </p>
              <p className="text-slate-400">
                Looking for: {dispatchLead.gender || 'Coed'} · {dispatchLead.sharing_choice || 'Room'} in {dispatchLead.property_city || 'India'}
              </p>
              <p className="text-emerald-400 font-mono font-bold">
                Budget: {dispatchLead.budget_range || 'Standard'} · Move-in: {dispatchLead.move_in_date || 'Immediate'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Select Destination PG Partner ({dispatchOwners.length} in {dispatchLead.property_city || 'City'})
              </label>
              {loadingDispatchOwners ? (
                <div className="py-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400 mx-auto" />
                </div>
              ) : dispatchOwners.length === 0 ? (
                <p className="text-xs text-amber-400 italic">No registered PG owners found in this city.</p>
              ) : (
                <select
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {dispatchOwners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.city || 'City'}) — Owner: {o.owner_name || o.email || 'Verified'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20">
              💡 Confirming will immediately dispatch an automated WhatsApp & in-app priority lead notification to this owner, and transition the enquiry status to <strong className="text-indigo-300">Dispatched</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDispatchLead(null)}
                disabled={dispatchingLead}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={dispatchingLead || !selectedOwnerId || dispatchOwners.length === 0}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
              >
                {dispatchingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{dispatchingLead ? 'Dispatching...' : 'Confirm & Notify Owner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
