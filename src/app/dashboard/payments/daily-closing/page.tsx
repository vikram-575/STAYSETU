'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Scale, ArrowLeft, CheckCircle2, AlertTriangle,
  Banknote, Loader2, Calendar
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'

export default function DailyCashClosingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedCashPaise, setExpectedCashPaise] = useState(0)
  const [actualCashRupees, setActualCashRupees] = useState(0)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load system cash recorded for selected date
  useEffect(() => {
    async function loadCashPayments() {
      setLoading(true)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_paise')
        .eq('payment_date', closingDate)
        .eq('payment_method', 'cash')
        .eq('status', 'completed')

      const total = payments?.reduce((s, p) => s + p.amount_paise, 0) || 0
      setExpectedCashPaise(total)
      setActualCashRupees(total / 100)
      setLoading(false)
    }
    loadCashPayments()
  }, [closingDate, supabase])

  const actualCashPaise = rupeesToPaise(actualCashRupees)
  const differencePaise = actualCashPaise - expectedCashPaise

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (differencePaise !== 0 && !explanation.trim()) {
      setError('A mandatory explanation note is required when physical cash differs from recorded cash.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/payments/daily-closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_date: closingDate,
          expected_cash_paise: expectedCashPaise,
          recorded_cash_paise: actualCashPaise,
          explanation,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit daily cash closing')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Payments
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Owner Daily Cash Closing</h1>
        <p className="text-xs text-gray-500">
          Reconcile recorded cash against physical cash in hand to prevent cash leakage.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {success ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Cash Closing Reconciled!</h2>
          <p className="text-xs text-gray-500">
            Daily register closing locked for {closingDate}.
          </p>
          <Link
            href="/dashboard/payments"
            className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
          >
            Back to Payments Center
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Closing Date</label>
            <input
              type="date"
              required
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">System Recorded Cash:</span>
              <span className="font-extrabold text-gray-900">{formatCurrency(expectedCashPaise)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Physical Cash in Hand (₹) *</label>
            <input
              type="number"
              min={0}
              required
              value={actualCashRupees}
              onChange={(e) => setActualCashRupees(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-extrabold text-base"
            />
          </div>

          {/* Difference Indicator */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              differencePaise === 0
                ? 'bg-green-50 border-green-200 text-green-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span className="font-bold">Reconciliation Difference:</span>
            <span className="font-black text-base">
              {differencePaise === 0 ? '₹0 (Exact Match)' : formatCurrency(differencePaise)}
            </span>
          </div>

          {differencePaise !== 0 && (
            <div>
              <label className="block text-xs font-bold text-red-700 mb-1">
                Discrepancy Explanation * (Required)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain the ₹ difference reason (e.g., manager took petty cash for milk/groceries)"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          )}

          <div className="pt-3 border-t flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
              {submitting ? 'Closing...' : 'Lock Daily Cash Closing'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
