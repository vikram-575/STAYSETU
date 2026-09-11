'use client'

import React from 'react'
import {
  Users, Building2, BedDouble, Landmark, ShieldCheck,
  AlertCircle, TrendingUp, Sparkles, CheckCircle2,
  Clock, ShieldAlert, Store, ArrowUpRight, ArrowDownRight,
  ExternalLink, Layers, RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { AdminTabId } from './admin-sidebar'

interface DashboardTabProps {
  stats: any
  loading: boolean
  onRefresh: () => void
  onNavigateTab: (tab: AdminTabId) => void
}

export default function DashboardTab({
  stats,
  loading,
  onRefresh,
  onNavigateTab,
}: DashboardTabProps) {
  if (loading && !stats) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs font-semibold">Aggregating platform clusters & financial metrics...</p>
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Alert Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Platform Command Center</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Production
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative visibility over multi-tenant PG fleet, marketplace inventory, tenant ledgers & system health.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Critical Alert Queues Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('marketplace')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Listing Approvals</span>
            <Store className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white">
            {properties.pending_listings || 0}
            <span className="text-[10px] text-amber-400 ml-1 font-normal">pending</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('owners')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">KYC Verifications</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-black text-white">
            {activity.pending_verifications || 0}
            <span className="text-[10px] text-blue-400 ml-1 font-normal">in queue</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('safety')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Open Complaints</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black text-white">
            {activity.open_complaints || 0}
            <span className="text-[10px] text-rose-400 ml-1 font-normal">escalated</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('enquiries')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Marketplace Enquiries</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white">
            {activity.new_enquiries || 0}
            <span className="text-[10px] text-emerald-400 ml-1 font-normal">leads</span>
          </div>
        </button>
      </div>

      {/* 1. TOP KPI CARDS — Platform Users */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" /> User Ecosystem Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400">Total Users</span>
            <div className="text-2xl font-black text-white mt-1">{users.total || 0}</div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> All active roles
            </div>
          </div>
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400">PG Owners</span>
            <div className="text-2xl font-black text-blue-400 mt-1">{users.owners || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1">SaaS Subscribers</div>
          </div>
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400">Managers & Staff</span>
            <div className="text-2xl font-black text-teal-400 mt-1">{users.managers || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1">Campus Operators</div>
          </div>
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400">Tenants & Residents</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{users.tenants || 0}</div>
            <div className="text-[10px] text-slate-500 mt-1">Permanent Passbooks</div>
          </div>
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400">Platform Admins</span>
            <div className="text-2xl font-black text-purple-400 mt-1">{users.admins || 1}</div>
            <div className="text-[10px] text-slate-500 mt-1">Super Operators</div>
          </div>
        </div>
      </div>

      {/* 2. PROPERTIES & BED MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Properties Matrix */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Properties & Listings
            </h3>
            <button
              onClick={() => onNavigateTab('structure')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View Hierarchy <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Properties</span>
              <div className="text-xl font-black text-white mt-0.5">{properties.total || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Listings</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{properties.active_listings || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">PG Campuses</span>
              <div className="text-xl font-black text-slate-200 mt-0.5">{properties.pgs || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Flats / Units</span>
              <div className="text-xl font-black text-slate-200 mt-0.5">{properties.flats || 0}</div>
            </div>
          </div>
        </div>

        {/* Bed Capacity & Occupancy Matrix */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-emerald-400" /> Bed Matrix & Occupancy
            </h3>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {beds.occupancy_rate || 0}% Occupancy
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Beds</span>
              <div className="text-xl font-black text-white mt-0.5">{beds.total || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Occupied</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{beds.occupied || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vacant</span>
              <div className="text-xl font-black text-amber-400 mt-0.5">{beds.vacant || 0}</div>
            </div>
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

      {/* 3. PLATFORM MONEY CENTER (Strict Segregation Highlight) */}
      <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" /> Platform Money Center
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strict invariance: Security deposits held are segregated on ledger level and not counted towards revenue.
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
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Billed</span>
            <div className="text-lg font-black text-white mt-1">
              {formatCurrency(money.total_billed_paise || 0)}
            </div>
            <span className="text-[10px] text-slate-500">Invoiced across PGs</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Collected</span>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {formatCurrency(money.total_collected_paise || 0)}
            </div>
            <span className="text-[10px] text-emerald-500">Receipts verified</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</span>
            <div className="text-lg font-black text-amber-400 mt-1">
              {formatCurrency(money.total_outstanding_paise || 0)}
            </div>
            <span className="text-[10px] text-amber-500">Unsettled invoices</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Overdue Balance</span>
            <div className="text-lg font-black text-rose-400 mt-1">
              {formatCurrency(money.total_overdue_paise || 0)}
            </div>
            <span className="text-[10px] text-rose-500">Past due date</span>
          </div>

          {/* Segregated Security Deposits */}
          <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-800/50">
            <span className="text-[10px] font-black text-indigo-300 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Deposits Held
            </span>
            <div className="text-lg font-black text-indigo-200 mt-1">
              {formatCurrency(money.deposits_held_paise || 0)}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold">Strictly Segregated</span>
          </div>

          {/* Platform SaaS MRR */}
          <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-800/50">
            <span className="text-[10px] font-black text-emerald-300 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Platform MRR
            </span>
            <div className="text-lg font-black text-emerald-300 mt-1">
              {formatCurrency(money.platform_mrr_paise || 0)}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Subscriptions</span>
          </div>
        </div>
      </div>

      {/* 4. BUSINESS GROWTH & CITY DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Growth Velocity */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Tenant Registration Velocity
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Today</span>
              <div className="text-lg font-black text-white mt-0.5">+{growth.users_today || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">This Week</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">+{growth.users_this_week || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">This Month</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">+{growth.users_this_month || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">This Year</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">+{growth.users_this_year || 0}</div>
            </div>
          </div>
        </div>

        {/* City Density */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-400" /> Geographic Fleet Concentration
          </h3>
          <div className="space-y-2">
            {(!stats.city_distribution || stats.city_distribution.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">No geographic distribution recorded yet.</p>
            ) : (
              stats.city_distribution.slice(0, 4).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl text-xs">
                  <span className="font-bold text-slate-200">{c.city}</span>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>{c.properties} properties</span>
                    <span className="font-bold text-emerald-400">{c.beds} beds</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
