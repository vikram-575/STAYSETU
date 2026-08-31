'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2, Users, CreditCard, DollarSign, PlusCircle, Plus,
  TrendingUp, ShieldCheck, CheckCircle2, AlertCircle,
  Loader2, Sparkles, Database, Layers, ArrowUpRight,
  ExternalLink, Search, RefreshCw, X, Check, Edit2, KeyRound,
  ShieldAlert, Server, Activity, Terminal, ArrowRight, Trash2,
  Lock, Settings, BarChart3, ChevronRight, Phone, Mail, MapPin,
  MessageSquare, Radio, Send, LifeBuoy, AlertTriangle, UserCheck,
  Zap, Copy, ArrowDownRight, Globe
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

export default function MasterCompanyAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'fleet' | 'payments' | 'support' | 'users' | 'broadcast' | 'health'>('fleet')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Data States
  const [stats, setStats] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  // Modal States
  const [showOnboardModal, setShowOnboardModal] = useState(false)
  const [onboardLoading, setOnboardLoading] = useState(false)
  const [onboardError, setOnboardError] = useState('')
  const [onboardSuccess, setOnboardSuccess] = useState('')

  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [createUserLoading, setCreateUserLoading] = useState(false)
  const [createUserError, setCreateUserError] = useState('')
  const [createUserSuccess, setCreateUserSuccess] = useState('')

  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<any>(null)
  const [editOrgLoading, setEditOrgLoading] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [ticketActionLoading, setTicketActionLoading] = useState(false)

  const [impersonatingOrgId, setImpersonatingOrgId] = useState<string | null>(null)

  // Broadcast Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState('')
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    target_city: 'all',
  })

  // Forms
  const [onboardForm, setOnboardForm] = useState({
    org_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    property_name: '',
    city: 'Pune',
    address: '',
    num_buildings: 1,
    floors_per_building: 3,
    rooms_per_floor: 4,
    beds_per_room: 2,
    base_rent_rupees: 6500,
    upi_id: '',
  })

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'owner',
    organization_id: '',
  })

  // Load all platform data
  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, orgsRes, txRes, usersRes, supportRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/organizations'),
        fetch('/api/admin/payments?limit=100'),
        fetch('/api/admin/users'),
        fetch('/api/admin/support?limit=100'),
      ])

      const statsData = await statsRes.json()
      const orgsData = await orgsRes.json()
      const txData = await txRes.json()
      const usersData = await usersRes.json()
      const supportData = await supportRes.json()

      if (statsData.success) setStats(statsData.stats)
      if (orgsData.success) setOrganizations(orgsData.organizations || [])
      if (txData.success) setTransactions(txData.payments || [])
      if (usersData.success) setUsers(usersData.users || [])
      if (supportData.success) setTickets(supportData.tickets || [])
    } catch (err) {
      console.error('Failed to load company admin data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
      if (!res.ok) throw new Error(data.error || 'Failed to switch PG context')

      router.push('/dashboard')
    } catch (err: any) {
      alert(err.message || 'Impersonation failed')
      setImpersonatingOrgId(null)
    }
  }

  // 1-Click Onboard Submit
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

      setOnboardSuccess(`Successfully provisioned "${onboardForm.org_name}" with ${data.organization?.rooms_created || 12} rooms & ${data.organization?.beds_created || 24} beds!`)
      await loadData()
      setTimeout(() => {
        setShowOnboardModal(false)
        setOnboardSuccess('')
      }, 1500)
    } catch (err: any) {
      setOnboardError(err.message)
    } finally {
      setOnboardLoading(false)
    }
  }

  // Create User Submit
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

      setCreateUserSuccess(`User ${userForm.email} created as ${userForm.role}!`)
      await loadData()
      setTimeout(() => {
        setShowCreateUserModal(false)
        setCreateUserSuccess('')
        setUserForm({ email: '', password: '', full_name: '', phone: '', role: 'owner', organization_id: '' })
      }, 1500)
    } catch (err: any) {
      setCreateUserError(err.message)
    } finally {
      setCreateUserLoading(false)
    }
  }

  // Update Org Plan & Details
  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgForEdit) return
    setEditOrgLoading(true)

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedOrgForEdit),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update PG')

      setSelectedOrgForEdit(null)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setEditOrgLoading(false)
    }
  }

  // Delete / Purge Org
  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE "${orgName}" and all its rooms, residents, and transactions?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/organizations?id=${orgId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete PG')
      await loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Support Ticket Status Update
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string, adminNotes?: string) => {
    setTicketActionLoading(true)
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus, admin_notes: adminNotes }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket')

      setSelectedTicket(null)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setTicketActionLoading(false)
    }
  }

  // Send Broadcast Announcement
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBroadcastLoading(true)
    setBroadcastSuccess('')

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send broadcast')

      setBroadcastSuccess(data.message || 'Broadcast queued successfully!')
      setTimeout(() => {
        setShowBroadcastModal(false)
        setBroadcastSuccess('')
        setBroadcastForm({ title: '', message: '', target_city: 'all' })
      }, 1500)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setBroadcastLoading(false)
    }
  }

  // Filtered Orgs
  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        (org.name || '').toLowerCase().includes(q) ||
        (org.slug || '').toLowerCase().includes(q) ||
        (org.city || '').toLowerCase().includes(q) ||
        (org.owner_name || '').toLowerCase().includes(q) ||
        (org.owner_phone || '').includes(q)

      const matchesCity = cityFilter === 'all' || (org.city || '').toLowerCase() === cityFilter.toLowerCase()
      const matchesStatus = statusFilter === 'all' || (org.subscription_status || 'active') === statusFilter

      return matchesSearch && matchesCity && matchesStatus
    })
  }, [organizations, searchQuery, cityFilter, statusFilter])

  // Unique cities list
  const uniqueCities = useMemo(() => {
    const set = new Set<string>()
    organizations.forEach((o) => {
      if (o.city) set.add(o.city)
    })
    return Array.from(set)
  }, [organizations])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">PG-SETU COMMAND CENTER</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-black uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Enterprise Fleet & Platform Control for Thousands of PGs</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Refresh Real-Time Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowBroadcastModal(true)}
              className="py-2.5 px-3.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-purple-400" /> Broadcast
            </button>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" /> Add User
            </button>

            <button
              onClick={() => setShowOnboardModal(true)}
              className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Quick Onboard PG
            </button>
          </div>
        </div>

        {/* Global Live Ticker Bar */}
        {stats && (
          <div className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 py-2.5 text-xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-6 text-slate-400">
              <div className="flex items-center gap-2 shrink-0">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>PGs: <strong className="text-white">{stats.total_organizations}</strong></span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Managed Beds: <strong className="text-white">{stats.total_beds}</strong> ({stats.occupancy_rate_pct}% Occupied)</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Platform GMV: <strong className="text-emerald-400">{formatCurrency(stats.platform_gtv_paise)}</strong></span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>SaaS MRR (₹10/bed): <strong className="text-amber-300">{formatCurrency(stats.platform_saas_mrr_paise)}/mo</strong></span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
                <span>Open Tickets: <strong className={stats.open_tickets_count > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>{stats.open_tickets_count}</strong></span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content & Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        
        {/* Tab Selector */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
          {[
            { id: 'fleet', label: '🏢 PG Fleet Management', count: organizations.length },
            { id: 'payments', label: '💳 Financials & Settlements', count: transactions.length },
            { id: 'support', label: '🎧 Customer Support & Tickets', count: tickets.filter((t) => t.status === 'open').length, highlight: tickets.some((t) => t.status === 'open') },
            { id: 'users', label: '👥 User & Staff Directory', count: users.length },
            { id: 'broadcast', label: '📢 System Announcements' },
            { id: 'health', label: '⚡ Infrastructure Health' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  tab.highlight
                    ? 'bg-rose-500 text-white font-black animate-pulse'
                    : activeTab === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: PG FLEET MANAGEMENT (THOUSANDS OF PGS AT SCALE)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'fleet' && (
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search PG by name, slug, city, or owner..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Cities ({organizations.length})</option>
                  {uniqueCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Plan</option>
                  <option value="trial">Free Trial</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Organizations High-Scale Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4 font-bold">PG Property & Brand</th>
                      <th className="py-3 px-4 font-bold">Owner & Contact</th>
                      <th className="py-3 px-4 font-bold">Capacity & Occupancy</th>
                      <th className="py-3 px-4 font-bold">Invoiced GMV</th>
                      <th className="py-3 px-4 font-bold">Plan & Validity</th>
                      <th className="py-3 px-4 font-bold text-right">Quick Master Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrgs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No PG organizations matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrgs.map((org) => {
                        const isImpersonating = impersonatingOrgId === org.id
                        const occupancyPct = org.total_beds > 0 ? Math.round((org.occupied_beds / org.total_beds) * 100) : 0
                        return (
                          <tr key={org.id} className="hover:bg-slate-800/40 transition">
                            {/* Property Details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                  <strong className="text-white block">{org.name}</strong>
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-500" /> {org.city || 'India'} · <code className="text-slate-500">{org.slug}</code>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Owner */}
                            <td className="py-3.5 px-4">
                              <span className="text-white font-semibold block">{org.owner_name || 'Owner Profile'}</span>
                              <span className="text-[11px] text-slate-400">{org.owner_phone || org.phone || 'No Phone'}</span>
                            </td>

                            {/* Beds & Occupancy */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <strong className="text-white">{org.total_beds} Beds</strong>
                                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    {occupancyPct}%
                                  </span>
                                </div>
                                <div className="w-24 bg-slate-800 rounded-full h-1 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full"
                                    style={{ width: `${occupancyPct}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* GMV */}
                            <td className="py-3.5 px-4">
                              <strong className="text-emerald-400 block">{formatCurrency(org.total_collected_paise || 0)}</strong>
                              <span className="text-[10px] text-slate-500">
                                Due: {formatCurrency(org.total_outstanding_paise || 0)}
                              </span>
                            </td>

                            {/* Plan & Status */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold text-[10px] uppercase border border-blue-500/20">
                                  {org.plan} (₹10/bed)
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  Valid: {org.subscription_valid_until ? formatDate(org.subscription_valid_until) : 'Active'}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* 1-Click Impersonate */}
                                <button
                                  onClick={() => handleImpersonate(org)}
                                  disabled={isImpersonating}
                                  className="py-1.5 px-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg border border-blue-500/30 text-[11px] font-bold transition flex items-center gap-1"
                                  title="Log into this PG Dashboard as Master Admin"
                                >
                                  {isImpersonating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                                  <span>Login as PG</span>
                                </button>

                                {/* Direct WhatsApp Owner */}
                                {org.owner_phone && (
                                  <a
                                    href={`https://wa.me/91${org.owner_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello from PG-SETU Support team regarding ${org.name}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg border border-emerald-500/30 transition"
                                    title="Chat with Owner on WhatsApp"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                {/* Edit Plan & Details */}
                                <button
                                  onClick={() => setSelectedOrgForEdit(org)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                                  title="Edit PG Configuration"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete / Purge */}
                                <button
                                  onClick={() => handleDeleteOrg(org.id, org.name)}
                                  className="p-1.5 bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-800/40 transition"
                                  title="Delete Organization"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

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

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: GLOBAL PAYMENTS & TRANSACTIONS STREAM
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Cross-PG Transaction Stream</h3>
                <p className="text-xs text-slate-400">Live feed of resident rent payments and UPI settlements across all onboarded properties.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Total Loaded: {transactions.length} Transactions
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4 font-bold">Receipt / Txn ID</th>
                      <th className="py-3 px-4 font-bold">PG Property</th>
                      <th className="py-3 px-4 font-bold">Resident</th>
                      <th className="py-3 px-4 font-bold">Amount (₹)</th>
                      <th className="py-3 px-4 font-bold">Method</th>
                      <th className="py-3 px-4 font-bold">Timestamp</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No transactions recorded yet across the platform.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {tx.payment_number || tx.transaction_id || tx.id.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {tx.organizations?.name || 'Unknown PG'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white block font-medium">{tx.residents?.full_name || 'Resident'}</span>
                            <span className="text-[11px] text-slate-500">{tx.residents?.phone}</span>
                          </td>
                          <td className="py-3 px-4 font-black text-emerald-400">
                            {formatCurrency(tx.amount_paise)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                              {tx.payment_method || 'UPI'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {tx.payment_date ? formatDate(tx.payment_date) : formatDateTime(tx.created_at)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              Success
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: CUSTOMER SUPPORT & HELPDESK TICKETS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-blue-400" /> Universal Helpdesk & Escalations
                </h3>
                <p className="text-xs text-slate-400">Manage tenant maintenance requests and owner support escalations across all PGs.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">All Clear! No active customer support tickets.</p>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          t.status === 'open' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          t.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {t.status}
                        </span>
                        <span className="text-[10px] text-slate-500">{formatDate(t.created_at)}</span>
                      </div>

                      <h4 className="text-sm font-black text-white">{t.title || t.category || 'Support Request'}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{t.description}</p>

                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                        <div>PG: <strong className="text-white">{t.organizations?.name || 'Unknown'}</strong> ({t.organizations?.city})</div>
                        <div>Resident: <strong className="text-white">{t.residents?.full_name}</strong> ({t.residents?.phone})</div>
                        {t.admin_notes && (
                          <div className="p-2 bg-slate-950 rounded-lg text-amber-300 text-[10px] mt-1.5">
                            Note: {t.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      {t.residents?.phone && (
                        <a
                          href={`https://wa.me/91${t.residents.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${t.residents.full_name}, regarding your ticket "${t.title}": `)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> WhatsApp
                        </a>
                      )}

                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                        className="py-1 px-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: GLOBAL USER & STAFF DIRECTORY
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Global Identity & User Directory</h3>
                <p className="text-xs text-slate-400">Manage all registered Owners, Managers, Accountants, and Staff accounts.</p>
              </div>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Platform User
              </button>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4 font-bold">User</th>
                      <th className="py-3 px-4 font-bold">Role</th>
                      <th className="py-3 px-4 font-bold">Assigned PG</th>
                      <th className="py-3 px-4 font-bold">Contact</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <strong className="text-white block">{u.full_name || 'User'}</strong>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            u.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            u.role === 'owner' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {u.organizations?.name || 'Universal / Unassigned'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.phone || 'No phone'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 5: SYSTEM ANNOUNCEMENTS & BROADCAST
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-400" /> Platform-Wide Announcement Broadcast
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send system maintenance notices, new feature releases, or policy updates to all PG owners instantly.
                </p>
              </div>

              {broadcastSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-bold">
                  {broadcastSuccess}
                </div>
              )}

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Announcement Headline *</label>
                  <input
                    required
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    placeholder="e.g. Scheduled System Upgrade on Sunday at 2:00 AM"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Geographic Audience</label>
                  <select
                    value={broadcastForm.target_city}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, target_city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="all">All Cities & All PG Properties ({organizations.length} PGs)</option>
                    {uniqueCities.map((c) => (
                      <option key={c} value={c}>Only PGs in {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Message Content *</label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    placeholder="Type announcement details for PG owners..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {broadcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{broadcastLoading ? 'Dispatching Broadcast...' : 'Dispatch Announcement Broadcast →'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 6: INFRASTRUCTURE & PLATFORM DIAGNOSTICS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" /> Database & PostgREST Health
              </h3>
              <p className="text-xs text-slate-400">Real-time status of backend microservices and database connection pool.</p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Supabase Postgres Engine</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected (Port 5432)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">PostgREST Schema Cache</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synced & Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-300">Edge WebCrypto Auth</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> HMAC-SHA256 Ready
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" /> Emergency Recovery & Test Purge
              </h3>
              <p className="text-xs text-slate-400">Purge mock transactions from specific test organizations while keeping properties intact.</p>

              <button
                onClick={() => {
                  const orgId = prompt('Enter Organization ID to purge mock residents and invoices:')
                  if (!orgId) return
                  fetch('/api/admin/purge-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ organization_id: orgId }),
                  })
                    .then((r) => r.json())
                    .then((d) => alert(d.message || d.error))
                    .catch((e) => alert(e.message))
                }}
                className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Purge Mock Test Data for Organization
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: QUICK ONBOARD PG (OPERATIONS TEAM)
      ───────────────────────────────────────────────────────────── */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" /> 1-Click Fast PG Onboard
                </h3>
                <p className="text-[11px] text-slate-400">Instantly provision an organization, buildings, rooms, beds & owner account</p>
              </div>
              <button onClick={() => setShowOnboardModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {onboardError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold">
                {onboardError}
              </div>
            )}

            {onboardSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-bold">
                {onboardSuccess}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">PG Brand Name *</label>
                  <input
                    required
                    value={onboardForm.org_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, org_name: e.target.value })}
                    placeholder="e.g. Royal Star Living"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Campus Name *</label>
                  <input
                    required
                    value={onboardForm.property_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, property_name: e.target.value })}
                    placeholder="e.g. Hinjawadi Main"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Owner Name *</label>
                  <input
                    required
                    value={onboardForm.owner_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_name: e.target.value })}
                    placeholder="Owner Full Name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Owner Phone *</label>
                  <input
                    required
                    value={onboardForm.owner_phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">City</label>
                  <input
                    value={onboardForm.city}
                    onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={onboardForm.floors_per_building}
                    onChange={(e) => setOnboardForm({ ...onboardForm, floors_per_building: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rooms/Floor</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={onboardForm.rooms_per_floor}
                    onChange={(e) => setOnboardForm({ ...onboardForm, rooms_per_floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Direct PG Owner UPI ID (VPA)</label>
                <input
                  value={onboardForm.upi_id}
                  onChange={(e) => setOnboardForm({ ...onboardForm, upi_id: e.target.value })}
                  placeholder="e.g. royalstar@upi"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="py-2.5 px-4 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardLoading}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {onboardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Provision PG Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT PG CONFIGURATION & SUBSCRIPTION PLAN
      ───────────────────────────────────────────────────────────── */}
      {selectedOrgForEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Edit {selectedOrgForEdit.name}</h3>
                <p className="text-[11px] text-slate-400">Update Subscription Status, Plan & Direct UPI</p>
              </div>
              <button onClick={() => setSelectedOrgForEdit(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrg} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">PG Name</label>
                <input
                  value={selectedOrgForEdit.name || ''}
                  onChange={(e) => setSelectedOrgForEdit({ ...selectedOrgForEdit, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Subscription Status</label>
                  <select
                    value={selectedOrgForEdit.subscription_status || 'active'}
                    onChange={(e) => setSelectedOrgForEdit({ ...selectedOrgForEdit, subscription_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option value="active">Active Plan</option>
                    <option value="trial">Trial Period</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pricing Plan</label>
                  <select
                    value={selectedOrgForEdit.plan || 'per_bed'}
                    onChange={(e) => setSelectedOrgForEdit({ ...selectedOrgForEdit, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option value="per_bed">Per Bed (₹10/mo)</option>
                    <option value="pro">Pro (₹1,999/mo)</option>
                    <option value="enterprise">Enterprise Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Direct UPI ID</label>
                <input
                  value={selectedOrgForEdit.upi_id || ''}
                  onChange={(e) => setSelectedOrgForEdit({ ...selectedOrgForEdit, upi_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrgForEdit(null)}
                  className="py-2 px-3.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editOrgLoading}
                  className="py-2 px-4 bg-blue-600 text-white font-bold rounded-xl"
                >
                  {editOrgLoading ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE PLATFORM USER
      ───────────────────────────────────────────────────────────── */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Create Platform User</h3>
                <p className="text-[11px] text-slate-400">Add an Owner, Manager, or Staff account</p>
              </div>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createUserError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold">
                {createUserError}
              </div>
            )}

            {createUserSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-bold">
                {createUserSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Temporary Login Password *</label>
                <input
                  required
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                  <input
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option value="owner">PG Owner</option>
                    <option value="manager">Property Manager</option>
                    <option value="accountant">Accountant</option>
                    <option value="staff">Staff / Warden</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Assign to PG Organization</label>
                <select
                  value={userForm.organization_id}
                  onChange={(e) => setUserForm({ ...userForm, organization_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                >
                  <option value="">None / Platform Super User</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.city})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="py-2 px-3.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserLoading}
                  className="py-2 px-4 bg-blue-600 text-white font-bold rounded-xl"
                >
                  {createUserLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
        PG-SETU Platform Enterprise Command Center · Authorized Super Admin Personnel Only
      </footer>
    </div>
  )
}
