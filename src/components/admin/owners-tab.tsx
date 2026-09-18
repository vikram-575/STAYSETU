'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Search, ShieldCheck, ShieldAlert, KeyRound,
  ExternalLink, Phone, Mail, MapPin, CheckCircle2,
  Clock, AlertTriangle, ChevronRight, X, Loader2, Edit3, Sparkles, Plus,
  Lock, User, Check, RefreshCw, Download
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
  const [totalWebsiteProperties, setTotalWebsiteProperties] = useState(0)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25

  // Tab View Mode: 'organizations' | 'pending'
  const [viewMode, setViewMode] = useState<'organizations' | 'pending'>('organizations')
  const [pendingOwners, setPendingOwners] = useState<any[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [unlockingOwnerId, setUnlockingOwnerId] = useState<string | null>(null)

  // Onboard / Unlock Modal state
  const [onboardModalOwner, setOnboardModalOwner] = useState<any>(null)
  const [onboardPropName, setOnboardPropName] = useState('')
  const [onboardCity, setOnboardCity] = useState('')
  const [onboardAddress, setOnboardAddress] = useState('')
  const [onboardPgType, setOnboardPgType] = useState('coliving')
  const [onboardRooms, setOnboardRooms] = useState('6')
  const [onboardRent, setOnboardRent] = useState('7500')
  const [onboardSubmitting, setOnboardSubmitting] = useState(false)
  const [onboardSuccess, setOnboardSuccess] = useState('')
  const [onboardError, setOnboardError] = useState('')

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
        if (data.totalWebsiteProperties !== undefined) {
          setTotalWebsiteProperties(data.totalWebsiteProperties)
        }
      }
    } catch (err) {
      console.error('Failed to load organizations', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingOwners = async () => {
    setPendingLoading(true)
    try {
      const res = await fetch('/api/admin/onboard-owner')
      const data = await res.json()
      if (data.success) {
        setPendingOwners(data.pendingOwners || [])
        if (data.websitePropertiesCount !== undefined) {
          setTotalWebsiteProperties(data.websitePropertiesCount)
        }
      }
    } catch (err) {
      console.error('Failed to load pending owners', err)
    } finally {
      setPendingLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
    loadPendingOwners()
  }, [])

  const handleQuickUnlockOwner = async (owner: any) => {
    const targetId = owner.user_id || owner.id
    setUnlockingOwnerId(targetId)
    try {
      const res = await fetch('/api/admin/onboard-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlock_only',
          userId: owner.user_id,
          mobile: owner.mobile,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to unlock owner')
      await loadPendingOwners()
      await loadOrganizations()
    } catch (err: any) {
      alert(err.message || 'Failed to unlock owner')
    } finally {
      setUnlockingOwnerId(null)
    }
  }

  const handleNavigateToOnboarding = (owner: any) => {
    const params = new URLSearchParams()
    params.set('returnTo', '/admin')
    if (owner.mobile) params.set('mobile', owner.mobile)
    if (owner.full_name) params.set('name', owner.full_name)
    if (owner.city) params.set('city', owner.city)
    if (owner.email) params.set('email', owner.email)
    if (owner.user_id) params.set('userId', owner.user_id)
    if (owner.id) params.set('ownerId', owner.id)

    router.push(`/onboarding?${params.toString()}`)
  }

  const handleOpenOnboardModal = (owner: any) => {
    setOnboardModalOwner(owner)
    setOnboardPropName(owner.full_name ? `${owner.full_name}'s PG` : 'New Luxury PG')
    setOnboardCity(owner.city || 'Bangalore')
    setOnboardAddress(owner.city ? `${owner.city}, India` : '')
    setOnboardPgType('coliving')
    setOnboardRooms('6')
    setOnboardRent('7500')
    setOnboardError('')
    setOnboardSuccess('')
  }

  const handleCompleteOnboarding = async (action: 'unlock' | 'onboard_pg' | 'reject') => {
    if (!onboardModalOwner) return
    setOnboardSubmitting(true)
    setOnboardError('')
    setOnboardSuccess('')

    try {
      const res = await fetch('/api/admin/onboard-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'unlock' ? 'onboard_pg' : action,
          userId: onboardModalOwner.user_id,
          mobile: onboardModalOwner.mobile,
          property_name: onboardPropName.trim(),
          city: onboardCity.trim(),
          address: onboardAddress.trim(),
          pg_type: onboardPgType,
          approx_rooms: Number(onboardRooms) || 6,
          starting_rent: Number(onboardRent) || 7500,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to finish onboarding')
      }

      setOnboardSuccess(data.message || 'Owner successfully onboarded and ERP adjusted!')
      setTimeout(() => {
        setOnboardModalOwner(null)
        loadPendingOwners()
        loadOrganizations()
      }, 1500)
    } catch (err: any) {
      setOnboardError(err.message || 'Failed to complete owner onboarding')
    } finally {
      setOnboardSubmitting(false)
    }
  }

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
        window.open('/dashboard', '_blank')
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

  useEffect(() => {
    setPage(1)
  }, [statusFilter, searchQuery])

  const paginatedOrgs = filteredOrgs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filteredOrgs.length / PAGE_SIZE)

  const downloadCSV = () => {
    if (filteredOrgs.length === 0) return
    const headers = [
      'Organization Name',
      'Owner Name',
      'Phone',
      'Email',
      'City',
      'Address',
      'Total Rooms',
      'Total Beds',
      'Subscription Tier',
      'Verification Status',
      'Created At'
    ]
    const rows = filteredOrgs.map((org) => [
      `"${(org.name || '').replace(/"/g, '""')}"`,
      `"${(org.owner?.full_name || '').replace(/"/g, '""')}"`,
      `"${(org.phone || org.owner?.phone || '').replace(/"/g, '""')}"`,
      `"${(org.email || org.owner?.email || '').replace(/"/g, '""')}"`,
      `"${(org.city || '').replace(/"/g, '""')}"`,
      `"${(org.address || '').replace(/"/g, '""')}"`,
      org.total_rooms || 0,
      org.total_beds || 0,
      org.subscription_tier || 'standard',
      org.is_verified ? 'verified' : (org.verification_status || 'unverified'),
      `"${org.created_at || ''}"`
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `pg-setu-organizations-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredPendingOwners = pendingOwners.filter((o) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      o.full_name?.toLowerCase().includes(q) ||
      o.mobile?.toLowerCase().includes(q) ||
      o.city?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q)
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
            Manage partner operators, SaaS subscription tiers, KYC reviews, and complete pending owner onboardings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/onboarding?returnTo=/admin"
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Onboard New PG (Wizard)</span>
          </Link>

          {viewMode === 'organizations' && (
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
          )}
        </div>
      </div>

      {/* Top Metrics & Website Properties Counter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Properties Listed on Website */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Properties Listed on Website
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalWebsiteProperties}</span>
            <span className="text-xs text-emerald-400 font-bold">Live on Portal</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Properties published on website search & marketplace
          </p>
        </div>

        {/* Metric 2: Active PG Organizations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Active PG Organizations
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{organizations.length}</span>
            <span className="text-xs text-blue-400 font-bold">Brands</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Verified PG operator accounts on SaaS ERP
          </p>
        </div>

        {/* Metric 3: Total Fleet Beds */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Listed Beds
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {organizations.reduce((sum, o) => sum + (o.total_beds || 0), 0)}
            </span>
            <span className="text-xs text-slate-400 font-bold">Beds</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {organizations.reduce((sum, o) => sum + (o.occupied_beds || 0), 0)} occupied across platform
          </p>
        </div>

        {/* Metric 4: Pending / Locked Owners */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Pending Owner Onboardings
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{pendingOwners.length}</span>
            <span className="text-xs text-amber-300/80 font-bold">Awaiting Setup</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Owners pending ERP unlock & property provisioning
          </p>
        </div>
      </div>

      {/* Segmented View Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setViewMode('organizations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            viewMode === 'organizations'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Active PG Organizations ({organizations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 relative ${
            viewMode === 'pending'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Pending Owner Onboardings (Locked)</span>
          {pendingOwners.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950">
              {pendingOwners.length}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/onboarding?returnTo=/admin"
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            title="Launch Enterprise PG Onboarding Wizard (/onboarding?returnTo=/admin)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Launch Onboarding (/onboarding)</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              loadOrganizations()
              loadPendingOwners()
            }}
            className="p-2 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs transition flex items-center gap-1"
            title="Refresh Lists"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PENDING LOCKED OWNERS TABLE */}
      {viewMode === 'pending' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search pending owners by name, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
              />
            </div>
            <span className="text-xs text-slate-400">
              Pending: <span className="text-amber-400 font-bold">{filteredPendingOwners.length}</span> owners
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Owner Profile</th>
                  <th className="px-4 py-3">Personal Details</th>
                  <th className="px-4 py-3">City of Residence</th>
                  <th className="px-4 py-3">Website Listings</th>
                  <th className="px-4 py-3">Registered On</th>
                  <th className="px-4 py-3">ERP Platform Status</th>
                  <th className="px-4 py-3 text-right">SuperAdmin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 mt-2">Checking for pending owner onboardings...</p>
                    </td>
                  </tr>
                ) : filteredPendingOwners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-bold text-slate-300">All registered PG owners are onboarded & unlocked!</p>
                      <p className="text-slate-500 mt-1">No pending onboarding applications currently awaiting SuperAdmin review.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPendingOwners.map((owner) => {
                    const isUnlockedAwaitingPg =
                      owner.onboarding_status === 'unlocked_pending_pg' ||
                      (owner.erp_unlocked && (!owner.properties_count || owner.properties_count === 0))
                    const targetId = owner.user_id || owner.id

                    return (
                      <tr key={owner.id || owner.mobile} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span>{owner.full_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="font-mono text-emerald-400">+91 {owner.mobile}</span>
                            {owner.email && <span className="text-slate-500 truncate max-w-[140px]">{owner.email}</span>}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-slate-300 capitalize">
                            {owner.gender || '—'}
                            {owner.dob && <span className="text-slate-400 text-[11px]"> • DOB: {owner.dob}</span>}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{owner.city || 'Not provided'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span>0 Listed (Locked)</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-400">
                          {owner.created_at ? formatDate(owner.created_at) : 'Recent'}
                        </td>

                        <td className="px-4 py-3.5">
                          {isUnlockedAwaitingPg ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              <CheckCircle2 className="w-3 h-3 text-blue-400" />
                              <span>ERP Unlocked (Awaiting PG)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>ERP Locked (Pending)</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isUnlockedAwaitingPg ? (
                              <button
                                type="button"
                                onClick={() => handleNavigateToOnboarding(owner)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                                title="Open full Enterprise Onboarding page (/onboarding?returnTo=/admin)"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Onboard PG</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickUnlockOwner(owner)}
                                  disabled={unlockingOwnerId === targetId}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                >
                                  {unlockingOwnerId === targetId ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <KeyRound className="w-3.5 h-3.5" />
                                  )}
                                  <span>Unlock ERP</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleNavigateToOnboarding(owner)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
                                  title="Open full Enterprise Onboarding page (/onboarding?returnTo=/admin)"
                                >
                                  Onboard PG
                                </button>
                              </>
                            )}
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
      )}

      {/* VIEW 2: ACTIVE PG ORGANIZATIONS TABLE */}
      {viewMode === 'organizations' && (
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Total: <span className="text-white font-bold">{filteredOrgs.length}</span> partners
            </span>
            <button
              onClick={downloadCSV}
              disabled={filteredOrgs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
              title="Export filtered organizations to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">PG Business / Enterprise</th>
                <th className="px-4 py-3">Owner Contact</th>
                <th className="px-4 py-3">Website Listings</th>
                <th className="px-4 py-3">Fleet Capacity</th>
                <th className="px-4 py-3">Subscription Tier</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3 text-right">Super Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
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
                paginatedOrgs.map((org) => (
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
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 w-fit">
                          <Building2 className="w-3 h-3 text-emerald-400" />
                          <span>{org.properties_count || (org.properties?.length ?? 1)} Live on Website</span>
                        </span>
                        {org.properties && org.properties.length > 0 ? (
                          <div className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">
                            {org.properties.map((p: any) => p.name).join(', ')}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">{org.name}</span>
                        )}
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-bold text-white">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-white">{Math.min(page * PAGE_SIZE, filteredOrgs.length)}</span> of{' '}
              <span className="font-bold text-white">{filteredOrgs.length}</span> partners
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
      )}

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

            {/* Website Marketplace Listings */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Website Marketplace Listings ({selectedOrg.properties?.length || (selectedOrg.properties_count ?? 0)})
                </span>
                <Link
                  href={`/find-pg?search=${encodeURIComponent(selectedOrg.name || '')}`}
                  target="_blank"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                >
                  <span>Explore on Website</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {selectedOrg.properties && selectedOrg.properties.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrg.properties.map((prop: any) => (
                    <div
                      key={prop.id}
                      className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{prop.name}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live on Website
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {prop.city || selectedOrg.city || 'India'}
                          </span>
                          {prop.address && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[200px] text-slate-500">{prop.address}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/find-pg?search=${encodeURIComponent(prop.name)}`}
                        target="_blank"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                        title="View property page on PG-SETU website"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                  No active properties listed on website yet. Complete PG onboarding to publish listings.
                </div>
              )}
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

      {/* SuperAdmin Onboard & Unlock Owner Modal */}
      {onboardModalOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Onboard PG Property & Adjust ERP
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Provision PG Property, auto-generate rooms & beds, or{' '}
                    <button
                      type="button"
                      onClick={() => {
                        const owner = onboardModalOwner
                        setOnboardModalOwner(null)
                        handleNavigateToOnboarding(owner)
                      }}
                      className="text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5"
                    >
                      switch to Full Onboarding Wizard (/onboarding) <ExternalLink className="w-3 h-3" />
                    </button>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOnboardModalOwner(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Owner Personal Profile Review */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <User className="w-3 h-3 text-amber-400" />
                Owner Personal Details (Registered)
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300 mt-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Full Name</span>
                  <span className="font-bold text-white">{onboardModalOwner.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Phone Number</span>
                  <span className="font-mono text-white">{onboardModalOwner.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Email Address</span>
                  <span className="text-white">{onboardModalOwner.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Date of Birth / Gender</span>
                  <span className="text-white">
                    {onboardModalOwner.dob || 'N/A'} {onboardModalOwner.gender ? `(${onboardModalOwner.gender})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Provision Property Configuration */}
            <div className="space-y-3 pt-1">
              <div className="text-[11px] font-bold uppercase text-slate-300 tracking-wider">
                PG Property & Organization Setup
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Property / PG Brand Name *
                </label>
                <input
                  type="text"
                  value={onboardPropName}
                  onChange={(e) => setOnboardPropName(e.target.value)}
                  placeholder="e.g. Sri Lakshmi Luxury PG"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={onboardCity}
                    onChange={(e) => setOnboardCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    PG Type
                  </label>
                  <select
                    value={onboardPgType}
                    onChange={(e) => setOnboardPgType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="coliving">Co-Living (Unisex)</option>
                    <option value="boys">Boys PG</option>
                    <option value="girls">Girls PG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Physical Address / Landmark
                </label>
                <input
                  type="text"
                  value={onboardAddress}
                  onChange={(e) => setOnboardAddress(e.target.value)}
                  placeholder="e.g. #42, 5th Cross, Koramangala"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Initial Rooms to Provision
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={onboardRooms}
                    onChange={(e) => setOnboardRooms(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Default Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={onboardRent}
                    onChange={(e) => setOnboardRent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {onboardError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{onboardError}</span>
              </div>
            )}

            {onboardSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{onboardSuccess}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setOnboardModalOwner(null)}
                disabled={onboardSubmitting}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCompleteOnboarding('reject')}
                  disabled={onboardSubmitting}
                  className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-bold transition"
                >
                  Reject & Keep Locked
                </button>

                <button
                  type="button"
                  onClick={() => handleCompleteOnboarding('onboard_pg')}
                  disabled={onboardSubmitting || !onboardPropName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {onboardSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Onboard PG Property</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
