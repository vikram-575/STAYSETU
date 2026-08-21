'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Users, CreditCard, DollarSign, PlusCircle,
  TrendingUp, ShieldCheck, CheckCircle2, AlertCircle,
  Loader2, Sparkles, Database, Layers, ArrowUpRight,
  ExternalLink, Search, RefreshCw, X, Check, Edit2, KeyRound
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'pgs' | 'subscriptions' | 'transactions' | 'users' | 'tools'>('pgs')
  const [loading, setLoading] = useState(true)

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
    plan: 'starter',
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

      setOnboardSuccess(`Successfully onboarded "${onboardForm.org_name}" with ${data.organization.rooms_created} rooms and ${data.organization.beds_created} beds!`)
      
      // Reload lists
      loadData()
      setTimeout(() => {
        setShowOnboardModal(false)
        setOnboardSuccess('')
        setOnboardForm({
          org_name: '',
          owner_name: '',
          owner_email: '',
          owner_phone: '',
          property_name: '',
          city: 'Pune',
          address: '',
          gst_enabled: false,
          gstin: '',
          plan: 'starter',
          num_buildings: 1,
          floors_per_building: 3,
          rooms_per_floor: 4,
          beds_per_room: 2,
          base_rent_rupees: 6500,
        })
      }, 1500)
    } catch (err: any) {
      setOnboardError(err.message)
    } finally {
      setOnboardLoading(false)
    }
  }

  // Handle Plan Update
  const handleUpdatePlan = async (plan: string, status: string) => {
    if (!selectedOrgForPlan) return
    setPlanLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: selectedOrgForPlan.id || selectedOrgForPlan.org_id,
          plan,
          subscription_status: status,
          valid_until_months: 12,
        }),
      })
      if (res.ok) {
        setSelectedOrgForPlan(null)
        loadData()
      }
    } finally {
      setPlanLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
        <span className="text-sm font-bold">Loading Company Platform Command Center...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-800/40 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Company-Level Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
            Monitor client PGs, onboard new properties, manage SaaS billing & track company-wide GTV.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowOnboardModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-600/30 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> 1-Click Onboard New PG
        </button>
      </div>

      {/* 6 Platform KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Onboarded PGs</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats?.total_organizations || 0}</p>
          <p className="text-[10px] text-blue-400 font-bold mt-0.5">{stats?.total_properties || 0} properties</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Bed Capacity</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats?.total_beds || 0}</p>
          <p className="text-[10px] text-green-400 font-bold mt-0.5">{stats?.occupied_beds || 0} occupied ({stats?.occupancy_rate_pct || 0}%)</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Active Residents</p>
          <p className="text-xl sm:text-2xl font-black text-indigo-300 mt-1">{stats?.total_active_residents || 0}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Across all client PGs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Platform GTV Volume</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
            {formatCurrency(stats?.platform_gtv_paise || 0)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Total billing volume</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Rent Collected</p>
          <p className="text-xl sm:text-2xl font-black text-teal-400 mt-1">
            {formatCurrency(stats?.platform_collected_paise || 0)}
          </p>
          <p className="text-[10px] text-teal-500 font-medium mt-0.5">Processed by PGs</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 truncate">Company SaaS MRR</p>
          <p className="text-xl sm:text-2xl font-black text-purple-300 mt-1">
            {formatCurrency(stats?.platform_saas_mrr_paise || 0)}
          </p>
          <p className="text-[10px] text-purple-400 font-bold mt-0.5">Monthly subscription</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-max">
          <button
            type="button"
            onClick={() => setActiveTab('pgs')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95',
              activeTab === 'pgs' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            )}
          >
            PG Organizations ({organizations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95',
              activeTab === 'subscriptions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            )}
          >
            SaaS Billing & Plans
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95',
              activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            )}
          >
            Global Transaction Stream ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95',
              activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            )}
          >
            Platform Users ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap active:scale-95',
              activeTab === 'tools' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            )}
          >
            Data Purge & Tools
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* TAB 1: PG ORGANIZATIONS LIST */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'pgs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-white">All Client PG Organizations</h2>
            <button
              type="button"
              onClick={loadData}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-white">{org.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{org.city || 'Location unset'} · slug: {org.slug}</p>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider',
                      org.plan === 'enterprise'
                        ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                        : org.plan === 'growth'
                        ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    )}
                  >
                    {org.plan}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Capacity</span>
                    <strong className="text-white font-black">{org.total_beds} beds</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Occupancy</span>
                    <strong className="text-green-400 font-black">{org.occupancy_rate}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Residents</span>
                    <strong className="text-blue-400 font-black">{org.active_residents_count}</strong>
                  </div>
                </div>

                {/* Owner info & revenue */}
                <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span>Owner Contact:</span>
                    <span className="text-white font-semibold">{org.owner?.name || org.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rent Collected:</span>
                    <span className="text-green-400 font-bold">{formatCurrency(org.total_collected_paise)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedOrgForPlan(org)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Manage Plan
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition text-center"
                  >
                    Access Dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 2: SAAS BILLING & PLANS */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {subscriptionsData?.plan_tiers?.map((tier: any) => (
              <div
                key={tier.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white">{tier.name}</h3>
                  <span className="text-sm font-black text-purple-400">{formatCurrency(tier.price_paise)}/mo</span>
                </div>
                <p className="text-xs text-slate-400">{tier.features[0]}</p>
                <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  {tier.features.map((f: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-black text-white">Client Subscription Roster</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                  <tr>
                    <th className="p-3">PG Organization</th>
                    <th className="p-3">Plan Tier</th>
                    <th className="p-3">Monthly Fee</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Valid Until</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {subscriptionsData?.subscriptions?.map((sub: any) => (
                    <tr key={sub.org_id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{sub.org_name}</td>
                      <td className="p-3 uppercase font-bold text-purple-400">{sub.plan}</td>
                      <td className="p-3 font-bold text-white">{formatCurrency(sub.monthly_fee_paise)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-950 text-green-400 border border-green-800">
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{formatDate(sub.valid_until)}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrgForPlan(sub)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
                        >
                          Modify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 3: GLOBAL TRANSACTIONS STREAM */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Platform-Wide Rent Collection Stream</h3>
              <p className="text-xs text-slate-400">Live aggregate feed of all rent transactions processed across all client PGs</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
            >
              Refresh Feed
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="p-3">Receipt / Payment ID</th>
                  <th className="p-3">PG Organization</th>
                  <th className="p-3">Resident</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Reference #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">No rent transactions recorded yet across the platform.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-blue-400">{tx.payment_number || 'RECEIPT'}</td>
                      <td className="p-3 font-bold text-white">{tx.organizations?.name || '—'}</td>
                      <td className="p-3 font-semibold text-slate-200">
                        {tx.residents?.full_name || 'Resident'}
                      </td>
                      <td className="p-3 font-black text-green-400">+{formatCurrency(tx.amount_paise)}</td>
                      <td className="p-3 uppercase font-bold text-[10px] text-slate-300">{tx.payment_method}</td>
                      <td className="p-3 text-slate-400">{formatDate(tx.payment_date)}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{tx.transaction_id || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 4: PLATFORM USERS */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-black text-white">All Platform Users & Roles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Mobile Phone</th>
                  <th className="p-3">PG Organization</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{u.full_name}</td>
                    <td className="p-3 text-slate-300">{u.email}</td>
                    <td className="p-3 text-slate-400">{u.phone || '—'}</td>
                    <td className="p-3 font-semibold text-blue-400">{u.organizations?.name || 'Platform'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-950 text-blue-400 border border-blue-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', u.is_active ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400')}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{formatDateTime(u.last_login_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* TAB 5: DATA PURGE & TOOLS */}
      {/* ----------------------------------------------------------- */}
      {activeTab === 'tools' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-red-400">Platform Data Reset & Production Purge</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an organization to wipe mock transactions and prepare for real tenant onboarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm">{org.name}</h4>
                  <span className="text-xs text-slate-400">{org.total_beds} Beds · {org.active_residents_count} Residents</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Purge all test transactions and residents for "${org.name}"?`)) return
                      const res = await fetch('/api/admin/purge-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ organization_id: org.id, wipe_all: false }),
                      })
                      const data = await res.json()
                      alert(data.message || data.error)
                      loadData()
                    }}
                    className="flex-1 py-2 bg-red-950 hover:bg-red-900 text-red-300 text-xs font-bold rounded-lg border border-red-800 transition"
                  >
                    Wipe Test Transactions
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`WARNING: Completely wipe all rooms, beds, and data for "${org.name}"?`)) return
                      const res = await fetch('/api/admin/purge-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ organization_id: org.id, wipe_all: true }),
                      })
                      const data = await res.json()
                      alert(data.message || data.error)
                      loadData()
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition"
                  >
                    Reset to Blank
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 1: 1-CLICK ONBOARD NEW PG */}
      {/* ----------------------------------------------------------- */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setShowOnboardModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">1-Click Fast Provisioning</span>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5">Onboard New PG Business</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically provisions Organization, Property, Buildings, Floors, Rooms, Beds & Owner Account in one click.
              </p>
            </div>

            {onboardError && (
              <div className="p-3.5 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 font-medium">
                {onboardError}
              </div>
            )}
            {onboardSuccess && (
              <div className="p-3.5 bg-green-950/80 border border-green-800 rounded-xl text-xs text-green-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                {onboardSuccess}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">PG Business / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Luxury PG"
                    value={onboardForm.org_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, org_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Property Campus Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Residency Block"
                    value={onboardForm.property_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, property_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Sharma"
                    value={onboardForm.owner_name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Owner Email</label>
                  <input
                    type="email"
                    placeholder="owner@pgname.com"
                    value={onboardForm.owner_email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Owner Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={onboardForm.owner_phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, owner_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Building & Bed Auto-Generator */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                <span className="text-xs font-black text-blue-400 block uppercase tracking-wider">
                  🏗️ Automated Room & Bed Capacity Generator
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Floors</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={onboardForm.floors_per_building}
                      onChange={(e) => setOnboardForm({ ...onboardForm, floors_per_building: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Rooms / Floor</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={onboardForm.rooms_per_floor}
                      onChange={(e) => setOnboardForm({ ...onboardForm, rooms_per_floor: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Beds / Room</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={onboardForm.beds_per_room}
                      onChange={(e) => setOnboardForm({ ...onboardForm, beds_per_room: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Default Rent (₹)</label>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={onboardForm.base_rent_rupees}
                      onChange={(e) => setOnboardForm({ ...onboardForm, base_rent_rupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-1">
                  Will instantly create <strong className="text-white">{onboardForm.floors_per_building * onboardForm.rooms_per_floor} rooms</strong> and <strong className="text-blue-400">{onboardForm.floors_per_building * onboardForm.rooms_per_floor * onboardForm.beds_per_room} beds</strong> with sub-meters.
                </p>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">SaaS Subscription Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'starter', name: 'Starter (₹999/mo)' },
                    { id: 'growth', name: 'Growth (₹2,499/mo)' },
                    { id: 'enterprise', name: 'Enterprise (₹4,999/mo)' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setOnboardForm({ ...onboardForm, plan: p.id })}
                      className={cn(
                        'p-2.5 rounded-xl border text-center text-xs font-bold transition active:scale-95',
                        onboardForm.plan === p.id
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 disabled:bg-blue-900 text-white rounded-xl text-xs font-black transition shadow-lg shadow-blue-600/30"
                >
                  {onboardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {onboardLoading ? 'Provisioning PG System...' : 'Launch & Provision PG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 2: MODIFY SUBSCRIPTION PLAN */}
      {/* ----------------------------------------------------------- */}
      {selectedOrgForPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedOrgForPlan(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-white">Modify SaaS Plan for {selectedOrgForPlan.name || selectedOrgForPlan.org_name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Change subscription tier or update billing status</p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={planLoading}
                onClick={() => handleUpdatePlan('starter', 'active')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex justify-between items-center transition"
              >
                <div>
                  <strong className="text-white text-xs block">Starter Plan</strong>
                  <span className="text-[10px] text-slate-400">Up to 25 Beds · ₹999/month</span>
                </div>
                <span className="text-xs font-black text-blue-400">₹999/mo</span>
              </button>

              <button
                type="button"
                disabled={planLoading}
                onClick={() => handleUpdatePlan('growth', 'active')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex justify-between items-center transition"
              >
                <div>
                  <strong className="text-white text-xs block">Growth Plan</strong>
                  <span className="text-[10px] text-slate-400">Up to 100 Beds · ₹2,499/month</span>
                </div>
                <span className="text-xs font-black text-purple-400">₹2,499/mo</span>
              </button>

              <button
                type="button"
                disabled={planLoading}
                onClick={() => handleUpdatePlan('enterprise', 'active')}
                className="w-full p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left flex justify-between items-center transition"
              >
                <div>
                  <strong className="text-white text-xs block">Enterprise Plan</strong>
                  <span className="text-[10px] text-slate-400">Unlimited Beds · ₹4,999/month</span>
                </div>
                <span className="text-xs font-black text-emerald-400">₹4,999/mo</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrgForPlan(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
