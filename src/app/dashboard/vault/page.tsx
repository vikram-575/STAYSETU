'use client'

import { useState, useEffect } from 'react'
import {
  Coins, CheckCircle2, AlertTriangle, Clock, User,
  FileText, ShieldCheck, ArrowRight, Save, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function CashierVaultClosingPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Denominations Counter State
  const [d500, setD500] = useState(0)
  const [d200, setD200] = useState(0)
  const [d100, setD100] = useState(0)
  const [d50, setD50] = useState(0)
  const [d20, setD20] = useState(0)
  const [d10, setD10] = useState(0)
  const [coins, setCoins] = useState(0)
  const [cashierName, setCashierName] = useState('Rameshwar Yadav')
  const [shift, setShift] = useState('Evening Shift')
  const [handoverNotes, setHandoverNotes] = useState('')

  const physicalTotalRupees =
    d500 * 500 +
    d200 * 200 +
    d100 * 100 +
    d50 * 50 +
    d20 * 20 +
    d10 * 10 +
    coins

  const expectedSystemRupees = data?.expectedSystemCashRupees || 19550
  const discrepancyRupees = physicalTotalRupees - expectedSystemRupees

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/vault')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmitClosing = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await fetch('/api/erp/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashierName,
          shift,
          handoverNotes,
          expectedRupees: expectedSystemRupees,
          denominations: { d500, d200, d100, d50, d20, d10, coins },
        }),
      })
      if (res.ok) {
        fetchData()
        alert('Vault Shift Closing submitted and recorded!')
      }
    } catch {
      alert('Error recording vault closing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              CASH MANAGEMENT
            </span>
            <h1 className="text-xl font-black text-gray-900">Cashier Day-End Vault Reconciliation</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Physical currency denomination counter and shift handover to prevent unrecorded cash leakage.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Physical Counter Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-900">Physical Cash Denomination Counter</h3>
            </div>
            <span className="text-xs font-bold text-gray-500">{shift}</span>
          </div>

          <form onSubmit={handleSubmitClosing} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Cashier / Warden Name</label>
                <input
                  type="text"
                  required
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Shift Handover</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="Morning Shift">Morning Shift (6 AM - 2 PM)</option>
                  <option value="Evening Shift">Evening Shift (2 PM - 10 PM)</option>
                  <option value="Night Shift">Night Shift (10 PM - 6 AM)</option>
                </select>
              </div>
            </div>

            {/* Denomination Rows */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
              {[
                { label: '₹500 Notes', multiplier: 500, val: d500, set: setD500 },
                { label: '₹200 Notes', multiplier: 200, val: d200, set: setD200 },
                { label: '₹100 Notes', multiplier: 100, val: d100, set: setD100 },
                { label: '₹50 Notes', multiplier: 50, val: d50, set: setD50 },
                { label: '₹20 Notes', multiplier: 20, val: d20, set: setD20 },
                { label: '₹10 Notes', multiplier: 10, val: d10, set: setD10 },
                { label: 'Loose Coins', multiplier: 1, val: coins, set: setCoins },
              ].map((row, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-gray-50/70 transition">
                  <span className="font-bold text-gray-800 w-28">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">×</span>
                    <input
                      type="number"
                      min="0"
                      value={row.val || ''}
                      onChange={(e) => row.set(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-20 px-2 py-1 border rounded-lg text-center font-mono font-bold"
                    />
                  </div>
                  <span className="font-mono font-black text-gray-900 w-28 text-right">
                    = ₹{(row.val * row.multiplier).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 text-xs">Shift Handover Remarks</label>
              <textarea
                rows={2}
                placeholder="Notes on vault safe key handover, cash deposited in drop-box..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#16A34A] hover:bg-[#14532D] text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lock & Submit Shift Vault Closing</span>
            </button>
          </form>
        </div>

        {/* Live Discrepancy & Shift Total Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Shift Reconciliation Summary</h4>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between text-gray-600">
                <span>System Expected Cash:</span>
                <strong className="text-gray-900">₹{expectedSystemRupees.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Physical Cash Counted:</span>
                <strong className="text-emerald-800 text-sm font-black">
                  ₹{physicalTotalRupees.toLocaleString('en-IN')}
                </strong>
              </div>

              <hr className="border-gray-200" />

              <div className="pt-1">
                <span className="text-gray-400 text-[10px] block uppercase font-bold">Variance Status</span>
                {discrepancyRupees === 0 ? (
                  <div className="mt-1 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Exact Match — Vault Balanced</span>
                  </div>
                ) : discrepancyRupees > 0 ? (
                  <div className="mt-1 p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Surplus of +₹{discrepancyRupees.toLocaleString('en-IN')} detected</span>
                  </div>
                ) : (
                  <div className="mt-1 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Shortage of -₹{Math.abs(discrepancyRupees).toLocaleString('en-IN')} detected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Past Shift Closings Log */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-gray-800">Recent Vault Closings</h4>
            <div className="space-y-2 text-xs divide-y divide-gray-100">
              {data?.records?.map((rec: any) => (
                <div key={rec.id} className="pt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{rec.shift}</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      ₹{rec.physicalTotalRupees?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">{rec.cashierName} · {rec.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
