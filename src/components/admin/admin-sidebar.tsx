'use client'

import React from 'react'
import {
  LayoutDashboard, Store, MessageCircleQuestion, Network,
  Users2, Landmark, Building2, UserCog, ShieldAlert,
  Radio, Cpu, ChevronRight, Sparkles, Calendar, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminMode } from './admin-header'

export type AdminTabId =
  | 'dashboard'
  | 'marketplace'
  | 'enquiries'
  | 'visits'
  | 'promotions'
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
  currentMode: AdminMode
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
  currentMode,
  currentTab,
  onSelectTab,
  badges = {},
}: AdminSidebarProps) {
  const erpSections: NavSection[] = [
    {
      title: 'ERP Operations',
      items: [
        { id: 'dashboard', label: 'ERP Dashboard', icon: LayoutDashboard },
        { id: 'structure', label: 'Property & Bed Matrix', icon: Network },
        { id: 'residents', label: 'Tenants & Passbooks', icon: Users2 },
        { id: 'money-center', label: 'Money Center & Reversals', icon: Landmark },
      ],
    },
    {
      title: 'Partners & Staff',
      items: [
        {
          id: 'owners',
          label: 'Owners CRM & KYC',
          icon: Building2,
          badge: badges.pendingKyc ? `${badges.pendingKyc} kyc` : undefined,
          badgeVariant: 'amber',
        },
        { id: 'users', label: 'Staff & Role Privileges', icon: UserCog },
      ],
    },
    {
      title: 'Support & Escalations',
      items: [
        {
          id: 'safety',
          label: 'Complaints & Maintenance',
          icon: ShieldAlert,
          badge: badges.openComplaints ? `${badges.openComplaints} open` : undefined,
          badgeVariant: 'rose',
        },
      ],
    },
    {
      title: 'Messaging & Broadcast',
      items: [
        { id: 'communications', label: 'WhatsApp & SMS Alerts', icon: Radio },
      ],
    },
    {
      title: 'Infrastructure & Governance',
      items: [
        { id: 'system-health', label: 'System Health & Audit Logs', icon: Cpu },
      ],
    },
  ]

  const rentingSections: NavSection[] = [
    {
      title: 'Marketplace Demand',
      items: [
        { id: 'dashboard', label: 'Marketplace Dashboard', icon: LayoutDashboard },
        {
          id: 'marketplace',
          label: 'Listings Moderation',
          icon: Store,
          badge: badges.pendingListings ? `${badges.pendingListings} pending` : undefined,
          badgeVariant: 'amber',
        },
        {
          id: 'enquiries',
          label: 'Leads & Enquiries Funnel',
          icon: MessageCircleQuestion,
          badge: badges.activeEnquiries ? badges.activeEnquiries : undefined,
          badgeVariant: 'slate',
        },
        { id: 'visits', label: 'Scheduled Visits', icon: Calendar },
      ],
    },
    {
      title: 'Promotions & Featured Slots',
      items: [
        { id: 'promotions', label: 'Featured Listings & Ranks', icon: Sparkles },
      ],
    },
    {
      title: 'Trust & Fraud Radar',
      items: [
        { id: 'safety', label: 'Listing Fraud & Reports', icon: ShieldAlert },
      ],
    },
    {
      title: 'Governance',
      items: [
        { id: 'system-health', label: 'Audit Logs & API Health', icon: Cpu },
      ],
    },
  ]

  const sections = currentMode === 'erp' ? erpSections : rentingSections

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <nav className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 space-y-5 shadow-xl">
        {/* Mode Label Banner */}
        <div className="px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400 uppercase font-bold">Active Control Center</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full font-bold uppercase',
              currentMode === 'erp'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            )}
          >
            {currentMode === 'erp' ? 'Property ERP' : 'Renting Marketplace'}
          </span>
        </div>

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
                        ? currentMode === 'erp'
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                          : 'bg-amber-600 text-white font-bold shadow-md shadow-amber-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition',
                          isActive
                            ? 'text-white'
                            : currentMode === 'erp'
                            ? 'text-slate-400 group-hover:text-emerald-400'
                            : 'text-slate-400 group-hover:text-amber-400'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight shrink-0',
                          isActive
                            ? currentMode === 'erp'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-amber-700 text-white'
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

      {/* Cross-Link Invariance Pill */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-400">Single Source of Truth</span>
          <span className="text-emerald-400 font-mono">CONNECTED</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {currentMode === 'erp'
            ? 'Bed occupancy and rents updated here instantly sync with the public rental marketplace.'
            : 'Listings approved here immediately become available in the ERP inventory matrix.'}
        </p>
      </div>
    </aside>
  )
}
