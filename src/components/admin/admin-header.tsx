'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck, Search, LayoutDashboard, ExternalLink,
  Activity, Bell, Plus, Sparkles, Command, Building2, Store, Globe, Zap
} from 'lucide-react'
import AdminLogoutButton from '@/components/admin/admin-logout-button'
import { cn } from '@/lib/utils'

export type AdminMode = 'erp' | 'renting'

interface AdminHeaderProps {
  currentMode: AdminMode
  onSelectMode: (mode: AdminMode) => void
  onOpenSearch: () => void
  onQuickAction?: (action: string) => void
  erpBadge?: number | string
  rentingBadge?: number | string
}

export default function AdminHeader({
  currentMode,
  onSelectMode,
  onOpenSearch,
  onQuickAction,
  erpBadge,
  rentingBadge,
}: AdminHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Mode Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">PG-SETU</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {currentMode === 'erp' ? 'Property ERP Operations' : 'Rental Marketplace & Discovery'}
            </p>
          </div>
        </div>

        {/* DUAL-MODE CONTROL CENTER SWITCHER */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => onSelectMode('erp')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition',
              currentMode === 'erp'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Property ERP</span>
            {erpBadge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  currentMode === 'erp'
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                )}
              >
                {erpBadge}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectMode('renting')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition',
              currentMode === 'renting'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            )}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Rental Marketplace</span>
            {rentingBadge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  currentMode === 'renting'
                    ? 'bg-amber-500/30 text-amber-200'
                    : 'bg-slate-800 text-amber-400 border border-amber-500/20'
                )}
              >
                {rentingBadge}
              </span>
            )}
          </button>
        </div>

        {/* Global Search Trigger (Ctrl+K) */}
        <div className="flex-1 max-w-xs hidden xl:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/60 text-xs font-medium transition group shadow-inner"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition" />
              <span className="truncate">Search tenants, PGs, reg #...</span>
            </span>
            <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Action Controls - Clean & Streamlined */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Icon */}
          <button
            onClick={onOpenSearch}
            className="xl:hidden p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80"
            title="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick Links Group (Clean Icon Buttons with Tooltips) */}
          <div className="hidden sm:flex items-center bg-slate-950/60 p-0.5 rounded-xl border border-slate-800/80">
            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded-lg transition"
              title="Open PG Owner ERP Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>

            <Link
              href="/portal"
              target="_blank"
              className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-800/60 rounded-lg transition"
              title="Open Resident Passbook Portal"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Single Primary Action: + Onboard PG */}
          <Link
            href="/onboarding?returnTo=/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Onboard PG</span>
          </Link>

          <div className="h-5 w-px bg-slate-800" />

          {/* Admin Logout Button */}
          <AdminLogoutButton />
        </div>
      </div>
    </header>
  )
}
