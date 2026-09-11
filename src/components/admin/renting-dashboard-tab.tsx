'use client'

import React from 'react'
import {
  Store, Sparkles, MessageCircleQuestion, Calendar,
  ShieldAlert, ShieldCheck, TrendingUp, CheckCircle2,
  Clock, ArrowUpRight, RefreshCw, MapPin, Eye, Filter
} from 'lucide-react'
import { AdminTabId } from './admin-sidebar'

interface RentingDashboardTabProps {
  stats: any
  loading: boolean
  onRefresh: () => void
  onNavigateTab: (tab: AdminTabId) => void
}

export default function RentingDashboardTab({
  stats,
  loading,
  onRefresh,
  onNavigateTab,
}: RentingDashboardTabProps) {
  if (loading && !stats) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs font-semibold">Aggregating marketplace inventory, tenant leads & visits...</p>
      </div>
    )
  }

  const kpis = stats || {}
  const properties = kpis.properties || {}
  const activity = kpis.activity || {}

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Property Renting & Marketplace Control</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Marketplace Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative moderation over public property listings, featured placement slots, prospective tenant leads & visits pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Refresh Listings
          </button>
        </div>
      </div>

      {/* Critical Renting Activity Queues */}
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
            <span className="text-[10px] text-amber-400 ml-1 font-normal">awaiting review</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('enquiries')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Tenant Enquiries</span>
            <MessageCircleQuestion className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-white">
            {activity.new_enquiries || 0}
            <span className="text-[10px] text-emerald-400 ml-1 font-normal">fresh leads</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('visits')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Scheduled Visits</span>
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-black text-white">
            {activity.scheduled_visits || 0}
            <span className="text-[10px] text-blue-400 ml-1 font-normal">appointments</span>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('safety')}
          className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 rounded-xl text-left transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold">Flagged Listings</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black text-white">
            {properties.suspended_listings || 0}
            <span className="text-[10px] text-rose-400 ml-1 font-normal">under investigation</span>
          </div>
        </button>
      </div>

      {/* 1. MARKETPLACE LISTINGS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" /> Rental Inventory Telemetry
            </h3>
            <button
              onClick={() => onNavigateTab('marketplace')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Moderation Queue <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory</span>
              <div className="text-xl font-black text-white mt-0.5">{properties.total || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Marketplace</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{properties.active_listings || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Review</span>
              <div className="text-xl font-black text-amber-400 mt-0.5">{properties.pending_listings || 0}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Suspended</span>
              <div className="text-xl font-black text-rose-400 mt-0.5">{properties.suspended_listings || 0}</div>
            </div>
          </div>
        </div>

        {/* Featured Promotion Slots */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Featured Placement Slots
            </h3>
            <button
              onClick={() => onNavigateTab('promotions')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Manage Slots <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Featured Properties</span>
              <div className="text-2xl font-black text-amber-300 mt-1">{stats.featured_slots_active || 0} Slots Active</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Top rank in city search</p>
            </div>
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hero Carousel</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{stats.featured_slots_active ? 'Active' : 'Open'}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">High-visibility placement</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GEOGRAPHIC DISTRIBUTION */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" /> City Listing Supply & Demand
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(!stats.city_distribution || stats.city_distribution.length === 0) ? (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs">
              No city distribution recorded yet.
            </div>
          ) : (
            stats.city_distribution.map((c: any, idx: number) => (
              <div key={idx} className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 text-sm">{c.city}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>{c.properties} Listings</span>
                  <span className="font-mono text-emerald-400 font-bold">{c.beds} Available Beds</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
