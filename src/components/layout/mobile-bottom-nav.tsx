'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BedDouble, UserCircle2,
  Plus, X, UserPlus, CreditCard, Zap, Receipt, Sparkles,
  DollarSign, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Residents', href: '/dashboard/residents', icon: Users, exact: false },
    { label: 'Action', href: '#', icon: Plus, isAction: true },
    { label: 'Rooms', href: '/dashboard/rooms', icon: BedDouble, exact: false },
    { label: 'Profile', href: '/dashboard/settings', icon: UserCircle2, exact: false },
  ]

  const isActive = (item: typeof navItems[0]) => {
    if (item.isAction) return false
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const quickActions = [
    {
      label: 'Check In Resident',
      desc: 'Assign room & bed',
      href: '/dashboard/residents/new',
      icon: UserPlus,
      color: 'bg-blue-600 text-white',
    },
    {
      label: 'Record Payment',
      desc: 'Collect UPI/Cash',
      href: '/dashboard/payments/new',
      icon: CreditCard,
      color: 'bg-emerald-600 text-white',
    },
    {
      label: 'Add Room & Beds',
      desc: 'Expand PG capacity',
      href: '/dashboard/rooms/new',
      icon: BedDouble,
      color: 'bg-indigo-600 text-white',
    },
    {
      label: 'Add Extra Charge',
      desc: 'Food, laundry & guest',
      href: '/dashboard/billing/add-charge',
      icon: Receipt,
      color: 'bg-amber-600 text-white',
    },
    {
      label: 'Electricity Reading',
      desc: 'Log meter & split bill',
      href: '/dashboard/electricity/reading',
      icon: Zap,
      color: 'bg-purple-600 text-white',
    },
    {
      label: 'Log PG Expense',
      desc: 'Salaries, repairs, food',
      href: '/dashboard/expenses/new',
      icon: DollarSign,
      color: 'bg-rose-600 text-white',
    },
  ]

  return (
    <>
      {/* Quick Action Popup Modal / Bottom Sheet */}
      {quickMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setQuickMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer content */}
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-100 space-y-4 animate-in slide-in-from-bottom duration-200 safe-bottom">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
                  <p className="text-[11px] text-slate-500">Fast PG operational shortcuts</p>
                </div>
              </div>
              <button
                onClick={() => setQuickMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 6 Grid Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {quickActions.map((act) => (
                <Link
                  key={act.href}
                  href={act.href}
                  onClick={() => setQuickMenuOpen(false)}
                  className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 active:scale-95 transition flex flex-col gap-2 shadow-2xs"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-xs', act.color)}>
                    <act.icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">{act.label}</span>
                    <span className="text-[10.5px] text-slate-500 mt-0.5 block">{act.desc}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setQuickMenuOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl active:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg safe-bottom">
        <div className="flex items-center justify-around h-15 px-2">
          {navItems.map((item) => {
            const active = isActive(item)

            if (item.isAction) {
              return (
                <button
                  key="quick-fab"
                  onClick={() => setQuickMenuOpen(true)}
                  className="flex flex-col items-center justify-center -mt-5 group active:scale-90 transition-transform"
                  aria-label="Quick Action"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-white">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 mt-0.5">Quick</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-1 transition-colors active:scale-95',
                  active ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <div className="relative">
                  <item.icon className={cn('w-5 h-5 transition-transform', active && 'scale-110 stroke-[2.5] text-blue-600')} />
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </div>
                <span className={cn('text-[10px] mt-1 tracking-tight', active ? 'font-bold text-blue-600' : 'font-medium')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
