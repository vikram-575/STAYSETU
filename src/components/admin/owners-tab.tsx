'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Search, ShieldCheck, ShieldAlert, KeyRound,
  ExternalLink, Phone, Mail, MapPin, CheckCircle2,
  Clock, AlertTriangle, ChevronRight, X, Loader2, Edit3, Sparkles, Plus,
  Lock, User, Check, RefreshCw, Download, Zap, Users, ArrowLeft, ArrowRight
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

  // 4-Step Guided Onboard & Unlock Wizard State
  const [onboardModalOwner, setOnboardModalOwner] = useState<any>(null)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Basic Details
  const [onboardOwnerName, setOnboardOwnerName] = useState('')
  const [onboardMobile, setOnboardMobile] = useState('')
  const [onboardEmail, setOnboardEmail] = useState('')
  const [onboardPropName, setOnboardPropName] = useState('')
  const [onboardCity, setOnboardCity] = useState('')
  const [onboardAddress, setOnboardAddress] = useState('')
  const [onboardPgType, setOnboardPgType] = useState('coliving')

  // Step 2: Building & Structure
  const [onboardBuildingCount, setOnboardBuildingCount] = useState('1')
  const [onboardBuildingName, setOnboardBuildingName] = useState('Main Block')
  const [onboardFloorCount, setOnboardFloorCount] = useState('3')
  const [onboardRooms, setOnboardRooms] = useState('6')
  const [onboardRoomType, setOnboardRoomType] = useState('Double Sharing')
  const [onboardRent, setOnboardRent] = useState('7500')

  // Step 3: Electricity Charges
  const [onboardElectricityRate, setOnboardElectricityRate] = useState('10')
  const [onboardMeterType, setOnboardMeterType] = useState('sub')
  const [onboardAllocationMethod, setOnboardAllocationMethod] = useState('room_actual')

  // Step 4: Staff Details
  const [onboardStaffName, setOnboardStaffName] = useState('')
  const [onboardStaffPhone, setOnboardStaffPhone] = useState('')
  const [onboardStaffRole, setOnboardStaffRole] = useState('Manager / Supervisor')
  const [onboardStaffSalary, setOnboardStaffSalary] = useState('15000')

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

  const handleQuickUnlockOwner = (owner: any) => {
    handleOpenOnboardModal(owner)
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

  const validateStep1 = () => {
    setOnboardError('')
    if (!onboardOwnerName.trim()) {
      setOnboardError('Please enter the owner full name.')
      return false
    }
    if (!onboardMobile.trim()) {
      setOnboardError('Please enter the owner contact phone number.')
      return false
    }
    if (!onboardPropName.trim()) {
      setOnboardError('Please enter the PG / Property Name.')
      return false
    }
    if (!onboardCity.trim()) {
      setOnboardError('Please enter the city for the PG.')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    setOnboardError('')
    if (!onboardBuildingName.trim()) {
      setOnboardError('Please enter the building name (e.g. Main Block).')
      return false
    }
    const floors = Number(onboardFloorCount)
    if (!floors || floors < 1) {
      setOnboardError('Please enter at least 1 floor.')
      return false
    }
    const rooms = Number(onboardRooms)
    if (!rooms || rooms < 1) {
      setOnboardError('Please enter at least 1 room.')
      return false
    }
    return true
  }

  const handleOpenOnboardModal = (owner: any) => {
    setOnboardModalOwner(owner)
    setWizardStep(1)

    // Step 1 defaults
    setOnboardOwnerName(owner.full_name || 'PG Owner')
    setOnboardMobile(owner.mobile || '')
    setOnboardEmail(owner.email || '')
    const validCity = owner.city && owner.city !== 'Not provided' ? owner.city : 'Bengaluru'
    setOnboardPropName(owner.organization_name || (owner.full_name ? `${owner.full_name}'s PG` : 'New Luxury PG'))
    setOnboardCity(validCity)
    setOnboardAddress(owner.address || `${validCity}, India`)
    setOnboardPgType(owner.pg_type || 'coliving')

    // Step 2 defaults
    setOnboardBuildingCount(owner.building_count ? String(owner.building_count) : '1')
    setOnboardBuildingName(owner.building_name || 'Main Block')
    setOnboardFloorCount(owner.floor_count ? String(owner.floor_count) : '3')
    setOnboardRooms(owner.approx_rooms ? String(owner.approx_rooms) : '6')
    setOnboardRoomType(owner.room_type || 'Double Sharing')
    setOnboardRent(owner.starting_rent ? String(owner.starting_rent) : '7500')

    // Step 3 defaults
    setOnboardElectricityRate(owner.electricity_rate ? String(owner.electricity_rate) : '10')
    setOnboardMeterType('sub')
    setOnboardAllocationMethod('room_actual')

    // Step 4 defaults
    setOnboardStaffName(owner.staff_name || '')
    setOnboardStaffPhone('')
    setOnboardStaffRole(owner.staff_role || 'Manager / Supervisor')
    setOnboardStaffSalary('15000')

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
          action: action === 'reject' ? 'reject' : 'onboard_pg',
          userId: onboardModalOwner.user_id,
          mobile: onboardMobile.trim() || onboardModalOwner.mobile,
          full_name: onboardOwnerName.trim() || onboardModalOwner.full_name,
          email: onboardEmail.trim() || onboardModalOwner.email,
          property_name: onboardPropName.trim(),
          city: onboardCity.trim(),
          address: onboardAddress.trim(),
          pg_type: onboardPgType,
          building_count: Number(onboardBuildingCount) || 1,
          building_name: onboardBuildingName.trim() || 'Main Block',
          floor_count: Number(onboardFloorCount) || 3,
          approx_rooms: Number(onboardRooms) || 6,
          room_count: Number(onboardRooms) || 6,
          room_type: onboardRoomType,
          starting_rent: Number(onboardRent) || 7500,
          electricity_rate_per_unit: Number(onboardElectricityRate) || 10,
          electricity_meter_type: onboardMeterType,
          electricity_allocation_method: onboardAllocationMethod,
          staff_name: onboardStaffName.trim(),
          staff_phone: onboardStaffPhone.trim(),
          staff_role: onboardStaffRole,
          staff_salary: Number(onboardStaffSalary) || 15000,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to finish onboarding')
      }

      setOnboardSuccess(data.message || 'Owner successfully onboarded and ERP unlocked!')
      await Promise.all([loadPendingOwners(), loadOrganizations()])
      setTimeout(() => {
        setOnboardModalOwner(null)
      }, 1000)
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
                                onClick={() => handleOpenOnboardModal(owner)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                                title="Onboard PG Property & Rooms"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Onboard PG</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenOnboardModal(owner)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                                  title="Setup PG & Unlock ERP (Basic Details, Buildings, Electricity & Staff)"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Unlock ERP</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenOnboardModal(owner)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                                  title="Fill PG details and setup property"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-300" />
                                  <span>Onboard PG</span>
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

      {/* SuperAdmin Onboard & Unlock Owner Guided 4-Step Wizard Modal */}
      {onboardModalOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>ERP Onboarding & Unlock Wizard</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Step {wizardStep} of 4
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Guided setup for {onboardModalOwner.full_name || 'PG Owner'} before unlocking ERP
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOnboardModalOwner(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Step Tabs Indicator */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 text-center mt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    wizardStep === 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span className="truncate">1. Basic</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setWizardStep(2)
                  }}
                  className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    wizardStep === 2
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">2. Building</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1() && validateStep2()) setWizardStep(3)
                  }}
                  className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    wizardStep === 3
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span className="truncate">3. Electricity</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1() && validateStep2()) setWizardStep(4)
                  }}
                  className={`py-1.5 px-1 sm:px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    wizardStep === 4
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span className="truncate">4. Staff</span>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto pr-1 space-y-4 max-h-[55vh]">
              {/* STEP 1: BASIC DETAILS */}
              {wizardStep === 1 && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Step 1: Basic Details</strong> — Verify and update owner identity and property details.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Owner Full Name *
                      </label>
                      <input
                        type="text"
                        value={onboardOwnerName}
                        onChange={(e) => setOnboardOwnerName(e.target.value)}
                        placeholder="Owner name"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Mobile Phone Number *
                      </label>
                      <input
                        type="text"
                        value={onboardMobile}
                        onChange={(e) => setOnboardMobile(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={onboardEmail}
                        onChange={(e) => setOnboardEmail(e.target.value)}
                        placeholder="owner@example.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        PG Type *
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
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Property / PG Brand Name *
                    </label>
                    <input
                      type="text"
                      value={onboardPropName}
                      onChange={(e) => setOnboardPropName(e.target.value)}
                      placeholder="e.g. Sri Lakshmi Luxury PG"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-300">City *</label>
                      <div className="flex items-center gap-1">
                        {['Bengaluru', 'Pune', 'Hyderabad', 'Delhi NCR'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setOnboardCity(c)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={onboardCity}
                      onChange={(e) => setOnboardCity(e.target.value)}
                      placeholder="e.g. Bengaluru"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Physical Address & Landmark
                    </label>
                    <input
                      type="text"
                      value={onboardAddress}
                      onChange={(e) => setOnboardAddress(e.target.value)}
                      placeholder="e.g. #42, 5th Cross, 6th Block, Koramangala"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: BUILDING & STRUCTURE */}
              {wizardStep === 2 && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      <strong>Step 2: Building & Structure</strong> — Define buildings, floors, and rooms. The system will auto-generate rooms and beds.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Number of Buildings
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={onboardBuildingCount}
                        onChange={(e) => setOnboardBuildingCount(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Building / Block Name *
                      </label>
                      <input
                        type="text"
                        value={onboardBuildingName}
                        onChange={(e) => setOnboardBuildingName(e.target.value)}
                        placeholder="e.g. Main Block or Block A"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Number of Floors *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={onboardFloorCount}
                        onChange={(e) => setOnboardFloorCount(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Total Number of Rooms *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={onboardRooms}
                        onChange={(e) => setOnboardRooms(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Default Room Sharing Type
                      </label>
                      <select
                        value={onboardRoomType}
                        onChange={(e) => setOnboardRoomType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Single Room">Single Room (1 Bed)</option>
                        <option value="Double Sharing">Double Sharing (2 Beds)</option>
                        <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                        <option value="Four Sharing">Four Sharing (4 Beds)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Default Monthly Rent (₹/bed)
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

                  {/* Auto-Calculation Preview Card */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Structure Preview</span>
                    <div className="text-slate-300">
                      🏢 <strong>{onboardBuildingName || 'Main Block'}</strong> • {onboardFloorCount || 3} Floors •{' '}
                      {onboardRooms || 6} Rooms (~{Math.ceil(Number(onboardRooms || 6) / Math.max(1, Number(onboardFloorCount || 3)))} rooms/floor)
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold">
                      ✨ Auto-generates ~{Number(onboardRooms || 6) * (onboardRoomType.includes('Single') ? 1 : onboardRoomType.includes('Triple') ? 3 : onboardRoomType.includes('Four') ? 4 : 2)} total beds at ₹{Number(onboardRent || 7500).toLocaleString('en-IN')}/mo per bed.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ELECTRICITY CHARGES */}
              {wizardStep === 3 && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Step 3: Electric Bill Charges</strong> — Configure per-unit electricity tariff and meter billing model.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Electric Bill Charges Per Unit (₹ / kWh) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        step="0.5"
                        value={onboardElectricityRate}
                        onChange={(e) => setOnboardElectricityRate(e.target.value)}
                        placeholder="10"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Standard unit rate charged to residents. Recommended: ₹9 to ₹12 / unit for commercial/residential PG.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Meter Installation Model
                    </label>
                    <select
                      value={onboardMeterType}
                      onChange={(e) => setOnboardMeterType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="sub">Sub-meter per Room (Individual room meters)</option>
                      <option value="common_floor">Common Floor Meter (One meter per floor)</option>
                      <option value="main">Commercial Main Connection (Single whole building meter)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Bill Allocation Method
                    </label>
                    <select
                      value={onboardAllocationMethod}
                      onChange={(e) => setOnboardAllocationMethod(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="room_actual">Actual Room Meter Reading (Units × ₹{onboardElectricityRate})</option>
                      <option value="equal_split">Equal Split (Total units split equally among active occupants)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Electricity Summary</span>
                    <div className="text-slate-300">
                      ⚡ Tariff set to <strong>₹{onboardElectricityRate || 10}/kWh</strong>. Monthly readings can be entered under ERP Electricity Module.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: STAFF INFORMATION */}
              {wizardStep === 4 && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Step 4: On-site Staff</strong> — Assign initial property manager or caretaker (optional; can be added anytime in ERP).
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Staff / Caretaker Name
                      </label>
                      <input
                        type="text"
                        value={onboardStaffName}
                        onChange={(e) => setOnboardStaffName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Staff Phone Number
                      </label>
                      <input
                        type="text"
                        value={onboardStaffPhone}
                        onChange={(e) => setOnboardStaffPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Staff Role / Designation
                      </label>
                      <select
                        value={onboardStaffRole}
                        onChange={(e) => setOnboardStaffRole(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Manager / Supervisor">Manager / Supervisor</option>
                        <option value="Warden">Warden</option>
                        <option value="Caretaker">Caretaker</option>
                        <option value="Security Guard">Security Guard</option>
                        <option value="Cook">Cook</option>
                        <option value="Housekeeping">Housekeeping</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Monthly Salary (₹)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={onboardStaffSalary}
                        onChange={(e) => setOnboardStaffSalary(e.target.value)}
                        placeholder="15000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Summary of full setup before unlock */}
                  <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-xl space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Complete Onboarding Summary</span>
                    <ul className="text-slate-300 space-y-1 text-[11px]">
                      <li>🏠 <strong>Property:</strong> {onboardPropName} ({onboardCity})</li>
                      <li>🏢 <strong>Structure:</strong> {onboardBuildingName} ({onboardFloorCount} Floors, {onboardRooms} Rooms, {onboardRoomType})</li>
                      <li>⚡ <strong>Electricity:</strong> ₹{onboardElectricityRate}/unit ({onboardMeterType === 'sub' ? 'Room Sub-meter' : 'Floor/Main'})</li>
                      <li>👥 <strong>Staff:</strong> {onboardStaffName ? `${onboardStaffName} (${onboardStaffRole})` : 'To be added later'}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Error & Success Messages */}
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

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setOnboardModalOwner(null)}
                disabled={onboardSubmitting}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => (s > 1 ? ((s - 1) as any) : 1))}
                    disabled={onboardSubmitting}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep === 1 && validateStep1()) setWizardStep(2)
                      else if (wizardStep === 2 && validateStep2()) setWizardStep(3)
                      else if (wizardStep === 3) setWizardStep(4)
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <span>
                      {wizardStep === 1
                        ? 'Next: Building & Floors →'
                        : wizardStep === 2
                        ? 'Next: Electric Charges →'
                        : 'Next: Staff Info →'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCompleteOnboarding('onboard_pg')}
                    disabled={onboardSubmitting || !onboardPropName.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {onboardSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5" />
                    )}
                    <span>Save Setup & Unlock ERP</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
