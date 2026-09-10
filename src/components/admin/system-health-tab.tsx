'use client'

import React, { useState, useEffect } from 'react'
import {
  Cpu, Server, Activity, Database, ShieldCheck,
  CheckCircle2, AlertCircle, Clock, Search, Filter,
  RefreshCw, Terminal, Layers, ArrowUpRight, Loader2
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function SystemHealthTab() {
  const [subTab, setSubTab] = useState<'health' | 'audit'>('health')
  const [loading, setLoading] = useState(true)
  const [healthData, setHealthData] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Audit filters
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  const loadData = async () => {
    setLoading(true)
    try {
      const [healthRes, auditRes] = await Promise.all([
        fetch('/api/admin/system?action=health'),
        fetch(`/api/admin/system?action=audit_logs&entity_type=${entityFilter}&log_action=${actionFilter}&limit=100`),
      ])

      const healthJson = await healthRes.json()
      const auditJson = await auditRes.json()

      if (healthJson.success) setHealthData(healthJson.health)
      if (auditJson.success) setAuditLogs(auditJson.logs || [])
    } catch (err) {
      console.error('Failed to load system diagnostics', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [entityFilter, actionFilter])

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('health')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'health'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Diagnostics & Infrastructure
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Tamper-Resistant Audit Logs ({auditLogs.length})
          </button>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Refresh Health
        </button>
      </div>

      {/* 1. HEALTH DIAGNOSTICS */}
      {subTab === 'health' && (
        <div className="space-y-6">
          {/* Status summary banner */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">Platform Services Operational</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    {healthData?.environment || 'Production'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cluster uptime: {Math.floor((healthData?.uptime_seconds || 3600) / 3600)}h {Math.floor(((healthData?.uptime_seconds || 3600) % 3600) / 60)}m
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Last probe: {healthData?.timestamp ? formatDateTime(healthData.timestamp) : 'Just now'}
            </div>
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {healthData?.services?.map((svc: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs truncate max-w-[200px]">
                    {svc.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      svc.status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {svc.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">{svc.message}</p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Latency</span>
                  <span className="font-bold text-emerald-400">{svc.latency_ms} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. AUDIT LOGS TABLE */}
      {subTab === 'audit' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5"
              >
                <option value="all">All Entity Types</option>
                <option value="property_listing">Property Listings</option>
                <option value="complaint">Complaints</option>
                <option value="resident_kyc">Resident KYC</option>
                <option value="payment">Payments</option>
                <option value="rent_override">Rent Overrides</option>
              </select>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5"
              >
                <option value="all">All Actions</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="reverse">Reversals</option>
              </select>
            </div>

            <span className="text-xs text-slate-400">
              Showing <span className="text-white font-bold">{auditLogs.length}</span> audit records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">State Change Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500 text-xs">
                      No audit events recorded for selected filter.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {log.entity_type}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-emerald-400">
                        {log.entity_id ? log.entity_id.slice(0, 12) : 'N/A'}...
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.action === 'reverse' || log.action === 'delete'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 max-w-md truncate">
                        {log.after_state ? JSON.stringify(log.after_state) : 'No state payload'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
