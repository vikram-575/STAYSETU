'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Bell, Plus, Menu, X, LogOut,
  LayoutDashboard, Users, BedDouble, FileText, CreditCard,
  Zap, ArrowLeftRight, TrendingUp, DollarSign, MessageSquare,
  FileBarChart, Settings, Building2, Sparkles, ChevronDown, ShieldCheck, Compass
} from 'lucide-react'
import { User as UserType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import GlobalSearch from '@/components/shared/global-search'
import QuickActions from '@/components/shared/quick-actions'

interface Props {
  user: UserType & { organizations?: { name: string } }
}

export default function AppHeader({ user }: Props) {
  const [showSearch, setShowSearch] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const pathname = usePathname()

  const orgName = user.organizations?.name ?? 'PG Management'

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
    } catch {}
    router.push('/login')
    router.refresh()
  }

  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Residents CRM', href: '/dashboard/residents', icon: Users },
    { label: 'Rooms & Beds', href: '/dashboard/rooms', icon: BedDouble },
    { label: 'Billing & Invoices', href: '/dashboard/billing', icon: FileText },
    { label: 'Payment Register', href: '/dashboard/payments', icon: CreditCard },
    { label: 'Daily Cash Closing', href: '/dashboard/payments/daily-closing', icon: ArrowLeftRight },
    { label: 'Resident Ledger', href: '/dashboard/ledger', icon: FileText },
    { label: 'Electricity Sub-Meters', href: '/dashboard/electricity', icon: Zap },
    { label: 'Expenses Tracking', href: '/dashboard/expenses', icon: TrendingUp },
    { label: 'Money Center', href: '/dashboard/money', icon: DollarSign },
    { label: 'What-If Analytics', href: '/dashboard/analytics', icon: TrendingUp },
    { label: 'WhatsApp Automation', href: '/dashboard/communications', icon: MessageSquare },
    { label: 'Reports Engine', href: '/dashboard/reports', icon: FileBarChart },
    { label: 'System Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isRouteActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="h-14 sm:h-16 bg-white border-b border-gray-200/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-2xs safe-top">
        
        {/* Left: Mobile Menu & Clean Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-1 text-[#647067] hover:text-[#17211B] hover:bg-gray-100/80 rounded-xl active:scale-95 transition"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Clean Executive Logo & Org Brand on Mobile */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white flex items-center justify-center font-black text-xs shadow-xs ring-2 ring-[#DCFCE7] shrink-0">
              <Building2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-xs sm:text-sm text-[#14532D] tracking-tight">PG-SETU</span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 bg-[#DCFCE7] text-[#14532D] text-[9px] font-extrabold rounded border border-[#16A34A]/30 uppercase">
                  ERP
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-[#647067] truncate max-w-[110px] sm:max-w-[180px] mt-0.5" title={orgName}>
                {orgName}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Global Search Bar */}
        <div className="flex-1 max-w-sm lg:max-w-md mx-2 hidden sm:block">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 bg-[#F7FAF7] hover:bg-gray-100/80 border border-gray-200/90 hover:border-[#16A34A]/50 rounded-xl text-xs text-[#647067] transition-all text-left shadow-2xs group"
          >
            <Search className="w-4 h-4 text-gray-400 group-hover:text-[#16A34A] transition-colors shrink-0 stroke-[2.2]" />
            <span className="truncate text-gray-400 group-hover:text-[#17211B] font-medium">Search residents, rooms, invoices...</span>
            <kbd className="ml-auto text-[10px] font-mono text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-2xs">⌘K</kbd>
          </button>
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Public Marketplace Link Button */}
          <Link
            href="/"
            target="_blank"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-[#F7FAF7] text-xs font-bold text-[#14532D] hover:border-[#16A34A] transition"
            title="Open Public Rental Marketplace"
          >
            <Compass className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Marketplace</span>
          </Link>

          {/* Mobile Search Button */}
          <button
            onClick={() => setShowSearch(true)}
            className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl active:scale-95 transition"
            aria-label="Search"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Super Admin Command Center Link */}
          {user.role === 'superadmin' && (
            <Link
              href="/superadmin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#14532D] to-[#166534] text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95"
              title="Open Super Admin Command Center"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Super Admin</span>
            </Link>
          )}

          {/* Quick Action Button (Desktop) */}
          <button
            onClick={() => setShowQuickActions(true)}
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#14532D] to-[#16A34A] hover:opacity-95 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Quick Action</span>
          </button>

          {/* Notifications Bell */}
          <Link
            href="/dashboard/communications"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition relative active:scale-95"
            title="Notifications & WhatsApp"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#16A34A] rounded-full ring-2 ring-white animate-pulse" />
          </Link>

          {/* User Profile Pill */}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-gray-200 hover:opacity-85 transition active:scale-95"
            title="Profile & Settings"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white font-black text-xs flex items-center justify-center shadow-xs">
              {user.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-[#17211B] leading-tight truncate max-w-[120px]">{user.full_name}</p>
              <p className="text-[10px] text-[#647067] capitalize leading-tight">{user.role}</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Sidebar */}
          <div className="relative bg-white w-4/5 max-w-xs h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-[#14532D] to-[#166534] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight truncate max-w-[160px]">{orgName}</h3>
                  <p className="text-[10.5px] text-[#DCFCE7]">PG-SETU Property ERP</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Workspace Navigation
              </div>
              {allNavItems.map((item) => {
                const active = isRouteActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition',
                      active
                        ? 'bg-[#DCFCE7]/80 text-[#14532D] font-bold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className={cn('w-4 h-4', active ? 'text-[#16A34A] stroke-[2.2]' : 'text-gray-400')} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* User & Sign Out Footer */}
            <div className="p-3 border-t border-gray-100 bg-[#F7FAF7] safe-bottom">
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <p className="text-xs font-bold text-[#17211B]">{user.full_name}</p>
                  <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#14532D] text-[10px] font-bold rounded-md capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
      {showQuickActions && <QuickActions onClose={() => setShowQuickActions(false)} />}
    </>
  )
}
