'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Search, X, User, Building2, Landmark, Layers,
  ChevronRight, ArrowRight, Loader2, Command
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { AdminTabId } from './admin-sidebar'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigateTab: (tab: AdminTabId, extraData?: any) => void
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onNavigateTab,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    residents: any[]
    owners: any[]
    properties: any[]
    payments: any[]
  }>({
    residents: [],
    owners: [],
    properties: [],
    payments: [],
  })

  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults({ residents: [], owners: [], properties: [], payments: [] })
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ residents: [], owners: [], properties: [], payments: [] })
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/system?action=search&q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        if (data.success) {
          setResults(data.results || { residents: [], owners: [], properties: [], payments: [] })
        }
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const totalResults =
    results.residents.length +
    results.owners.length +
    results.properties.length +
    results.payments.length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by tenant name, PG-2026 registration #, owner, PG name, payment #..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {query.trim().length >= 2 && totalResults === 0 && !loading && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching records found for <span className="text-slate-300">"{query}"</span>
            </div>
          )}

          {/* Tenants / Residents */}
          {results.residents.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                <User className="w-3 h-3 text-emerald-400" />
                Tenants & Residents ({results.residents.length})
              </h5>
              <div className="space-y-1">
                {results.residents.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onNavigateTab('residents', { search: r.registration_number || r.full_name })
                      onClose()
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition group border border-slate-800 hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                          {r.full_name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-900 text-emerald-400 border border-emerald-500/20">
                          {r.registration_number || `PG-2026-${r.id.slice(0, 6).toUpperCase()}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {r.phone} · {r.organizations?.name || 'Assigned PG'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Owners & Organizations */}
          {results.owners.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-blue-400" />
                PG Owners & Organizations ({results.owners.length})
              </h5>
              <div className="space-y-1">
                {results.owners.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      onNavigateTab('owners', { search: o.name })
                      onClose()
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition group border border-slate-800 hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300">
                          {o.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 rounded text-slate-400 border border-slate-700">
                          {o.city || 'India'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{o.phone || o.email || 'Verified Owner'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Properties */}
          {results.properties.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-amber-400" />
                Properties & Campuses ({results.properties.length})
              </h5>
              <div className="space-y-1">
                {results.properties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigateTab('structure', { search: p.name })
                      onClose()
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition group border border-slate-800 hover:border-slate-700"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300">
                        {p.name}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {p.address ? `${p.address}, ` : ''}{p.city} · {p.organizations?.name || 'Owner'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {results.payments.length > 0 && (
            <div className="space-y-1.5">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                <Landmark className="w-3 h-3 text-purple-400" />
                Payments & Transactions ({results.payments.length})
              </h5>
              <div className="space-y-1">
                {results.payments.map((pmt) => (
                  <button
                    key={pmt.id}
                    onClick={() => {
                      onNavigateTab('money-center', { search: pmt.payment_number || pmt.transaction_id })
                      onClose()
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-left transition group border border-slate-800 hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-purple-300">
                          {pmt.payment_number || 'Payment'}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatCurrency(pmt.amount_paise || 0)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {pmt.residents?.full_name || 'Resident'} · {pmt.payment_method?.toUpperCase()} · {pmt.transaction_id || 'Cash/Manual'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">Enter</span> to select
            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">Esc</span> to close
          </div>
          <span className="font-semibold text-emerald-400">PG-SETU Omnisearch</span>
        </div>
      </div>
    </div>
  )
}
