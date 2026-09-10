'use client'

import React, { useState, useEffect } from 'react'
import {
  Landmark, DollarSign, ShieldCheck, AlertCircle,
  RotateCcw, Search, Filter, ArrowUpRight, CheckCircle2,
  XCircle, Clock, Loader2, FileText, AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate, formatDateTime } from '@/lib/utils'

interface MoneyCenterTabProps {
  initialSearch?: string
}

export default function MoneyCenterTab({ initialSearch = '' }: MoneyCenterTabProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('all')

  // Reversal Modal
  const [reversalPayment, setReversalPayment] = useState<any>(null)
  const [reversalReason, setReversalReason] = useState('')
  const [reversalLoading, setReversalLoading] = useState(false)

  const loadFinanceData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/finance?section=money_center')
      const json = await res.json()
      if (json.success) {
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load finance data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinanceData()
  }, [])

  // Execute non-destructive payment reversal
  const handleReversePayment = async () => {
    if (!reversalPayment || !reversalReason.trim()) return
    setReversalLoading(true)
    try {
      const res = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reverse_payment',
          payment_id: reversalPayment.id,
          reason: reversalReason,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setReversalPayment(null)
        setReversalReason('')
        loadFinanceData()
      } else {
        alert(result.error || 'Failed to reverse payment')
      }
    } catch (err) {
      console.error('Reversal error', err)
    } finally {
      setReversalLoading(false)
    }
  }

  const payments = data?.payments || []
  const summary = data?.summary || {}

  const filteredPayments = payments.filter((p: any) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'reversed' && !p.is_reversed) return false
      if (statusFilter === 'completed' && p.is_reversed) return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.payment_number?.toLowerCase().includes(q) ||
      p.transaction_id?.toLowerCase().includes(q) ||
      p.resident_name?.toLowerCase().includes(q) ||
      p.org_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Platform Money Header & Strict Invariance Notice */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              Platform Money Center & Non-Destructive Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict Segregation: Security deposits held are kept in trust accounts and never commingled with operating revenue.
            </p>
          </div>
          <div className="px-3 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] font-bold text-emerald-300">
            Immutable Audit Trail Active
          </div>
        </div>

        {/* 6 Financial Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Billed</span>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              {formatCurrency(summary.total_billed_paise || 0)}
            </div>
            <span className="text-[10px] text-slate-500">Gross receivables</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Collected</span>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">
              {formatCurrency(summary.total_collected_paise || 0)}
            </div>
            <span className="text-[10px] text-emerald-500">Settled receipts</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</span>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-1">
              {formatCurrency(summary.total_outstanding_paise || 0)}
            </div>
            <span className="text-[10px] text-amber-500">Pending balance</span>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Overdue</span>
            <div className="text-base sm:text-lg font-black text-rose-400 mt-1">
              {formatCurrency(summary.total_overdue_paise || 0)}
            </div>
            <span className="text-[10px] text-rose-500">Past grace period</span>
          </div>

          {/* Segregated Deposits */}
          <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-800/50">
            <span className="text-[10px] font-black text-indigo-300 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Deposits Held
            </span>
            <div className="text-base sm:text-lg font-black text-indigo-200 mt-1">
              {formatCurrency(summary.deposits_held_paise || 0)}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold">Segregated Trust</span>
          </div>

          {/* Platform SaaS MRR */}
          <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-800/50">
            <span className="text-[10px] font-black text-emerald-300 uppercase flex items-center gap-1">
              Platform MRR
            </span>
            <div className="text-base sm:text-lg font-black text-emerald-300 mt-1">
              {formatCurrency(summary.platform_mrr_paise || 0)}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">Owner Subscriptions</span>
          </div>
        </div>
      </div>

      {/* Payment Transactions Stream */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search receipt #, txn ID, tenant name, PG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Transactions</option>
              <option value="completed">Completed Settlements</option>
              <option value="reversed">Reversed Entries</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Receipt / Txn ID</th>
                <th className="px-4 py-3">Tenant / Resident</th>
                <th className="px-4 py-3">PG Destination</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">
                    No transactions found matching filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pmt: any) => (
                  <tr key={pmt.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100 block font-mono">
                        {pmt.payment_number || 'PMT-RECORD'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {pmt.transaction_id || 'Manual Entry'} · {formatDate(pmt.payment_date)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-200 block">{pmt.resident_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pmt.registration_number || 'PG-2026-N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-300">
                      {pmt.org_name}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                      {formatCurrency(pmt.amount_paise || 0)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {pmt.payment_method}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {pmt.is_reversed ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase inline-flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Reversed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {!pmt.is_reversed ? (
                        <button
                          onClick={() => setReversalPayment(pmt)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg text-xs font-semibold border border-slate-700 transition"
                        >
                          Reverse Entry
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Reversal Audited</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-Destructive Payment Reversal Modal */}
      {reversalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <RotateCcw className="w-4 h-4" />
              <h3 className="text-sm font-black text-white">
                Non-Destructive Payment Reversal
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              You are reversing payment <span className="text-white font-mono font-bold">{reversalPayment.payment_number}</span> of{' '}
              <span className="text-emerald-400 font-bold">{formatCurrency(reversalPayment.amount_paise)}</span>.
            </p>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Accounting Guarantee:</div>
              <div>• Original transaction is NOT deleted from database.</div>
              <div>• A countervailing negative payment record will be posted.</div>
              <div>• An unalterable audit log will be written with your credentials.</div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Mandatory Reversal Justification</label>
              <textarea
                rows={3}
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Bank chargeback, duplicate payment entry, or tenant settlement correction..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReversalPayment(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReversePayment}
                disabled={reversalLoading || !reversalReason.trim()}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Execute Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
