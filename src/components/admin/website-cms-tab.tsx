'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  LayoutTemplate,
  ShieldCheck,
  Building,
  Scale,
  Building2,
  Laptop,
  PhoneCall,
  Edit2,
  Check,
  X,
  RefreshCw,
  Download,
  Upload,
  Layers,
  HelpCircle,
  MessageSquare,
  DollarSign
} from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'
import {
  WebsiteContent,
  CityCardContent,
  ComparisonRowContent,
  FaqItemContent,
  TestimonialContent,
  ErpModuleContent,
  PricingTierContent,
} from '@/lib/website-content'

type CmsSectionId =
  | 'announcement'
  | 'hero'
  | 'trust'
  | 'cities'
  | 'comparison'
  | 'owner-cta'
  | 'software'
  | 'footer'

interface WebsiteCmsTabProps {
  initialSection?: string
}

export default function WebsiteCmsTab({ initialSection }: WebsiteCmsTabProps) {
  const {
    content,
    loading,
    isSaving,
    lastSavedAt,
    updateSection,
    saveAllContent,
    resetSection,
    refreshContent,
  } = useWebsiteContent()

  // Active section tab
  const validSections: CmsSectionId[] = [
    'announcement',
    'hero',
    'trust',
    'cities',
    'comparison',
    'owner-cta',
    'software',
    'footer',
  ]
  const defaultSec: CmsSectionId = validSections.includes(initialSection as CmsSectionId)
    ? (initialSection as CmsSectionId)
    : 'hero'
  const [activeSection, setActiveSection] = useState<CmsSectionId>(defaultSec)

  // Local draft state for active edits
  const [draftContent, setDraftContent] = useState<WebsiteContent>(content)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [softwareSubTab, setSoftwareSubTab] = useState<'hero' | 'modules' | 'pricing' | 'faqs' | 'testimonials'>('hero')

  // Keep draft in sync with loaded content
  useEffect(() => {
    setDraftContent(content)
  }, [content])

  useEffect(() => {
    if (initialSection && validSections.includes(initialSection as CmsSectionId)) {
      setActiveSection(initialSection as CmsSectionId)
    }
  }, [initialSection])

  const showToast = (msg: string) => {
    setSaveStatus(msg)
    setTimeout(() => setSaveStatus(null), 4000)
  }

  // Save current active section
  const handleSaveSection = async (sectionKey: keyof WebsiteContent) => {
    const success = await updateSection(sectionKey, draftContent[sectionKey])
    if (success) {
      showToast(`Saved & published ${sectionKey} changes live!`)
    } else {
      showToast(`Error saving ${sectionKey}. Check console.`)
    }
  }

  // Save entire website content
  const handleSaveAll = async () => {
    const success = await saveAllContent(draftContent)
    if (success) {
      showToast('All website sections successfully saved & published live!')
    } else {
      showToast('Error publishing changes. Please try again.')
    }
  }

  // Reset section
  const handleResetSection = async (sectionKey: keyof WebsiteContent) => {
    if (confirm(`Are you sure you want to reset the "${sectionKey}" section to factory defaults?`)) {
      const success = await resetSection(sectionKey)
      if (success) {
        showToast(`Reset ${sectionKey} section to default.`)
      }
    }
  }

  // Reset all
  const handleResetAll = async () => {
    if (confirm('WARNING: Reset all website content across all pages to factory defaults?')) {
      const success = await resetSection('all')
      if (success) {
        showToast('All website content reset to factory defaults.')
      }
    }
  }

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draftContent, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `pgsetu-website-content-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        setDraftContent(parsed)
        await saveAllContent(parsed)
        showToast('Successfully imported and published website content!')
      } catch (err) {
        alert('Invalid JSON file. Please provide a valid PGSetu content backup.')
      }
    }
    reader.readAsText(file)
  }

  const sectionsList: { id: CmsSectionId; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'announcement', label: 'Top Banner', icon: Megaphone, badge: draftContent.announcement?.enabled ? 'Active' : 'Off' },
    { id: 'hero', label: 'Hero & Search', icon: LayoutTemplate },
    { id: 'trust', label: 'Trust Pillars (4)', icon: ShieldCheck },
    { id: 'cities', label: 'Popular Cities', icon: Building, badge: `${draftContent.cities?.cities?.length || 0} Cities` },
    { id: 'comparison', label: 'Why Choose Us', icon: Scale },
    { id: 'owner-cta', label: 'Owner CTA Banner', icon: Building2 },
    { id: 'software', label: 'ERP Software Page', icon: Laptop, badge: 'Modules/Pricing' },
    { id: 'footer', label: 'Footer & Contacts', icon: PhoneCall },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Global Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Website Content Management (CMS)
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Website Live Editor & Page Content
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Edit every title, headline, city, trust pillar, comparison row, pricing plan, and contact detail displayed on the public marketplace and software portal.
            </p>
            {lastSavedAt && (
              <p className="text-[11px] text-slate-500">
                Last published: {new Date(lastSavedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Website</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <a
              href="/software"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 shadow-sm"
            >
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>View ERP Page</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Publish All Live'}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
              title="Export Content Backup (JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 cursor-pointer"
              title="Import Content Backup (JSON)"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={handleResetAll}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition border border-slate-700"
              title="Reset All Sections to Factory Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {saveStatus && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Section Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {sectionsList.map((sec) => {
          const Icon = sec.icon
          const isActive = activeSection === sec.id
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{sec.label}</span>
              {sec.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {sec.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ACTIVE SECTION EDITORS */}

      {/* 1. ANNOUNCEMENT BAR EDITOR */}
      {activeSection === 'announcement' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                Top Announcement & Offer Banner
              </h3>
              <p className="text-xs text-slate-400">
                A high-visibility banner displayed at the very top of the website.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetSection('announcement')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('announcement')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Banner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white">Display Banner on Website</span>
                  <p className="text-[11px] text-slate-400">Enable or disable banner visibility globally</p>
                </div>
                <input
                  type="checkbox"
                  checked={draftContent.announcement?.enabled ?? true}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      announcement: { ...draftContent.announcement, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Announcement Badge</label>
                <input
                  type="text"
                  value={draftContent.announcement?.badge || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      announcement: { ...draftContent.announcement, badge: e.target.value },
                    })
                  }
                  placeholder="e.g. EXCLUSIVE, LIMITED OFFER"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Announcement Text</label>
                <textarea
                  rows={3}
                  value={draftContent.announcement?.text || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      announcement: { ...draftContent.announcement, text: e.target.value },
                    })
                  }
                  placeholder="Offer text, promo codes, announcements..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Call to Action (CTA) Link Text</label>
                <input
                  type="text"
                  value={draftContent.announcement?.linkText || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      announcement: { ...draftContent.announcement, linkText: e.target.value },
                    })
                  }
                  placeholder="e.g. Explore PGs, Claim Offer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Destination URL / Anchor</label>
                <input
                  type="text"
                  value={draftContent.announcement?.linkUrl || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      announcement: { ...draftContent.announcement, linkUrl: e.target.value },
                    })
                  }
                  placeholder="e.g. /#featured-properties, /software"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Live Preview</span>
                <div className="bg-[#14532D] text-white px-4 py-2 rounded-lg text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="bg-[#DCFCE7] text-[#14532D] text-[10px] font-black px-1.5 py-0.5 rounded-sm">
                      {draftContent.announcement?.badge || 'NOTICE'}
                    </span>
                    <span className="truncate">{draftContent.announcement?.text}</span>
                  </div>
                  <span className="underline text-[#DCFCE7] font-bold text-[11px] shrink-0">
                    {draftContent.announcement?.linkText} →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HERO SECTION EDITOR */}
      {activeSection === 'hero' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-emerald-400" />
                Hero Section & Search Header
              </h3>
              <p className="text-xs text-slate-400">
                Primary headline, description, search badges, stat counters, and quick filter chips.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetSection('hero')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('hero')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Hero Section
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Top Badge Text</label>
                <input
                  type="text"
                  value={draftContent.hero?.badge || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      hero: { ...draftContent.hero, badge: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Main Headline (First Part)</label>
                <input
                  type="text"
                  value={draftContent.hero?.headline || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      hero: { ...draftContent.hero, headline: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Gradient Highlight Text</label>
                <input
                  type="text"
                  value={draftContent.hero?.highlightText || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      hero: { ...draftContent.hero, highlightText: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-bold placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Subtitle Description</label>
                <textarea
                  rows={3}
                  value={draftContent.hero?.subtitle || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      hero: { ...draftContent.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Stats & Quick Chips Editor */}
            <div className="space-y-6">
              {/* 4 Trust Stats */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Hero Stat Counters (4 Metrics)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(draftContent.hero?.stats || []).map((stat, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Stat #{idx + 1}</div>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => {
                          const nextStats = [...draftContent.hero.stats]
                          nextStats[idx].value = e.target.value
                          setDraftContent({
                            ...draftContent,
                            hero: { ...draftContent.hero, stats: nextStats },
                          })
                        }}
                        placeholder="Value (e.g. 15,000+)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-bold outline-hidden"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const nextStats = [...draftContent.hero.stats]
                          nextStats[idx].label = e.target.value
                          setDraftContent({
                            ...draftContent,
                            hero: { ...draftContent.hero, stats: nextStats },
                          })
                        }}
                        placeholder="Label (e.g. Verified Beds)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-hidden"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Search Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300">Quick Filter Chips</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newChip = { label: 'New Tag', filterKey: `custom_${Date.now()}` }
                      setDraftContent({
                        ...draftContent,
                        hero: {
                          ...draftContent.hero,
                          quickChips: [...(draftContent.hero?.quickChips || []), newChip],
                        },
                      })
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Chip
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {(draftContent.hero?.quickChips || []).map((chip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs"
                    >
                      <input
                        type="text"
                        value={chip.label}
                        onChange={(e) => {
                          const nextChips = [...draftContent.hero.quickChips]
                          nextChips[idx].label = e.target.value
                          setDraftContent({
                            ...draftContent,
                            hero: { ...draftContent.hero, quickChips: nextChips },
                          })
                        }}
                        className="bg-transparent text-slate-200 text-xs w-28 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextChips = draftContent.hero.quickChips.filter((_, i) => i !== idx)
                          setDraftContent({
                            ...draftContent,
                            hero: { ...draftContent.hero, quickChips: nextChips },
                          })
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRUST & VALUE PILLARS EDITOR */}
      {activeSection === 'trust' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Trust & Value Pillars (The PGSetu Standard)
              </h3>
              <p className="text-xs text-slate-400">
                4 core trust commitments displayed beneath the hero section.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetSection('trust')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('trust')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Trust Section
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Badge</label>
              <input
                type="text"
                value={draftContent.trust?.badge || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    trust: { ...draftContent.trust, badge: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Main Title</label>
              <input
                type="text"
                value={draftContent.trust?.title || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    trust: { ...draftContent.trust, title: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Subtitle</label>
              <input
                type="text"
                value={draftContent.trust?.subtitle || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    trust: { ...draftContent.trust, subtitle: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {(draftContent.trust?.cards || []).map((card, idx) => (
              <div key={card.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase">Pillar #{idx + 1}</span>
                  <input
                    type="text"
                    value={card.badge}
                    onChange={(e) => {
                      const nextCards = [...draftContent.trust.cards]
                      nextCards[idx].badge = e.target.value
                      setDraftContent({
                        ...draftContent,
                        trust: { ...draftContent.trust, cards: nextCards },
                      })
                    }}
                    placeholder="Badge (e.g. Save ₹15,000+)"
                    className="w-28 bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5 text-[10px] text-amber-300 font-bold text-right outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Title</label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(e) => {
                      const nextCards = [...draftContent.trust.cards]
                      nextCards[idx].title = e.target.value
                      setDraftContent({
                        ...draftContent,
                        trust: { ...draftContent.trust, cards: nextCards },
                      })
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={card.description}
                    onChange={(e) => {
                      const nextCards = [...draftContent.trust.cards]
                      nextCards[idx].description = e.target.value
                      setDraftContent({
                        ...draftContent,
                        trust: { ...draftContent.trust, cards: nextCards },
                      })
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-hidden"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. POPULAR CITIES GRID MANAGER */}
      {activeSection === 'cities' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                Popular Cities Grid & Rental Hubs
              </h3>
              <p className="text-xs text-slate-400">
                Manage all cities, bed counts, starting rents, localities, and photography displayed on the homepage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newCity: CityCardContent = {
                    id: `city-custom-${Date.now()}`,
                    name: 'New City',
                    state: 'State',
                    listingCount: 500,
                    startingPrice: 6000,
                    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
                    popularLocalities: ['Tech Zone', 'City Center'],
                    featured: true,
                  }
                  setDraftContent({
                    ...draftContent,
                    cities: {
                      ...draftContent.cities,
                      cities: [...(draftContent.cities?.cities || []), newCity],
                    },
                  })
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add City
              </button>
              <button
                onClick={() => handleResetSection('cities')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('cities')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Cities
              </button>
            </div>
          </div>

          {/* Section Header Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Badge</label>
              <input
                type="text"
                value={draftContent.cities?.badge || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    cities: { ...draftContent.cities, badge: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Title</label>
              <input
                type="text"
                value={draftContent.cities?.title || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    cities: { ...draftContent.cities, title: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Subtitle</label>
              <input
                type="text"
                value={draftContent.cities?.subtitle || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    cities: { ...draftContent.cities, subtitle: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
          </div>

          {/* Cities Cards List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Active Cities ({draftContent.cities?.cities?.length || 0})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(draftContent.cities?.cities || []).map((city, idx) => (
                <div key={city.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-400">#{idx + 1} {city.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextCities = draftContent.cities.cities.filter((_, i) => i !== idx)
                        setDraftContent({
                          ...draftContent,
                          cities: { ...draftContent.cities, cities: nextCities },
                        })
                      }}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Delete City"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold">City Name</label>
                      <input
                        type="text"
                        value={city.name}
                        onChange={(e) => {
                          const nextCities = [...draftContent.cities.cities]
                          nextCities[idx].name = e.target.value
                          setDraftContent({
                            ...draftContent,
                            cities: { ...draftContent.cities, cities: nextCities },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-bold outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold">State / Region</label>
                      <input
                        type="text"
                        value={city.state}
                        onChange={(e) => {
                          const nextCities = [...draftContent.cities.cities]
                          nextCities[idx].state = e.target.value
                          setDraftContent({
                            ...draftContent,
                            cities: { ...draftContent.cities, cities: nextCities },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold">Starting Rent (₹)</label>
                      <input
                        type="number"
                        value={city.startingPrice}
                        onChange={(e) => {
                          const nextCities = [...draftContent.cities.cities]
                          nextCities[idx].startingPrice = Number(e.target.value)
                          setDraftContent({
                            ...draftContent,
                            cities: { ...draftContent.cities, cities: nextCities },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold">Beds Count</label>
                      <input
                        type="number"
                        value={city.listingCount}
                        onChange={(e) => {
                          const nextCities = [...draftContent.cities.cities]
                          nextCities[idx].listingCount = Number(e.target.value)
                          setDraftContent({
                            ...draftContent,
                            cities: { ...draftContent.cities, cities: nextCities },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Image URL</label>
                    <input
                      type="text"
                      value={city.image}
                      onChange={(e) => {
                        const nextCities = [...draftContent.cities.cities]
                        nextCities[idx].image = e.target.value
                        setDraftContent({
                          ...draftContent,
                          cities: { ...draftContent.cities, cities: nextCities },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-400 font-mono outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold">Popular Localities (comma separated)</label>
                    <input
                      type="text"
                      value={(city.popularLocalities || []).join(', ')}
                      onChange={(e) => {
                        const nextCities = [...draftContent.cities.cities]
                        nextCities[idx].popularLocalities = e.target.value.split(',').map((s) => s.trim())
                        setDraftContent({
                          ...draftContent,
                          cities: { ...draftContent.cities, cities: nextCities },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. WHY CHOOSE US / COMPARISON TABLE EDITOR */}
      {activeSection === 'comparison' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Why Choose Us (Broker vs Portal vs PGSetu Comparison)
              </h3>
              <p className="text-xs text-slate-400">
                Feature rows and proof metrics showing why PGSetu eliminates brokerage and disputes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newRow: ComparisonRowContent = {
                    id: `row-custom-${Date.now()}`,
                    feature: 'New Feature',
                    traditional: 'Old way drawback',
                    pgSetu: 'PGSetu verified benefit',
                  }
                  setDraftContent({
                    ...draftContent,
                    whyChooseUs: {
                      ...draftContent.whyChooseUs,
                      rows: [...(draftContent.whyChooseUs?.rows || []), newRow],
                    },
                  })
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Comparison Row
              </button>
              <button
                onClick={() => handleResetSection('whyChooseUs')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('whyChooseUs')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Comparison
              </button>
            </div>
          </div>

          {/* Header Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Badge</label>
              <input
                type="text"
                value={draftContent.whyChooseUs?.badge || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    whyChooseUs: { ...draftContent.whyChooseUs, badge: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Title</label>
              <input
                type="text"
                value={draftContent.whyChooseUs?.title || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    whyChooseUs: { ...draftContent.whyChooseUs, title: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Section Subtitle</label>
              <input
                type="text"
                value={draftContent.whyChooseUs?.subtitle || ''}
                onChange={(e) =>
                  setDraftContent({
                    ...draftContent,
                    whyChooseUs: { ...draftContent.whyChooseUs, subtitle: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
          </div>

          {/* Comparison Rows List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Feature Comparison Rows ({draftContent.whyChooseUs?.rows?.length || 0})
            </h4>
            <div className="space-y-2">
              {(draftContent.whyChooseUs?.rows || []).map((row, idx) => (
                <div key={row.id || idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Feature Name</label>
                    <input
                      type="text"
                      value={row.feature}
                      onChange={(e) => {
                        const nextRows = [...draftContent.whyChooseUs.rows]
                        nextRows[idx].feature = e.target.value
                        setDraftContent({
                          ...draftContent,
                          whyChooseUs: { ...draftContent.whyChooseUs, rows: nextRows },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] text-rose-400 font-bold mb-0.5">Traditional Brokers</label>
                    <input
                      type="text"
                      value={row.traditional}
                      onChange={(e) => {
                        const nextRows = [...draftContent.whyChooseUs.rows]
                        nextRows[idx].traditional = e.target.value
                        setDraftContent({
                          ...draftContent,
                          whyChooseUs: { ...draftContent.whyChooseUs, rows: nextRows },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-rose-200 outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] text-emerald-400 font-bold mb-0.5">PGSetu Verified</label>
                    <input
                      type="text"
                      value={row.pgSetu}
                      onChange={(e) => {
                        const nextRows = [...draftContent.whyChooseUs.rows]
                        nextRows[idx].pgSetu = e.target.value
                        setDraftContent({
                          ...draftContent,
                          whyChooseUs: { ...draftContent.whyChooseUs, rows: nextRows },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-bold outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const nextRows = draftContent.whyChooseUs.rows.filter((_, i) => i !== idx)
                        setDraftContent({
                          ...draftContent,
                          whyChooseUs: { ...draftContent.whyChooseUs, rows: nextRows },
                        })
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Delete Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. OWNER CTA BANNER EDITOR */}
      {activeSection === 'owner-cta' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Owner Call to Action (CTA) Banner
              </h3>
              <p className="text-xs text-slate-400">
                Full-width high-conversion banner enticing PG owners to list their property or adopt PG ERP software.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetSection('ownerCta')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('ownerCta')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Owner Banner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Badge Text</label>
                <input
                  type="text"
                  value={draftContent.ownerCta?.badge || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      ownerCta: { ...draftContent.ownerCta, badge: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Headline</label>
                <input
                  type="text"
                  value={draftContent.ownerCta?.title || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      ownerCta: { ...draftContent.ownerCta, title: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Description Paragraph</label>
                <textarea
                  rows={3}
                  value={draftContent.ownerCta?.subtitle || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      ownerCta: { ...draftContent.ownerCta, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Bullet points */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Value Proposition Points (4 items)</label>
                <div className="space-y-2">
                  {(draftContent.ownerCta?.bulletPoints || []).map((bp, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={bp}
                      onChange={(e) => {
                        const nextBps = [...draftContent.ownerCta.bulletPoints]
                        nextBps[idx] = e.target.value
                        setDraftContent({
                          ...draftContent,
                          ownerCta: { ...draftContent.ownerCta, bulletPoints: nextBps },
                        })
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-emerald-300 outline-hidden"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Primary Button Text</label>
                  <input
                    type="text"
                    value={draftContent.ownerCta?.primaryBtnText || ''}
                    onChange={(e) =>
                      setDraftContent({
                        ...draftContent,
                        ownerCta: { ...draftContent.ownerCta, primaryBtnText: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Secondary Button Text</label>
                  <input
                    type="text"
                    value={draftContent.ownerCta?.secondaryBtnText || ''}
                    onChange={(e) =>
                      setDraftContent({
                        ...draftContent,
                        ownerCta: { ...draftContent.ownerCta, secondaryBtnText: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ERP SOFTWARE PAGE (/software) EDITOR */}
      {activeSection === 'software' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Laptop className="w-5 h-5 text-blue-400" />
                ERP Software Page Content (/software)
              </h3>
              <p className="text-xs text-slate-400">
                Manage hero typography, 8 ERP functional modules, pricing packages, FAQs, and customer testimonials.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetSection('softwarePage')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('softwarePage')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Software Page
              </button>
            </div>
          </div>

          {/* Software Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setSoftwareSubTab('hero')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                softwareSubTab === 'hero' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hero & CTAs
            </button>
            <button
              onClick={() => setSoftwareSubTab('modules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                softwareSubTab === 'modules' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ERP Modules ({draftContent.softwarePage?.modules?.length || 0})
            </button>
            <button
              onClick={() => setSoftwareSubTab('pricing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                softwareSubTab === 'pricing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pricing Tiers ({draftContent.softwarePage?.pricingTiers?.length || 0})
            </button>
            <button
              onClick={() => setSoftwareSubTab('faqs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                softwareSubTab === 'faqs' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              FAQs ({draftContent.softwarePage?.faqs?.length || 0})
            </button>
            <button
              onClick={() => setSoftwareSubTab('testimonials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                softwareSubTab === 'testimonials' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Testimonials ({draftContent.softwarePage?.testimonials?.length || 0})
            </button>
          </div>

          {/* Sub-tab 1: Hero & CTAs */}
          {softwareSubTab === 'hero' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Hero Badge</label>
                <input
                  type="text"
                  value={draftContent.softwarePage?.badge || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      softwarePage: { ...draftContent.softwarePage, badge: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Primary CTA Button</label>
                <input
                  type="text"
                  value={draftContent.softwarePage?.primaryCtaText || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      softwarePage: { ...draftContent.softwarePage, primaryCtaText: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Hero Main Headline</label>
                <input
                  type="text"
                  value={draftContent.softwarePage?.heroHeadline || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      softwarePage: { ...draftContent.softwarePage, heroHeadline: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold outline-hidden"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Hero Subtitle</label>
                <textarea
                  rows={3}
                  value={draftContent.softwarePage?.heroSubtitle || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      softwarePage: { ...draftContent.softwarePage, heroSubtitle: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Sub-tab 2: Modules */}
          {softwareSubTab === 'modules' && (
            <div className="space-y-4">
              {(draftContent.softwarePage?.modules || []).map((mod, idx) => (
                <div key={mod.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-400 uppercase">Module #{idx + 1}: {mod.name}</span>
                    <input
                      type="text"
                      value={mod.badge}
                      onChange={(e) => {
                        const nextMods = [...draftContent.softwarePage.modules]
                        nextMods[idx].badge = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, modules: nextMods },
                        })
                      }}
                      className="w-28 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-amber-300 font-bold text-right outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Module Name</label>
                      <input
                        type="text"
                        value={mod.name}
                        onChange={(e) => {
                          const nextMods = [...draftContent.softwarePage.modules]
                          nextMods[idx].name = e.target.value
                          setDraftContent({
                            ...draftContent,
                            softwarePage: { ...draftContent.softwarePage, modules: nextMods },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Headline</label>
                      <input
                        type="text"
                        value={mod.headline}
                        onChange={(e) => {
                          const nextMods = [...draftContent.softwarePage.modules]
                          nextMods[idx].headline = e.target.value
                          setDraftContent({
                            ...draftContent,
                            softwarePage: { ...draftContent.softwarePage, modules: nextMods },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Detailed Description</label>
                    <textarea
                      rows={2}
                      value={mod.description}
                      onChange={(e) => {
                        const nextMods = [...draftContent.softwarePage.modules]
                        nextMods[idx].description = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, modules: nextMods },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab 3: Pricing Tiers */}
          {softwareSubTab === 'pricing' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(draftContent.softwarePage?.pricingTiers || []).map((tier, idx) => (
                <div key={tier.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 uppercase">{tier.name}</span>
                    <input
                      type="text"
                      value={tier.badge || ''}
                      onChange={(e) => {
                        const nextTiers = [...draftContent.softwarePage.pricingTiers]
                        nextTiers[idx].badge = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, pricingTiers: nextTiers },
                        })
                      }}
                      placeholder="Badge"
                      className="w-24 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-amber-300 font-bold text-right outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Tagline</label>
                    <input
                      type="text"
                      value={tier.tagline}
                      onChange={(e) => {
                        const nextTiers = [...draftContent.softwarePage.pricingTiers]
                        nextTiers[idx].tagline = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, pricingTiers: nextTiers },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Monthly (₹)</label>
                      <input
                        type="number"
                        value={tier.monthlyPrice}
                        onChange={(e) => {
                          const nextTiers = [...draftContent.softwarePage.pricingTiers]
                          nextTiers[idx].monthlyPrice = Number(e.target.value)
                          setDraftContent({
                            ...draftContent,
                            softwarePage: { ...draftContent.softwarePage, pricingTiers: nextTiers },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Annual / Mo (₹)</label>
                      <input
                        type="number"
                        value={tier.annualPrice}
                        onChange={(e) => {
                          const nextTiers = [...draftContent.softwarePage.pricingTiers]
                          nextTiers[idx].annualPrice = Number(e.target.value)
                          setDraftContent({
                            ...draftContent,
                            softwarePage: { ...draftContent.softwarePage, pricingTiers: nextTiers },
                          })
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Bed Capacity</label>
                    <input
                      type="text"
                      value={tier.bedsLimit}
                      onChange={(e) => {
                        const nextTiers = [...draftContent.softwarePage.pricingTiers]
                        nextTiers[idx].bedsLimit = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, pricingTiers: nextTiers },
                        })
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab 4: FAQs */}
          {softwareSubTab === 'faqs' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const newFaq: FaqItemContent = {
                      id: `faq-custom-${Date.now()}`,
                      question: 'New Question?',
                      answer: 'Answer to the question goes here.',
                      category: 'General',
                    }
                    setDraftContent({
                      ...draftContent,
                      softwarePage: {
                        ...draftContent.softwarePage,
                        faqs: [...(draftContent.softwarePage?.faqs || []), newFaq],
                      },
                    })
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add FAQ
                </button>
              </div>
              {(draftContent.softwarePage?.faqs || []).map((faq, idx) => (
                <div key={faq.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Q#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextFaqs = draftContent.softwarePage.faqs.filter((_, i) => i !== idx)
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, faqs: nextFaqs },
                        })
                      }}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const nextFaqs = [...draftContent.softwarePage.faqs]
                      nextFaqs[idx].question = e.target.value
                      setDraftContent({
                        ...draftContent,
                        softwarePage: { ...draftContent.softwarePage, faqs: nextFaqs },
                      })
                    }}
                    placeholder="Question..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-hidden"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const nextFaqs = [...draftContent.softwarePage.faqs]
                      nextFaqs[idx].answer = e.target.value
                      setDraftContent({
                        ...draftContent,
                        softwarePage: { ...draftContent.softwarePage, faqs: nextFaqs },
                      })
                    }}
                    placeholder="Answer..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-hidden"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab 5: Testimonials */}
          {softwareSubTab === 'testimonials' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const newTestimonial: TestimonialContent = {
                      id: `test-custom-${Date.now()}`,
                      name: 'Client Name',
                      role: 'PG Owner',
                      pgName: 'Hostel Name',
                      city: 'City',
                      beds: 100,
                      quote: 'Great software for managing PG properties.',
                      rating: 5,
                      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                    }
                    setDraftContent({
                      ...draftContent,
                      softwarePage: {
                        ...draftContent.softwarePage,
                        testimonials: [...(draftContent.softwarePage?.testimonials || []), newTestimonial],
                      },
                    })
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> + Add Testimonial
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(draftContent.softwarePage?.testimonials || []).map((t, idx) => (
                  <div key={t.id || idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300">★ {t.rating} Stars</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextTests = draftContent.softwarePage.testimonials.filter((_, i) => i !== idx)
                          setDraftContent({
                            ...draftContent,
                            softwarePage: { ...draftContent.softwarePage, testimonials: nextTests },
                          })
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const nextTests = [...draftContent.softwarePage.testimonials]
                        nextTests[idx].name = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, testimonials: nextTests },
                        })
                      }}
                      placeholder="Owner Name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-bold outline-hidden"
                    />
                    <input
                      type="text"
                      value={t.pgName}
                      onChange={(e) => {
                        const nextTests = [...draftContent.softwarePage.testimonials]
                        nextTests[idx].pgName = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, testimonials: nextTests },
                        })
                      }}
                      placeholder="PG Name & City"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-400 outline-hidden"
                    />
                    <textarea
                      rows={3}
                      value={t.quote}
                      onChange={(e) => {
                        const nextTests = [...draftContent.softwarePage.testimonials]
                        nextTests[idx].quote = e.target.value
                        setDraftContent({
                          ...draftContent,
                          softwarePage: { ...draftContent.softwarePage, testimonials: nextTests },
                        })
                      }}
                      placeholder="Review quote..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. FOOTER & BRAND CONTACTS EDITOR */}
      {activeSection === 'footer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
                Footer & Global Brand Contacts
              </h3>
              <p className="text-xs text-slate-400">
                Support email, hotline, corporate address, operating hours, social links, and copyright text.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetSection('footer')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                onClick={() => handleSaveSection('footer')}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Save Footer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">About Brand Paragraph</label>
                <textarea
                  rows={3}
                  value={draftContent.footer?.aboutText || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      footer: { ...draftContent.footer, aboutText: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Trust Guarantee Statement</label>
                <input
                  type="text"
                  value={draftContent.footer?.guaranteeText || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      footer: { ...draftContent.footer, guaranteeText: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Support Hotline Phone</label>
                <input
                  type="text"
                  value={draftContent.footer?.phone || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      footer: { ...draftContent.footer, phone: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Support Email Address</label>
                <input
                  type="text"
                  value={draftContent.footer?.email || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      footer: { ...draftContent.footer, email: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Head Office Physical Address</label>
                <textarea
                  rows={2}
                  value={draftContent.footer?.address || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      footer: { ...draftContent.footer, address: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Operating Hours</label>
                <input
                  type="text"
                  value={draftContent.footer?.workingHours || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      footer: { ...draftContent.footer, workingHours: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Copyright Notice</label>
                <input
                  type="text"
                  value={draftContent.footer?.copyrightText || ''}
                  onChange={(e) =>
                    setDraftContent({
                      ...draftContent,
                      footer: { ...draftContent.footer, copyrightText: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-0.5">WhatsApp URL</label>
                  <input
                    type="text"
                    value={draftContent.footer?.socialLinks?.whatsapp || ''}
                    onChange={(e) =>
                      setDraftContent({
                        ...draftContent,
                        footer: {
                          ...draftContent.footer,
                          socialLinks: { ...draftContent.footer.socialLinks, whatsapp: e.target.value },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Twitter / X URL</label>
                  <input
                    type="text"
                    value={draftContent.footer?.socialLinks?.twitter || ''}
                    onChange={(e) =>
                      setDraftContent({
                        ...draftContent,
                        footer: {
                          ...draftContent.footer,
                          socialLinks: { ...draftContent.footer.socialLinks, twitter: e.target.value },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
