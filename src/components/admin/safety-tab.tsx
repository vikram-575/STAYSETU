'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  XCircle, Clock, FileText, Search, User, Building2,
  ExternalLink, Loader2, ArrowUpRight, MessageSquare
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function SafetyTab() {
  const [subTab, setSubTab] = useState<'complaints' | 'documents' | 'fraud'>('complaints')
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<any[]>([])
  const [documentsQueue, setDocumentsQueue] = useState<any[]>([])
  const [fraudWatchlist, setFraudWatchlist] = useState<any[]>([])
  const [counts, setCounts] = useState<any>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Complaint Modal
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null)
  const [resolutionStatus, setResolutionStatus] = useState('resolved')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Document Modal
  const [rejectDocModal, setRejectDocModal] = useState<any>(null)
  const [docRejectReason, setDocRejectReason] = useState('')

  const loadSafetyData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/safety?status=${statusFilter}&priority=${priorityFilter}&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) {
        setComplaints(data.complaints || [])
        setDocumentsQueue(data.documentsQueue || [])
        setFraudWatchlist(data.fraudWatchlist || [])
        setCounts(data.counts || null)
      }
    } catch (err) {
      console.error('Failed to load safety data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSafetyData()
  }, [statusFilter, priorityFilter])

  // Update complaint
  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_complaint',
          complaint_id: selectedComplaint.id,
          status: resolutionStatus,
          resolution_notes: resolutionNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedComplaint(null)
        setResolutionNotes('')
        loadSafetyData()
      } else {
        alert(data.error || 'Failed to update complaint')
      }
    } catch (err) {
      console.error('Complaint update error', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Moderate document
  const handleModerateDocument = async (residentId: string, kycStatus: string, reason?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderate_document',
          resident_id: residentId,
          kyc_status: kycStatus,
          rejection_reason: reason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setRejectDocModal(null)
        setDocRejectReason('')
        loadSafetyData()
      } else {
        alert(data.error || 'Failed to moderate document')
      }
    } catch (err) {
      console.error('Document moderation error', err)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Subnav & Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('complaints')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'complaints'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Complaints ({counts?.openComplaints || 0} open)
          </button>

          <button
            onClick={() => setSubTab('documents')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'documents'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Document Vault ({counts?.pendingDocuments || 0} pending)
          </button>

          <button
            onClick={() => setSubTab('fraud')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'fraud'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            Fraud & Risk Radar ({counts?.flaggedRisks || 0} flagged)
          </button>
        </div>

        {subTab === 'complaints' && (
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>
        )}
      </div>

      {/* 1. COMPLAINTS TAB */}
      {subTab === 'complaints' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Complaint / Issue</th>
                  <th className="px-4 py-3">Tenant & Reg #</th>
                  <th className="px-4 py-3">PG Campus</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reported</th>
                  <th className="px-4 py-3 text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                      No complaints in queue.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100">{c.title}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{c.resident_name}</div>
                        <span className="font-mono text-[10px] text-emerald-400">{c.registration_number}</span>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-300">
                        {c.org_name} ({c.org_city})
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : c.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : c.status === 'in_progress'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {formatDate(c.created_at)}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedComplaint(c)
                            setResolutionStatus(c.status)
                            setResolutionNotes(c.resolution_notes || '')
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                        >
                          Triage & Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DOCUMENT VERIFICATION VAULT */}
      {subTab === 'documents' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tenant & Reg #</th>
                  <th className="px-4 py-3">PG Facility</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Document Mask</th>
                  <th className="px-4 py-3">KYC Status</th>
                  <th className="px-4 py-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documentsQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                      No documents waiting in queue.
                    </td>
                  </tr>
                ) : (
                  documentsQueue.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100">{doc.resident_name}</div>
                        <span className="font-mono text-[10px] text-emerald-400">{doc.registration_number}</span>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-slate-300">
                        {doc.org_name}
                      </td>

                      <td className="px-4 py-3.5 text-slate-200 font-medium">
                        {doc.document_type}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {doc.document_number}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            doc.status === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {doc.document_url && (
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border border-slate-700"
                          >
                            <ExternalLink className="w-3 h-3" /> View ID
                          </a>
                        )}

                        {doc.status !== 'verified' && (
                          <button
                            onClick={() => handleModerateDocument(doc.resident_id, 'verified')}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                          >
                            Approve
                          </button>
                        )}

                        {doc.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectDocModal(doc)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 text-rose-400 rounded-lg text-xs font-semibold border border-slate-700 transition"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. FRAUD & RISK RADAR */}
      {subTab === 'fraud' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Autonomous Risk Detection & Flagged Entities
            </h4>
          </div>

          <div className="space-y-3">
            {fraudWatchlist.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No high-risk entities detected. Platform safety indicators are nominal.
              </div>
            ) : (
              fraudWatchlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-800/50 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{item.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Risk Score: {item.risk_score}/100 ({item.risk_level})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {item.city} · {item.phone || 'No phone verified'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.reasons.map((r: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
                          ⚠ {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => alert(`Detailed risk telemetry for ${item.name} logged.`)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                    >
                      Audit Trail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Complaint Triage Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white">
              Triage Complaint: {selectedComplaint.title}
            </h3>
            <p className="text-xs text-slate-300 italic bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
              "{selectedComplaint.description}"
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Status Update</label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected / Invalid</option>
                <option value="open">Re-open</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Resolution Notes</label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail action taken (e.g. Electrician dispatched, maintenance fee refunded)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateComplaint}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
              >
                Save Triage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {rejectDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white">
              Reject ID Document: {rejectDocModal.resident_name}
            </h3>
            <p className="text-xs text-slate-400">
              Provide a clear reason for rejecting this document so the tenant can re-upload:
            </p>
            <textarea
              rows={3}
              value={docRejectReason}
              onChange={(e) => setDocRejectReason(e.target.value)}
              placeholder="e.g. Blurry scan, expired government ID, name mismatch..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectDocModal(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModerateDocument(rejectDocModal.resident_id, 'rejected', docRejectReason)}
                disabled={actionLoading || !docRejectReason.trim()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
