'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard, Upload, CheckCircle2, AlertCircle, RefreshCw,
  Search, ArrowRight, DollarSign, Building2, FileText, Check,
  Copy, Download, ExternalLink, ShieldCheck, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function BankReconciliationPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'reconciliation' | 'vans'>('reconciliation')
  const [reconcilingId, setReconcilingId] = useState<string | null>(null)
  const [copiedVan, setCopiedVan] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/reconciliation')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleReconcileSingle = async (txId: string) => {
    try {
      setReconcilingId(txId)
      const res = await fetch('/api/erp/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconcile_single', txId }),
      })
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          transactions: prev.transactions.map((t: any) =>
            t.id === txId ? { ...t, status: 'reconciled' } : t
          ),
        }))
      }
    } catch {} finally {
      setReconcilingId(null)
    }
  }

  const handleReconcileAll = async () => {
    try {
      setSimulating(true)
      const res = await fetch('/api/erp/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconcile_all_matched' }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch {} finally {
      setSimulating(false)
    }
  }

  const handleSimulateStatementUpload = async () => {
    try {
      setSimulating(true)
      const res = await fetch('/api/erp/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate_upload',
          amountRupees: 9500,
          description: 'NEFT CR-SETU9876543210-ARJUN VERMA-OCT-RENT',
        }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch {} finally {
      setSimulating(false)
    }
  }

  const pendingTxs = data?.transactions?.filter((t: any) => t.status === 'pending') || []
  const reconciledTxs = data?.transactions?.filter((t: any) => t.status === 'reconciled') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              BANK AUTOMATION
            </span>
            <h1 className="text-xl font-black text-gray-900">Direct Bank Reconciliation & VANs</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-match incoming NEFT/IMPS/UPI bank statement credits to residents using Virtual Account Numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateStatementUpload}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload Statement CSV</span>
          </button>

          <button
            onClick={handleReconcileAll}
            disabled={simulating || pendingTxs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#14532D] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Auto-Post All Matched ({pendingTxs.length})</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab('reconciliation')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'reconciliation'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Statement Feed ({pendingTxs.length} Unreconciled)
        </button>
        <button
          onClick={() => setActiveSubTab('vans')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'vans'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Virtual Account Registry ({data?.vans?.length || 0} VANs)
        </button>
      </div>

      {/* Main View */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        </div>
      ) : activeSubTab === 'reconciliation' ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Pending Settlement</span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {pendingTxs.length} Transactions
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Auto-Matched Volume</span>
              <p className="text-xl font-black text-emerald-600 mt-1">
                {formatCurrency(pendingTxs.reduce((acc: number, t: any) => acc + t.creditPaise, 0))}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Reconciled This Month</span>
              <p className="text-xl font-black text-blue-600 mt-1">
                {reconciledTxs.length} Posted Payments
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-800">Incoming Bank Statement Credits</h3>
              <span className="text-[11px] text-gray-500">Auto-Refreshed via ICICI / HDFC API Webhook</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="p-3">Date / UTR</th>
                    <th className="p-3">Bank Narrative</th>
                    <th className="p-3">Credit Amount</th>
                    <th className="p-3">Matched Resident</th>
                    <th className="p-3">Match Confidence</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {pendingTxs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        All bank credits have been reconciled and posted to resident ledgers!
                      </td>
                    </tr>
                  ) : (
                    pendingTxs.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-gray-50/60 transition">
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{tx.date}</p>
                          <p className="font-mono text-[10px] text-gray-400">{tx.utr}</p>
                        </td>
                        <td className="p-3 max-w-xs truncate text-[11px] font-mono text-gray-600">
                          {tx.description}
                        </td>
                        <td className="p-3 font-black text-emerald-700 text-sm">
                          {formatCurrency(tx.creditPaise)}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-gray-900">{tx.matchedResidentName || '—'}</p>
                          {tx.matchedVan && (
                            <p className="font-mono text-[10px] text-blue-600">VAN: {tx.matchedVan}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                            tx.matchConfidence === 'exact_van'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.matchConfidence === 'phone_match'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.matchConfidence.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleReconcileSingle(tx.id)}
                            disabled={reconcilingId === tx.id}
                            className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#14532D] text-white text-[11px] font-bold rounded-lg transition disabled:opacity-50"
                          >
                            {reconcilingId === tx.id ? 'Posting...' : 'Approve & Post'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* VANs View */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-gray-800">Resident Virtual Account Numbers (VAN)</h3>
              <p className="text-[11px] text-gray-500">Each tenant has a dedicated account number. Any transfer automatically credits their account.</p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
              IFSC: ICIC0000104
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3">Resident</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Virtual Account No (VAN)</th>
                  <th className="p-3">Bank & IFSC</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data?.vans?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No active residents registered for VANs.
                    </td>
                  </tr>
                ) : (
                  data?.vans?.map((van: any) => (
                    <tr key={van.residentId} className="hover:bg-gray-50/60 transition">
                      <td className="p-3 font-bold text-gray-900">{van.residentName}</td>
                      <td className="p-3 text-gray-600">{van.roomNumber}</td>
                      <td className="p-3 font-mono font-black text-blue-700 text-sm">{van.vanNumber}</td>
                      <td className="p-3 text-gray-600">
                        {van.bankName} · <span className="font-mono">{van.ifscCode}</span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`Account No: ${van.vanNumber}\nIFSC: ${van.ifscCode}\nBeneficiary: ${van.residentName}`)
                            setCopiedVan(van.vanNumber)
                            setTimeout(() => setCopiedVan(null), 2000)
                          }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                        >
                          {copiedVan === van.vanNumber ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedVan === van.vanNumber ? 'Copied' : 'Copy Bank Details'}</span>
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
    </div>
  )
}
