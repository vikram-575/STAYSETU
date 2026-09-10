'use client'

import React from 'react'
import {
  LayoutDashboard, Store, MessageCircleQuestion, Network,
  Users2, Landmark, Building2, UserCog, ShieldAlert,
  Radio, Cpu, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type AdminTabId =
  | 'dashboard'
  | 'marketplace'
  | 'enquiries'
  | 'structure'
  | 'residents'
  | 'money-center'
  | 'owners'
  | 'users'
  | 'safety'
  | 'communications'
  | 'system-health'

interface NavItem {
  id: AdminTabId
  label: string
  icon: React.ElementType
  badge?: number | string
  badgeVariant?: 'emerald' | 'amber' | 'rose' | 'slate'
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface AdminSidebarProps {
  currentTab: AdminTabId
  onSelectTab: (tab: AdminTabId) => void
  badges?: {
    pendingListings?: number
    openComplaints?: number
    pendingKyc?: number
    activeEnquiries?: number
  }
}

export default function AdminSidebar({
  currentTab,
  onSelectTab,
  badges = {},
}: AdminSidebarProps) {
  const sections: NavSection[] = [
    {
      title: 'Platform Overview',
      items: [
        { id: 'dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Marketplace Control',
      items: [
        {
          id: 'marketplace',
          label: 'Listings & Moderation',
          icon: Store,
          badge: badges.pendingListings ? `${badges.pendingListings} pending` : undefined,
          badgeVariant: 'amber',
        },
        {
          id: 'enquiries',
          label: 'Enquiries & Visits',
          icon: MessageCircleQuestion,
          badge: badges.activeEnquiries ? badges.activeEnquiries : undefined,
          badgeVariant: 'slate',
        },
      ],
    },
    {
      title: 'ERP Operations',
      items: [
        { id: 'structure', label: 'Properties & Bed Matrix', icon: Network },
        { id: 'residents', label: 'Tenants & 360° Profile', icon: Users2 },
        { id: 'money-center', label: 'Money Center & Reversals', icon: Landmark },
      ],
    },
    {
      title: 'Users & CRM',
      items: [
        {
          id: 'owners',
          label: 'Owners CRM & Verification',
          icon: Building2,
          badge: badges.pendingKyc ? `${badges.pendingKyc} kyc` : undefined,
          badgeVariant: 'amber',
        },
        { id: 'users', label: 'Platform Staff & Admins', icon: UserCog },
      ],
    },
    {
      title: 'Trust & Safety',
      items: [
        {
          id: 'safety',
          label: 'Complaints & Fraud Radar',
          icon: ShieldAlert,
          badge: badges.openComplaints ? `${badges.openComplaints} open` : undefined,
          badgeVariant: 'rose',
        },
      ],
    },
    {
      title: 'Communications',
      items: [
        { id: 'communications', label: 'WhatsApp & SMS Center', icon: Radio },
      ],
    },
    {
      title: 'System & Governance',
      items: [
        { id: 'system-health', label: 'Health & Audit Logs', icon: Cpu },
      ],
    },
  ]

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <nav className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 space-y-5 shadow-xl">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
              {section.title}
            </h4>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition group text-left',
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shrink-0',
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : item.badgeVariant === 'rose'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : item.badgeVariant === 'amber'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.badgeVariant === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Operator Status Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-400">Security Invariance</span>
          <span className="text-emerald-400 font-mono">SEPARATED</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Platform income and resident security deposits are segregated on every query and mutation.
        </p>
      </div>
    </aside>
  )
}
