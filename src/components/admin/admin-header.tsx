'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck, Search, LayoutDashboard, ExternalLink,
  Activity, Bell, Plus, Sparkles, Command, Building2, Store
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
        <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onSelectMode('erp')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition',
              currentMode === 'erp'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
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
                    ? 'bg-emerald-700 text-white'
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
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition',
              currentMode === 'renting'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            )}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Property Renting</span>
            {rentingBadge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  currentMode === 'renting'
                    ? 'bg-amber-700 text-white'
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
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/80 text-xs font-medium transition group shadow-inner"
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

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Icon */}
          <button
            onClick={onOpenSearch}
            className="xl:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700"
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
