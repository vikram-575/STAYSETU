'use client'

import React, { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate, formatDateTime, buildWhatsAppLink, buildSmsLink } from '@/lib/utils'
import {
  MessageSquare, MessageCircle, Phone, Send,
  CheckCircle2, Clock, AlertTriangle, FileText, Sparkles, Users, Search, X
} from 'lucide-react'

interface CommunicationsClientViewProps {
  initialOverdueResidents: any[]
  initialTemplates: any[]
  initialLogs: any[]
  orgName: string
  initialTab?: string
}

export function CommunicationsClientView({
  initialOverdueResidents = [],
  initialTemplates = [],
  initialLogs = [],
  orgName = 'PG Management',
  initialTab = 'send',
}: CommunicationsClientViewProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState('')

  // Instant tab change without server roundtrip
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tabKey)
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Filter overdue residents
  const filteredResidents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return initialOverdueResidents
    return initialOverdueResidents.filter((r) =>
      r.full_name?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.registration_number?.toLowerCase().includes(q) ||
      String(r.room_number || '').toLowerCase().includes(q)
    )
  }, [initialOverdueResidents, searchQuery])

  // Filter logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return initialLogs
    return initialLogs.filter((l) =>
      l.residents?.full_name?.toLowerCase().includes(q) ||
      l.recipient_phone?.toLowerCase().includes(q) ||
      l.channel?.toLowerCase().includes(q) ||
      l.status?.toLowerCase().includes(q)
    )
  }, [initialLogs, searchQuery])

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Communication &amp; WhatsApp Automation</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Send reminders, payment receipts &amp; notices directly from your device via WhatsApp &amp; SMS.
          </p>
        </div>
      </div>

      {/* Tabs with Instant 0ms Switching */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl text-xs font-bold w-max shadow-2xs border border-gray-200/60">
            <button
              type="button"
              onClick={() => handleTabChange('send')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer',
                activeTab === 'send' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <span>Send Overdue Reminders</span>
              <span className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                initialOverdueResidents.length > 0 ? 'bg-red-100 text-red-700 font-bold' : 'bg-gray-200 text-gray-600'
              )}>
                {initialOverdueResidents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('templates')}
              className={cn(
                'px-3.5 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer',
                activeTab === 'templates' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Message Templates
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('history')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer',
                activeTab === 'history' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <span>Dispatch Logs</span>
              {initialLogs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gray-200 text-gray-600">
                  {initialLogs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Instant Search Bar */}
        {activeTab !== 'templates' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'send' ? 'Search resident, room...' : 'Search logs, phone...'}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/10 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Send Reminders Tab */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 sm:pb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Overdue Balances WhatsApp Dispatcher</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Clicking WhatsApp opens a pre-composed reminder with resident details directly in your WhatsApp app.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                {filteredResidents.length} Residents with Pending Dues
              </span>
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {filteredResidents && filteredResidents.length > 0 ? (
              filteredResidents.map((r) => {
                const message = `Hello ${r.full_name}, your PG outstanding balance is ${formatCurrency(r.total_outstanding_paise)} (Room: ${r.room_number || '—'}). View your bills, receipts & pay online at: https://pgsetu.com/portal (Login with Phone: ${r.phone} and DOB). - ${orgName}`
                const waLink = buildWhatsAppLink(r.phone, message)
                const smsLink = buildSmsLink(r.phone, message)

                return (
                  <div
                    key={r.resident_id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-sm text-gray-900">{r.full_name}</span>
                        <span className="font-mono text-gray-500 text-[11px]">({r.registration_number})</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                          Room {r.room_number || '—'} · Bed {r.bed_label || '—'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-[11px]">Mobile: {r.phone}</p>
                      <div className="p-2 bg-white border border-gray-200/80 rounded-xl text-gray-700 italic text-[11px] max-w-xl">
                        &ldquo;{message}&rdquo;
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200/60 shrink-0">
                      <div className="text-left md:text-right mr-2">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Balance Due</span>
                        <span className="text-base font-black text-red-600">{formatCurrency(r.total_outstanding_paise)}</span>
                      </div>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none px-3.5 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                      <a
                        href={smsLink}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <Phone className="w-4 h-4" /> SMS
                      </a>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                {searchQuery ? `No residents matching "${searchQuery}"` : '🎉 No residents have overdue balances today.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message Templates Tab */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Customizable Communication Templates</h2>
          <p className="text-xs text-gray-500">
            Variables available:{' '}
            <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">
              {'{{resident_name}}'}, {'{{registration_no}}'}, {'{{room_no}}'}, {'{{amount_due}}'}, {'{{pg_name}}'}
            </code>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            {initialTemplates && initialTemplates.length > 0 ? (
              initialTemplates.map((tpl) => (
                <div key={tpl.id} className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{tpl.name}</span>
                    <span className="uppercase text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                      {tpl.channel}
                    </span>
                  </div>
                  <p className="text-gray-700 bg-white p-3 border rounded-xl font-mono text-[11px] leading-relaxed">
                    {tpl.body_template}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-gray-400 text-xs">
                Standard templates pre-configured.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatch History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Recent Dispatch Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Resident</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Recipient Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">{formatDateTime(log.created_at)}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900">{log.residents?.full_name || 'Resident'}</td>
                      <td className="py-2.5 px-3 uppercase font-bold text-green-700">{log.channel}</td>
                      <td className="py-2.5 px-3 text-gray-700 font-mono">{log.recipient_phone}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-800">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      {searchQuery ? `No logs matching "${searchQuery}"` : 'No dispatch logs recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
