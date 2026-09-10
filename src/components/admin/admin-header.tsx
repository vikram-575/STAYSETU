'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck, Search, LayoutDashboard, ExternalLink,
  Activity, Bell, Plus, Sparkles, Command
} from 'lucide-react'
import AdminLogoutButton from '@/components/admin/admin-logout-button'

interface AdminHeaderProps {
  onOpenSearch: () => void
  onQuickAction?: (action: string) => void
  alertCount?: number
}

export default function AdminHeader({
  onOpenSearch,
  onQuickAction,
  alertCount = 0,
}: AdminHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">PG-SETU</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Super Admin
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-emerald-400 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cluster
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Platform Operations & ERP Command Center</p>
          </div>
        </div>

        {/* Global Search Trigger (Ctrl+K) */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/80 text-xs font-medium transition group shadow-inner"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition" />
              <span>Search owners, tenants, PGs, reg #, invoices...</span>
            </span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Icon */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700"
            title="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Switch to PG Owner Dashboard */}
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>PG Dashboard</span>
          </Link>

          {/* Tenant Portal Link */}
          <Link
            href="/portal"
            target="_blank"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-750 active:scale-95 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
            <span>Resident Passbook</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Admin Logout Button */}
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  )
}
