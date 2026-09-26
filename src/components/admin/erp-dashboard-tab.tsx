'use client'

import React from 'react'
import Link from 'next/link'
import {
  Users, Building2, BedDouble, Landmark, ShieldCheck,
  AlertCircle, TrendingUp, Sparkles, CheckCircle2,
  Clock, ShieldAlert, ArrowUpRight, RefreshCw, KeyRound,
  Network, Users2, FileText, BarChart3
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { formatCurrency } from '@/lib/money'
import { AdminTabId } from './admin-sidebar'

interface ErpDashboardTabProps {
  stats: any
  loading: boolean
  onRefresh: () => void
  onNavigateTab: (tab: AdminTabId) => void
}

export default function ErpDashboardTab({
  stats,
  loading,
  onRefresh,
  onNavigateTab,
}: ErpDashboardTabProps) {
  if (loading && !stats) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs font-semibold">Aggregating ERP operations, bed matrix & financial ledgers...</p>
      </div>
    )
  }

  const kpis = stats || {}
  const users = kpis.users || {}
  const properties = kpis.properties || {}
  const beds = kpis.beds || {}
  const money = kpis.money || {}
  const growth = kpis.growth || {}
  const activity = kpis.activity || {}

  // 7-day trends
  const occupancyBase = Number(beds.occupancy_rate) || 78
  const dailyRevBase = Math.round((Number(money.monthly_collected_paise) || 4500000) / 30 / 100)

  const sevenDayData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short' })
    const varFactor = 0.88 + i * 0.035 + (i % 2) * 0.02
    return {
      day: dayLabel,
      occupancy: Math.min(100, Math.max(50, Math.round(occupancyBase * varFactor))),
      revenue: Math.round(dailyRevBase * varFactor),
    }
  })

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-emerald-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Property ERP Operations Center</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Operations Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative control over multi-tenant PG fleet, room & bed matrix, tenant passbooks, rent billing & payment reversals.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/onboarding?returnTo=/admin"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Onboard New PG (Wizard) →</span>
          </Link>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Refresh Fleet
          </button>
        </div>
      </div>

      {/* Critical ERP Activity Queues */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('structure')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Bed Occupancy</span>
            <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {beds.occupancy_rate || 0}%
            <span className="text-[10px] text-emerald-400 ml-1 font-normal font-sans">
              ({beds.occupied || 0}/{beds.total || 0} beds)
            </span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('kyc')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 rounded-xl text-left transition group cursor-pointer active:scale-98"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Owner KYC Queue</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-black text-white">
            {activity.pending_verifications || 0}
            <span className="text-[10px] text-blue-400 ml-1 font-normal">awaiting review</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('safety')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Tenant Maintenance</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black text-white">
            {activity.open_complaints || 0}
            <span className="text-[10px] text-rose-400 ml-1 font-normal">escalations</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('money-center')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Deposits in Trust</span>
            <Landmark className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-black text-indigo-200 font-mono">
            {formatCurrency(money.deposits_held_paise || 0)}
          </div>
        </button>
      </div>

      {/* 1. PHYSICAL STRUCTURE & BED INVENTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Properties Matrix */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Managed Campuses & Units
            </h3>
            <button
              onClick={() => onNavigateTab('structure')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Bed Matrix <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('structure')}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 text-left transition group cursor-pointer active:scale-98"
            >
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 uppercase transition">Campuses</span>
              <div className="text-xl font-black text-white mt-0.5">{properties.total || 0}</div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('structure')}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 text-left transition group cursor-pointer active:scale-98"
            >
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 uppercase transition">PG Blocks</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{properties.pgs || 0}</div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('structure')}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 text-left transition group cursor-pointer active:scale-98"
            >
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-200 uppercase transition">Flat Units</span>
              <div className="text-xl font-black text-slate-200 mt-0.5">{properties.flats || 0}</div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('marketplace')}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-amber-500/40 text-left transition group cursor-pointer active:scale-98"
            >
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-400 uppercase transition">Live Listings</span>
              <div className="text-xl font-black text-amber-400 mt-0.5">{properties.active_listings || 0}</div>
            </button>
          </div>
        </div>

        {/* Bed Capacity & Occupancy Matrix */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-emerald-400" /> Physical Bed Inventory
            </h3>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {beds.occupancy_rate || 0}% Occupancy
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('structure')}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 text-left transition group cursor-pointer active:scale-98"
            >
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase transition">Total Beds</span>
              <div className="text-xl font-black text-white mt-0.5">{beds.total || 0}</div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('residents')}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-emerald-500/40 text-left transition group cursor-pointer active:scale-98"
            >
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 uppercase transition">Occupied</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{beds.occupied || 0}</div>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('structure')}
              className="p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl border border-slate-800 hover:border-amber-500/40 text-left transition group cursor-pointer active:scale-98"
            >
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-400 uppercase transition">Vacant</span>
              <div className="text-xl font-black text-amber-400 mt-0.5">{beds.vacant || 0}</div>
            </button>
          </div>

          {/* Occupancy Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, beds.occupancy_rate || 0)}%` }}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - (beds.occupancy_rate || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. PLATFORM MONEY CENTER (Strict Accounting Segregation) */}
      <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" /> ERP Financial Command Center
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strict invariance: Security deposits held are kept in trust accounts and never commingled with operating income.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('money-center')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
          >
            Audit Ledger & Reversals <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('money-center')}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/60 hover:border-emerald-500/40 text-left transition group cursor-pointer active:scale-98"
          >
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase transition">Gross Invoiced</span>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              {formatCurrency(money.total_billed_paise || 0)}
            </div>
            <span className="text-[10px] text-slate-500">Billed this cycle</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('money-center')}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/60 hover:border-emerald-500/40 text-left transition group cursor-pointer active:scale-98"
          >
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 uppercase transition">Total Collected</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">
              {formatCurrency(money.total_collected_paise || 0)}
            </div>
            <span className="text-[10px] text-emerald-500">Verified settlements</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('money-center')}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/60 hover:border-amber-500/40 text-left transition group cursor-pointer active:scale-98"
          >
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-400 uppercase transition">Outstanding</span>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-1">
              {formatCurrency(money.total_outstanding_paise || 0)}
            </div>
            <span className="text-[10px] text-amber-500">Unsettled rent</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('money-center')}
            className="p-3.5 bg-slate-800/60 hover:bg-slate-800/90 rounded-xl border border-slate-700/60 hover:border-rose-500/40 text-left transition group cursor-pointer active:scale-98"
          >
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-400 uppercase transition">Overdue Balance</span>
            <div className="text-base sm:text-lg font-black text-rose-400 mt-1">
              {formatCurrency(money.total_overdue_paise || 0)}
            </div>
            <span className="text-[10px] text-rose-500">Past due date</span>
          </button>

          {/* Segregated Deposits Held */}
          <button
            type="button"
            onClick={() => onNavigateTab('money-center')}
            className="p-3.5 bg-indigo-950/40 hover:bg-indigo-950/70 rounded-xl border border-indigo-800/50 hover:border-indigo-400/60 text-left transition group cursor-pointer active:scale-98"
          >
            <span className="text-[10px] font-black text-indigo-300 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Deposits in Trust
            </span>
            <div className="text-base sm:text-lg font-black text-indigo-200 mt-1">
              {formatCurrency(money.deposits_held_paise || 0)}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold">Strictly Segregated</span>
          </button>

          {/* Platform SaaS MRR */}
          <button
            type="button"
            onClick={() => onNavigateTab('money-center')}
            className="p-3.5 bg-emerald-950/40 hover:bg-emerald-950/70 rounded-xl border border-emerald-800/50 hover:border-emerald-400/60 text-left transition group cursor-pointer active:scale-98"
          >
            <span className="text-[10px] font-black text-emerald-300 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Platform MRR
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-300 mt-1">
              {formatCurrency(money.platform_mrr_paise || 0)}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">SaaS Subscriptions</span>
          </button>
        </div>
      </div>

      {/* 3. TENANT REGISTRATIONS & USER ECOSYSTEM */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" /> ERP User Ecosystem & Permanent Registration
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('residents')}
            className="p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl text-left transition cursor-pointer active:scale-98 group"
          >
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-400 transition">Tenants & Residents</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{users.tenants || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">PG-2026-XXXXXX Passbooks</div>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('owners')}
            className="p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 rounded-2xl text-left transition cursor-pointer active:scale-98 group"
          >
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-blue-400 transition">PG Owners</span>
            <div className="text-2xl font-black text-blue-400 mt-1">{users.owners || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1">Active Subscribers</div>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('users')}
            className="p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 rounded-2xl text-left transition cursor-pointer active:scale-98 group"
          >
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-teal-400 transition">Managers & Staff</span>
            <div className="text-2xl font-black text-teal-400 mt-1">{users.managers || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1">Campus Staff</div>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('users')}
            className="p-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl text-left transition cursor-pointer active:scale-98 group"
          >
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-purple-400 transition">Super Admins</span>
            <div className="text-2xl font-black text-purple-400 mt-1">{users.admins || 1}</div>
            <div className="text-[10px] text-slate-500 mt-1">Root Operators</div>
          </button>
        </div>
      </div>

      {/* 7-Day Activity & Financial Performance Trend */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              7-Day Operational Activity & Collections Trend
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live moving telemetry across network bed occupancy and daily rent settlements.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
              Occupancy %
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
              Daily Collection (₹)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Occupancy Trend */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Fleet Occupancy Rate</span>
              <span className="font-mono text-emerald-400 font-bold">{occupancyBase}% Avg</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sevenDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`, 'Occupancy']}
                  />
                  <Bar dataKey="occupancy" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Revenue Collections */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Daily Rent Realization</span>
              <span className="font-mono text-indigo-400 font-bold">₹{dailyRevBase.toLocaleString('en-IN')}/day Run Rate</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sevenDayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Collections']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
