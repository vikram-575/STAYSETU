'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Edit3, ExternalLink, Settings, Sparkles, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react'

interface SectionEditButtonProps {
  section: string
  label?: string
  className?: string
}

export function SectionEditButton({ section, label = 'Edit Section', className = '' }: SectionEditButtonProps) {
  return (
    <Link
      href={`/admin?tab=website-cms&section=${section}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border border-amber-300/40 z-30 group ${className}`}
      title={`Edit this section in Super Admin CMS (${section})`}
    >
      <Edit3 className="w-3 h-3 group-hover:rotate-12 transition-transform" />
      <span>{label}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
    </Link>
  )
}

export function FloatingWebsiteAdminBar() {
  const [expanded, setExpanded] = useState(false)

  const quickLinks = [
    { section: 'announcement', label: 'Announcement Bar' },
    { section: 'hero', label: 'Hero & Search Header' },
    { section: 'trust', label: 'Trust & Value Pillars' },
    { section: 'cities', label: 'Popular Cities Grid' },
    { section: 'comparison', label: 'Why Choose Us Table' },
    { section: 'owner-cta', label: 'Owner CTA Banner' },
    { section: 'software', label: 'ERP Software Page' },
    { section: 'footer', label: 'Footer & Contacts' },
  ]

  return (
    <aside aria-label="Website CMS Admin Quick-Edit Bar" className="fixed bottom-5 right-5 z-50">
      <div className="bg-slate-950/95 border border-amber-500/40 text-white rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-slate-900 gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Website Live Editor
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/admin?tab=website-cms"
              className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1"
            >
              <span>Admin CMS</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
              title={expanded ? 'Minimize Quick Editor' : 'Expand Quick Edit Menu'}
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Quick Section Menu */}
        {expanded && (
          <div className="p-3 border-t border-slate-800 space-y-2 max-w-xs">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-1">
              Jump to Section Editor
            </p>
            <div className="grid grid-cols-1 gap-1">
              {quickLinks.map((item) => (
                <Link
                  key={item.section}
                  href={`/admin?tab=website-cms&section=${item.section}`}
                  target="_blank"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 transition group"
                >
                  <span>{item.label}</span>
                  <Edit3 className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Changes sync in real-time</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
