'use client'

import React, { useState } from 'react'
import {
  Radio, Send, MessageSquare, Phone, CheckCircle2,
  Clock, AlertCircle, Loader2, Sparkles, Bell
} from 'lucide-react'

export default function CommunicationsTab() {
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    target_city: 'all',
    channel: 'in_app',
  })
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastForm.title || !broadcastForm.message) return
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(data.message)
        setBroadcastForm({ title: '', message: '', target_city: 'all', channel: 'in_app' })
      } else {
        setErrorMsg(data.error || 'Failed to dispatch broadcast')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error dispatching broadcast')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            Communication Hub & Omnichannel Broadcast Center
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast emergency alerts, maintenance advisories, and transactional updates across WhatsApp, SMS and In-App notifications.
          </p>
        </div>
      </div>

      {/* Gateway Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400">WhatsApp Business API</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active
            </span>
          </div>
          <div className="text-lg font-black text-white">99.4% Delivery</div>
          <p className="text-[11px] text-slate-500">Rent slips, OTPs & check-in welcome notices</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400">SMS Transactional Route</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active
            </span>
          </div>
          <div className="text-lg font-black text-white">98.9% Delivery</div>
          <p className="text-[11px] text-slate-500">DLT registered templates for payment confirmations</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400">In-App Push & Alerts</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active
            </span>
          </div>
          <div className="text-lg font-black text-white">Real-Time WebSocket</div>
          <p className="text-[11px] text-slate-500">Tenant passbook & owner dashboard banners</p>
        </div>
      </div>

      {/* Broadcast Composer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Dispatch Platform-Wide Announcement
          </h4>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                placeholder="e.g. Platform Scheduled Maintenance · Sunday 2 AM"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Target Region / Audience
              </label>
              <select
                value={broadcastForm.target_city}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, target_city: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="all">All Cities & All PGs</option>
                <option value="Bengaluru">Bengaluru Hub Only</option>
                <option value="Gurugram">Gurugram Hub Only</option>
                <option value="Hyderabad">Hyderabad Hub Only</option>
                <option value="Pune">Pune Hub Only</option>
                <option value="Delhi">Delhi NCR Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Broadcast Message Content
            </label>
            <textarea
              rows={4}
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              placeholder="Enter announcement details, policy changes or instructions for operators..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !broadcastForm.title || !broadcastForm.message}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
