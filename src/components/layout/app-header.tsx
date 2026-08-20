'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Bell, Plus, Menu, X, LogOut,
  LayoutDashboard, Users, BedDouble, FileText, CreditCard,
  Zap, ArrowLeftRight, TrendingUp, DollarSign, MessageSquare,
  FileBarChart, Settings, Building2
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 md:px-6 shrink-0 safe-top">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-1.5 -ml-1 text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand on Mobile Header */}
        <div className="flex md:hidden items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            PG
          </div>
          <span className="font-bold text-sm text-gray-900 truncate max-w-[120px]">
            {user.organizations?.name ?? 'PG-SETU'}
          </span>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs md:text-sm text-gray-500 transition-colors flex-1 max-w-xs text-left"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="truncate">Search residents, rooms...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Actions (Desktop) */}
          <button
            onClick={() => setShowQuickActions(true)}
            className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Action</span>
          </button>

          {/* Notifications */}
          <Link
            href="/dashboard/communications"
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          </Link>

          {/* User Menu / Profile Link */}
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 pl-2 border-l border-gray-200 hover:opacity-80 transition active:scale-95"
            title="Profile & Settings"
          >
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shadow-xs">
              {user.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-gray-900 leading-tight">{user.full_name}</p>
              <p className="text-[10px] text-gray-500 capitalize leading-tight">{user.role}</p>
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">{user.organizations?.name ?? 'PG-SETU'}</h3>
                  <p className="text-[10px] text-blue-100">PG Management Mobile</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 active:bg-blue-50 active:text-blue-700 transition"
                >
                  <item.icon className="w-4 h-4 text-gray-500" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* User & Sign Out Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50 safe-bottom">
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <p className="text-xs font-bold text-gray-900">{user.full_name}</p>
                  <p className="text-[10px] text-gray-500">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
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
