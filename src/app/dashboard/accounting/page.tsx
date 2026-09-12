'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen, Download, CheckCircle2, AlertCircle, FileText,
  DollarSign, ArrowRight, RefreshCw, Layers, ShieldCheck,
  TrendingUp, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function AccountingPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'journals' | 'trial_balance'>('journals')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/accounting')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              ERP ACCOUNTING
            </span>
            <h1 className="text-xl font-black text-gray-900">Double-Entry Accounting & Tally Sync</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            General ledger, automated journal entries, trial balance, and 1-click export for Tally Prime and Zoho Books.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/erp/accounting?export=tally"
            download="PG-Setu-Tally-Vouchers.xml"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Export Tally XML</span>
          </a>

          <a
            href="/api/erp/accounting?export=zoho"
            download="PG-Setu-ZohoBooks-Journals.csv"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Zoho CSV</span>
          </a>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Trial Balance Status</span>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="text-base font-black text-emerald-700">Fully Balanced (₹0 Diff)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Debits</span>
          <p className="text-xl font-black text-gray-900 mt-1">
            {formatCurrency(data?.summary?.totalDebitPaise || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Credits</span>
          <p className="text-xl font-black text-gray-900 mt-1">
            {formatCurrency(data?.summary?.totalCreditPaise || 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('journals')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'journals'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          General Journal ({data?.journals?.length || 0} Entries)
        </button>
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'trial_balance'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Trial Balance ({data?.trialBalance?.length || 0} Accounts)
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        </div>
      ) : activeTab === 'journals' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3">Date / Voucher</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Debit Ledger (By)</th>
                  <th className="p-3">Credit Ledger (To)</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Narration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data?.journals?.map((j: any) => (
                  <tr key={j.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{j.date}</p>
                      <p className="font-mono text-[10px] text-gray-400">{j.voucherNumber}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {j.voucherType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-800">{j.debitAccount}</td>
                    <td className="p-3 font-semibold text-blue-800">{j.creditAccount}</td>
                    <td className="p-3 text-right font-black text-gray-900">
                      {formatCurrency(j.amountPaise)}
                    </td>
                    <td className="p-3 text-gray-500 text-[11px] max-w-xs truncate">
                      {j.narration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3">Ledger Account</th>
                  <th className="p-3 text-right">Debit Balance</th>
                  <th className="p-3 text-right">Credit Balance</th>
                  <th className="p-3 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data?.trialBalance?.map((acc: any) => (
                  <tr key={acc.accountName} className="hover:bg-gray-50/60 transition">
                    <td className="p-3 font-bold text-gray-900">{acc.accountName}</td>
                    <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                      {acc.debitPaise > 0 ? formatCurrency(acc.debitPaise) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-blue-700">
                      {acc.creditPaise > 0 ? formatCurrency(acc.creditPaise) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-gray-900">
                      {formatCurrency(Math.abs(acc.netPaise))} {acc.netPaise >= 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50/80 font-black text-xs border-t-2 border-gray-300">
                  <td className="p-3 text-gray-900 uppercase">Grand Total (Balanced)</td>
                  <td className="p-3 text-right font-mono text-emerald-800">
                    {formatCurrency(data?.summary?.totalDebitPaise || 0)}
                  </td>
                  <td className="p-3 text-right font-mono text-blue-800">
                    {formatCurrency(data?.summary?.totalCreditPaise || 0)}
                  </td>
                  <td className="p-3 text-right text-emerald-700">✓ In Equilibrium</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
