'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Users, CreditCard, DollarSign, PlusCircle, Plus,
  TrendingUp, ShieldCheck, CheckCircle2, AlertCircle,
  Loader2, Sparkles, Database, Layers, ArrowUpRight,
  ExternalLink, Search, RefreshCw, X, Check, Edit2, KeyRound,
  ShieldAlert, Server, Activity, Terminal, ArrowRight, Trash2,
  Lock, Settings, BarChart3, ChevronRight, Phone, Mail, MapPin
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'pgs' | 'subscriptions' | 'transactions' | 'users' | 'tools'>('pgs')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Data States
  const [stats, setStats] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [subscriptionsData, setSubscriptionsData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  // Modal States
  const [showOnboardModal, setShowOnboardModal] = useState(false)
  const [onboardLoading, setOnboardLoading] = useState(false)
  const [onboardError, setOnboardError] = useState('')
  const [onboardSuccess, setOnboardSuccess] = useState('')

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [createUserLoading, setCreateUserLoading] = useState(false)
  const [createUserError, setCreateUserError] = useState('')
  const [createUserSuccess, setCreateUserSuccess] = useState('')
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'owner',
    organization_id: '',
  })

  // Edit Plan Modal
  const [selectedOrgForPlan, setSelectedOrgForPlan] = useState<any>(null)
  const [planLoading, setPlanLoading] = useState(false)

  // Onboard Form State
  const [onboardForm, setOnboardForm] = useState({
    org_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    property_name: '',
    city: 'Pune',
    address: '',
    gst_enabled: false,
    gstin: '',
    plan: 'per_bed',
    num_buildings: 1,
    floors_per_building: 3,
    rooms_per_floor: 4,
    beds_per_room: 2,
    base_rent_rupees: 6500,
  })

  // Load all platform data
  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, orgsRes, subsRes, txRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/organizations'),
        fetch('/api/admin/subscriptions'),
        fetch('/api/admin/payments?limit=50'),
        fetch('/api/admin/users'),
      ])

      const statsData = await statsRes.json()
      const orgsData = await orgsRes.json()
      const subsData = await subsRes.json()
      const txData = await txRes.json()
      const usersData = await usersRes.json()

      if (statsData.success) setStats(statsData.stats)
      if (orgsData.success) setOrganizations(orgsData.organizations || [])
      if (subsData.success) setSubscriptionsData(subsData)
      if (txData.success) setTransactions(txData.payments || [])
      if (usersData.success) setUsers(usersData.users || [])
    } catch (err) {
      console.error('Failed to load admin data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle 1-Click Onboard Submit
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOnboardLoading(true)
    setOnboardError('')
    setOnboardSuccess('')

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardForm),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to onboard PG organization')

      setOnboardSuccess(`Successfully onboarded "${onboardForm.org_name}" with ${data.organization?.rooms_created || 12} rooms and ${data.organization?.beds_created || 24} beds!`)
      await loadData()
      setTimeout(() => {
        setShowOnboardModal(false)
        setOnboardSuccess('')
      }, 2000)
    } catch (err: any) {
      setOnboardError(err.message)
    } finally {
      setOnboardLoading(false)
    }
  }

  // Handle Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateUserLoading(true)
    setCreateUserError('')
    setCreateUserSuccess('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create platform user')

      setCreateUserSuccess(`User ${userForm.email} successfully created with role: ${userForm.role}!`)
      await loadData()
      setTimeout(() => {
        setShowCreateUserModal(false)
        setCreateUserSuccess('')
        setUserForm({ email: '', password: '', full_name: '', phone: '', role: 'owner', organization_id: '' })
      }, 1800)
    } catch (err: any) {
      setCreateUserError(err.message)
    } finally {
      setCreateUserLoading(false)
    }
  }

  // Handle Plan Modification
  const handleUpdatePlan = async (planId: string, status: string) => {
    if (!selectedOrgForPlan) return
    setPlanLoading(true)

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrgForPlan.id || selectedOrgForPlan.org_id,
          plan: planId,
          status,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription')

      setSelectedOrgForPlan(null)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPlanLoading(false)
    }
  }

  // Filter organizations by search
  const filteredOrgs = organizations.filter((org) => {
    const q = searchQuery.toLowerCase()
    return (
      (org.name || '').toLowerCase().includes(q) ||
      (org.slug || '').toLowerCase().includes(q) ||
      (org.city || '').toLowerCase().includes(q) ||
      (org.owner_name || '').toLowerCase().includes(q) ||
      (org.owner_email || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white pb-20">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP ENTERPRISE CONSOLE NAVIGATION BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
        
        {/* Brand & Environment Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/20 shrink-0">
            <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-tight uppercase">PG-SETU PLATFORM</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-extrabold uppercase">
                ROOT ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Multi-Tenant Global Control Console · Master Administrator
            </p>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition active:scale-95"
            title="Refresh Real-Time Telemetry"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin text-blue-400')} />
          </button>

          <button
            onClick={() => setShowCreateUserModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Create User</span>
          </button>

          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-blue-600/30 active:scale-95"
          >
            <Building2 className="w-4 h-4 stroke-[2.2]" />
            <span>+ 1-Click Onboard PG</span>
          </button>

          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-1 text-xs text-slate-400 hover:text-white font-semibold pl-2 border-l border-slate-800 transition"
          >
            <span>Exit to PG Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN PLATFORM CONTAINER */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        
        {/* Executive Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SAAS PLATFORM OPERATIONAL · ZERO DOWNTIME</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Company Executive Administration
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Platform-wide oversight for client PGs, multi-property inventory matrix, SaaS subscription recurring run rate, and master transaction telemetry.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-left">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Platform SaaS Model</p>
                <p className="text-base sm:text-lg font-black text-blue-400 mt-0.5">₹10 / Bed / Mo</p>
                <p className="text-[10px] text-slate-400">Pay-Per-Capacity Billing</p>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. PLATFORM TELEMETRY KPI CARDS (6-CARD ENTERPRISE GRID) */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Card 1: ONBOARDED PGS */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">ONBOARDED PGS</span>
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats?.total_organizations ?? organizations.length ?? 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{stats?.total_properties ?? organizations.length} active properties</p>
            </div>
          </div>

          {/* Card 2: MANAGED BEDS */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">TOTAL BEDS</span>
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats?.total_beds ?? 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats?.occupied_beds ?? 0} occupied ({stats?.occupancy_rate ?? 0}%)
              </p>
            </div>
          </div>

          {/* Card 3: ACTIVE RESIDENTS */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">RESIDENTS</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats?.active_residents ?? 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across all client PGs</p>
            </div>
          </div>

          {/* Card 4: PLATFORM GTV VOLUME */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">PLATFORM GTV</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">{formatCurrency(stats?.platform_gtv_paise ?? 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Gross billed volume</p>
            </div>
          </div>

          {/* Card 5: PROCESSED RENT */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">RENT COLLECTED</span>
              <CreditCard className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-teal-300">{formatCurrency(stats?.total_collected_paise ?? 0)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Processed by PGs</p>
            </div>
          </div>

          {/* Card 6: SAAS MRR RUN RATE */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm bg-gradient-to-br from-purple-950/40 to-slate-900">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-purple-400">COMPANY MRR</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-purple-300">
                ₹{((stats?.saas_mrr_rupees ?? (stats?.total_beds ? stats.total_beds * 10 : 0))).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-purple-200/70 mt-0.5">Recurring SaaS revenue</p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. TAB NAVIGATION STRIP */}
        {/* ------------------------------------------------------------- */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
          <div className="overflow-x-auto pb-1 scrollbar-none flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('pgs')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95',
                activeTab === 'pgs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>PG Organizations</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-md font-mono">{organizations.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95',
                activeTab === 'subscriptions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>SaaS Subscriptions & Billing</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95',
                activeTab === 'transactions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Global Transaction Stream</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-md font-mono">{transactions.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95',
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Platform Users & Roles</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/60 rounded-md font-mono">{users.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap active:scale-95',
                activeTab === 'tools'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-slate-900'
              )}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data Purge & Diagnostics</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: PG ORGANIZATIONS DIRECTORY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'pgs' && (
          <div className="space-y-4">
            
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by PG name, slug, city, owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Showing {filteredOrgs.length} of {organizations.length} PGs
                </span>
                <button
                  onClick={() => setShowOnboardModal(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  + Add Client PG
                </button>
              </div>
            </div>

            {/* Organizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrgs.map((org) => {
                const totalBeds = org.total_beds || org.beds_count || 0
                const occupiedBeds = org.occupied_beds || 0
                const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
                const mrr = totalBeds * 10

                return (
                  <div
                    key={org.id || org.slug}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm transition group"
                  >
                    {/* Header: Title, City, Plan */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors">
                          {org.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{org.city || 'Pune'}</span>
                          <span>·</span>
                          <span className="font-mono text-[11px] text-slate-500">slug: {org.slug}</span>
                        </p>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold uppercase">
                        {org.settings?.plan || 'PER_BED'}
                      </span>
                    </div>

                    {/* Capacity & Yield Stats */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/80 border border-slate-800/60 rounded-xl text-center">
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase">Capacity</p>
                        <p className="text-sm font-black text-white mt-0.5">{totalBeds} beds</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase">Occupancy</p>
                        <p className={cn('text-sm font-black mt-0.5', occupancyPct >= 80 ? 'text-emerald-400' : 'text-slate-300')}>
                          {occupancyPct}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-slate-500 uppercase">SaaS Yield</p>
                        <p className="text-sm font-black text-purple-400 mt-0.5">₹{mrr}/mo</p>
                      </div>
                    </div>

                    {/* Owner Contact */}
                    <div className="text-xs space-y-1 text-slate-400 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Owner Contact:</span>
                        <span className="text-white font-medium">{org.owner_name || org.phone || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Collected Rent:</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(org.total_collected_paise || 0)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedOrgForPlan(org)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                      >
                        Edit Plan
                      </button>

                      <Link
                        href={`/dashboard?orgId=${org.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition"
                      >
                        <span>Open Workspace</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: SAAS SUBSCRIPTIONS & BILLING */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Plan 1: Standard Pay-Per-Bed */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 relative">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold uppercase">
                  DEFAULT SAAS
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">Standard Pay-Per-Bed</h3>
                  <p className="text-xs text-slate-400 mt-1">₹10 per managed bed per month</p>
                </div>
                <div className="text-3xl font-black text-blue-400">
                  ₹10 <span className="text-xs font-normal text-slate-400">/ bed / mo</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
                  <li className="flex items-center gap-2">✓ Unlimited Residents & KYC Vault</li>
                  <li className="flex items-center gap-2">✓ Dynamic UPI QR & Payment Registers</li>
                  <li className="flex items-center gap-2">✓ Sub-Meter Electricity Splitter</li>
                  <li className="flex items-center gap-2">✓ Tenant Self-Service Passbook Portal</li>
                </ul>
              </div>

              {/* Plan 2: 100-Bed Fixed */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold uppercase">
                  VOLUME TIER
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">100-Bed Fixed Tier</h3>
                  <p className="text-xs text-slate-400 mt-1">Optimized for mid-size PG hostels</p>
                </div>
                <div className="text-3xl font-black text-purple-400">
                  ₹1,000 <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
                  <li className="flex items-center gap-2">✓ Up to 100 Managed Beds</li>
                  <li className="flex items-center gap-2">✓ Multi-Manager Staff Accounts</li>
                  <li className="flex items-center gap-2">✓ Priority WhatsApp Notifications</li>
                </ul>
              </div>

              {/* Plan 3: 500-Bed Enterprise */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold uppercase">
                  CAMPUS / ENTERPRISE
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">500-Bed Campus Tier</h3>
                  <p className="text-xs text-slate-400 mt-1">For multi-building hostel campuses</p>
                </div>
                <div className="text-3xl font-black text-emerald-400">
                  ₹5,000 <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2 border-t border-slate-800 pt-3">
                  <li className="flex items-center gap-2">✓ Up to 500 Managed Beds</li>
                  <li className="flex items-center gap-2">✓ Custom Billing Cycles & GST Integration</li>
                  <li className="flex items-center gap-2">✓ Dedicated Account Manager</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: GLOBAL TRANSACTION STREAM */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Real-Time Platform Transaction Feed</h3>
                <p className="text-xs text-slate-400">Live stream of all rent collections across all client PGs</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Time & Date</th>
                    <th className="p-3">PG Organization</th>
                    <th className="p-3">Resident</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-slate-400">{formatDateTime(tx.payment_time || tx.created_at)}</td>
                      <td className="p-3 font-bold text-white">{tx.organizations?.name || 'PG-SETU'}</td>
                      <td className="p-3 text-slate-200">{tx.residents?.full_name || 'Resident'}</td>
                      <td className="p-3 uppercase font-mono text-slate-400">{tx.payment_method}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatCurrency(tx.amount_paise)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No transactions recorded on the platform yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: PLATFORM USERS & ROLES */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Platform User Directory</h3>
                <p className="text-xs text-slate-400">All registered PG owners, staff, and super administrators</p>
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                + Create User & Password
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">PG Organization</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{u.full_name || 'User'}</td>
                      <td className="p-3 font-mono text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono',
                          u.role === 'superadmin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          u.role === 'owner' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-slate-800 text-slate-300'
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{u.organizations?.name || 'All Platform'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-500/10">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: DATA PURGE & DIAGNOSTICS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'tools' && (
          <div className="bg-slate-900 border border-rose-900/50 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
                <Database className="w-5 h-5 text-rose-500" />
                <span>Production Data Purge & Diagnostics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Wipe test records, mock invoices, and sample resident data before handing over to actual PG owners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div key={org.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white">{org.name}</h4>
                    <span className="text-xs font-mono text-slate-500">ID: {org.id?.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Capacity: <strong>{org.total_beds || 0} Beds</strong> · Total Collected: <strong>{formatCurrency(org.total_collected_paise || 0)}</strong>
                  </p>
                  
                  <button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to wipe all test transactions and reset resident occupancy to 0 for "${org.name}"?`)) return
                      try {
                        const res = await fetch('/api/admin/purge-data', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ organization_id: org.id }),
                        })
                        const d = await res.json()
                        if (!res.ok) throw new Error(d.error || 'Failed to purge')
                        alert(`Data purged for ${org.name}!`)
                        await loadData()
                      } catch (err: any) {
                        alert(err.message)
                      }
                    }}
                    className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wipe Mock Data & Reset to Blank</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: 1-CLICK ONBOARD PG ORGANIZATIONS */}
      {/* ------------------------------------------------------------- */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold uppercase">
                1-Click Deployment Engine
              </span>
              <h3 className="text-xl font-black text-white mt-1">Onboard New Client PG</h3>
              <p className="text-xs text-slate-400">Instantly provisions Org, Property, Building, Floors, Rooms, Beds & Sub-Meters</p>
            </div>

            {onboardError && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold">
                {onboardError}
              </div>
            )}
            {onboardSuccess && (
              <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold">
                {onboardSuccess}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">PG Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Living PG"
                    value={onboardForm.org_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, org_name: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Property Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Hostel Campus"
                    value={onboardForm.property_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, property_name: e.target.value })}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={onboardForm.owner_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Owner Email</label>
                  <input
                    type="email"
                    placeholder="owner@royalpg.com"
                    value={onboardForm.owner_email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_email: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Owner Mobile</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={onboardForm.owner_phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Physical Layout Matrix */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="font-bold text-slate-200 block text-xs">Inventory Generator</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Total Floors</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={onboardForm.floors_per_building}
                      onChange={(e) => setOnboardForm({ ...onboardForm, floors_per_building: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Rooms / Floor</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={onboardForm.rooms_per_floor}
                      onChange={(e) => setOnboardForm({ ...onboardForm, rooms_per_floor: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Beds / Room</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={onboardForm.beds_per_room}
                      onChange={(e) => setOnboardForm({ ...onboardForm, beds_per_room: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Rent / Bed (₹)</label>
                    <input
                      type="number"
                      step={500}
                      value={onboardForm.base_rent_rupees}
                      onChange={(e) => setOnboardForm({ ...onboardForm, base_rent_rupees: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-blue-400 font-mono">
                  ➜ Generates {onboardForm.floors_per_building * onboardForm.rooms_per_floor} Rooms & {onboardForm.floors_per_building * onboardForm.rooms_per_floor * onboardForm.beds_per_room} Beds with Sub-Meters.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {onboardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{onboardLoading ? 'Provisioning System...' : 'Deploy & Launch PG'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: EDIT SUBSCRIPTION PLAN */}
      {/* ------------------------------------------------------------- */}
      {selectedOrgForPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrgForPlan(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-black text-white">SaaS Plan: {selectedOrgForPlan.name}</h3>
              <p className="text-xs text-slate-400">Select pricing tier for client organization</p>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                disabled={planLoading}
                onClick={() => handleUpdatePlan('per_bed', 'active')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex justify-between items-center transition"
              >
                <div>
                  <strong className="text-white block">Standard Pay-Per-Bed</strong>
                  <span className="text-[10px] text-slate-400">₹10 per bed/month based on inventory</span>
                </div>
                <span className="font-mono font-bold text-blue-400">₹10/bed</span>
              </button>

              <button
                type="button"
                disabled={planLoading}
                onClick={() => handleUpdatePlan('standard_100', 'active')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex justify-between items-center transition"
              >
                <div>
                  <strong className="text-white block">100-Bed Fixed Tier</strong>
                  <span className="text-[10px] text-slate-400">Fixed rate up to 100 beds</span>
                </div>
                <span className="font-mono font-bold text-purple-400">₹1,000/mo</span>
              </button>

              <button
                type="button"
                disabled={planLoading}
                onClick={() => handleUpdatePlan('enterprise_500', 'active')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex justify-between items-center transition"
              >
                <div>
                  <strong className="text-white block">500-Bed Campus Tier</strong>
                  <span className="text-[10px] text-slate-400">Enterprise multi-building campus</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">₹5,000/mo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: CREATE PLATFORM USER */}
      {/* ------------------------------------------------------------- */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCreateUserModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-black text-white">Create Platform User</h3>
              <p className="text-xs text-slate-400">Assign role and credentials for any PG organization</p>
            </div>

            {createUserError && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {createUserError}
              </div>
            )}
            {createUserSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold">
                {createUserSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  placeholder="owner@mypropertypg.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  >
                    <option value="owner">PG Owner</option>
                    <option value="manager">Manager</option>
                    <option value="accountant">Accountant</option>
                    <option value="staff">Staff</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Organization</label>
                <select
                  value={userForm.organization_id}
                  onChange={(e) => setUserForm({ ...userForm, organization_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                >
                  <option value="">Platform / All PGs</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  {createUserLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
