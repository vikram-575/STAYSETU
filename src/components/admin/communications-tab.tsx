'use client'

import React, { useState, useEffect } from 'react'
import {
  Radio, Send, MessageSquare, Phone, CheckCircle2,
  AlertCircle, Loader2, Bell, History, RefreshCw
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

type CommTab = 'broadcast' | 'reminders' | 'history'

interface Reminder {
  id: string
  resident_name: string
  phone: string
  amount: number
  due_date: string
  property_name?: string
}

interface MessageLog {
  id: string
  recipient_name?: string
  phone: string
  message: string
  status: 'sent' | 'failed' | 'delivered' | 'pending'
  created_at: string
}

export default function CommunicationsTab() {
  const [activeTab, setActiveTab] = useState<CommTab>('broadcast')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white tracking-tight">WhatsApp & Broadcast Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Manage tenant communications, rent reminders, and message history.</p>
        </div>
      </div>

      {/* Sub-Tab Switcher */}
      <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-xl p-1 w-fit">
        {([
          { id: 'broadcast', label: 'Broadcast', icon: Send },
          { id: 'reminders', label: 'Rent Reminders', icon: Bell },
          { id: 'history', label: 'Message History', icon: History },
        ] as { id: CommTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === id
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'broadcast' && <BroadcastSection />}
      {activeTab === 'reminders' && <RemindersSection />}
      {activeTab === 'history' && <MessageHistorySection />}
    </div>
  )
}

// ─── Broadcast Section ────────────────────────────────────────────────────────
function BroadcastSection() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    target_city: 'all',
    channel: 'in_app',
  })
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.message) return
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(data.message || 'Broadcast dispatched successfully!')
        setForm({ title: '', message: '', target_city: 'all', channel: 'in_app' })
      } else {
        setErrorMsg(data.error || 'Failed to dispatch broadcast')
      }
    } catch {
      setErrorMsg('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cities = ['all', 'Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi NCR', 'Chennai']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <form onSubmit={handleSend} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-400" /> Compose Broadcast
        </h3>

        {successMsg && (
          <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Target City</label>
            <select
              value={form.target_city}
              onChange={(e) => setForm(f => ({ ...f, target_city: e.target.value }))}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {cities.map(c => <option key={c} value={c}>{c === 'all' ? 'All Cities' : c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Channel</label>
            <select
              value={form.channel}
              onChange={(e) => setForm(f => ({ ...f, channel: e.target.value }))}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="in_app">In-App Only</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="all">All Channels</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Title</label>
          <input
            type="text"
            placeholder="e.g. Maintenance scheduled this Sunday"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400">Message</label>
          <textarea
            rows={5}
            placeholder="Write your broadcast message here..."
            value={form.message}
            onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            required
          />
          <p className="text-right text-[10px] text-slate-500">{form.message.length}/500 chars</p>
        </div>

        <button
          type="submit"
          disabled={loading || !form.title || !form.message}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Dispatching...' : 'Send Broadcast'}
        </button>
      </form>

      {/* Broadcast Guidelines */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">📋 Broadcast Guidelines</h3>
        <ul className="space-y-2 text-xs text-slate-400">
          <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> <span><strong className="text-slate-300">In-App:</strong> Delivered to dashboard notifications instantly. No gateway cost.</span></li>
          <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> <span><strong className="text-slate-300">WhatsApp:</strong> Requires WhatsApp Business API configured. Message goes to all active residents in target city.</span></li>
          <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> <span><strong className="text-slate-300">SMS:</strong> Fallback for residents without WhatsApp. Per-message cost applies.</span></li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">!</span> <span>Keep messages under 160 chars for SMS compatibility. Longer messages auto-split.</span></li>
          <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">!</span> <span>Broadcast to &quot;All Cities&quot; sends to every active resident on the platform.</span></li>
        </ul>
      </div>
    </div>
  )
}

// ─── Reminders Section ────────────────────────────────────────────────────────
function RemindersSection() {
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [error, setError] = useState('')
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/whatsapp/reminders')
      .then(r => {
        if (!r.ok) throw new Error('not_found')
        return r.json()
      })
      .then(d => {
        if (d.success) setReminders(d.reminders || [])
        else setError('Failed to load reminders')
      })
      .catch((e) => {
        if (e.message === 'not_found') setError('not_configured')
        else setError('Failed to load reminder queue.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSendNow = async (reminder: Reminder) => {
    setSending(reminder.id)
    try {
      const msg = `Reminder: Your rent of ₹${reminder.amount} is due on ${new Date(reminder.due_date).toLocaleDateString('en-IN')}. Please pay via the PG-SETU app. — PG SETU Support`
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: reminder.phone, message: msg }),
      })
      setSent(prev => new Set([...prev, reminder.id]))
    } catch {
      // silently fail — user can retry
    } finally {
      setSending(null)
    }
  }

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>

  if (error === 'not_configured') {
    return (
      <div className="p-6 bg-slate-900/60 border border-amber-500/20 rounded-2xl text-center space-y-2">
        <Bell className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-sm font-bold text-white">Reminder Queue Automated Dispatch</p>
        <p className="text-xs text-slate-400">Configure the WhatsApp webhook at <code className="text-emerald-400">/api/whatsapp/webhook</code> to enable automated rent reminders.</p>
      </div>
    )
  }

  if (error) return <div className="p-6 text-center text-sm text-rose-400">{error}</div>

  if (reminders.length === 0) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
        <p className="text-sm font-bold text-white">No Pending Reminders</p>
        <p className="text-xs text-slate-400">All rent reminders have been processed for the current billing cycle.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">{reminders.length} pending reminder{reminders.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="space-y-2">
        {reminders.map(r => (
          <div key={r.id} className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-xl gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{r.resident_name}</p>
              <p className="text-[10px] text-slate-400">{r.phone} · ₹{r.amount} due {new Date(r.due_date).toLocaleDateString('en-IN')}</p>
              {r.property_name && <p className="text-[10px] text-slate-500">{r.property_name}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sent.has(r.id) ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Sent</span>
              ) : (
                <button
                  onClick={() => handleSendNow(r)}
                  disabled={sending === r.id}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  {sending === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Message History Section ──────────────────────────────────────────────────
function MessageHistorySection() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<MessageLog[]>([])
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/whatsapp/logs?limit=50')
      .then(r => {
        if (!r.ok) throw new Error('not_found')
        return r.json()
      })
      .then(d => {
        if (d.success) setLogs(d.logs || [])
        else setError('Failed to load message history')
      })
      .catch((e) => {
        if (e.message === 'not_found') setError('not_configured')
        else setError('Failed to load message logs.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const statusColor: Record<string, string> = {
    delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    sent: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    failed: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  }

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>

  if (error === 'not_configured') {
    return (
      <div className="p-6 bg-slate-900/60 border border-amber-500/20 rounded-2xl text-center space-y-2">
        <History className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-sm font-bold text-white">Message Logs Inactive</p>
        <p className="text-xs text-slate-400">Configure the WhatsApp webhook to start recording automated transaction receipts.</p>
      </div>
    )
  }

  if (error) return <div className="p-6 text-center text-sm text-rose-400">{error}</div>

  if (logs.length === 0) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-2">
        <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-sm font-bold text-white">No Messages Dispatched</p>
        <p className="text-xs text-slate-400">Broadcast messages and rent reminders will appear in this audit log.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">{logs.length} recent messages</p>
        <button onClick={load} className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <Phone className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate">{log.recipient_name || log.phone}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor[log.status] || statusColor.pending}`}>
                  {log.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{log.message.slice(0, 60)}{log.message.length > 60 ? '...' : ''}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{formatDateTime(log.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

