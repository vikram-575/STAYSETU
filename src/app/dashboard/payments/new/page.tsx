'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  CreditCard, ArrowLeft, CheckCircle2, Loader2,
  DollarSign, Smartphone, Banknote, Building2
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'
import { generateIdempotencyKey } from '@/lib/utils'

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultResidentId = searchParams.get('resident') || ''

  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [residents, setResidents] = useState<any[]>([])
  const [selectedResidentId, setSelectedResidentId] = useState(defaultResidentId)
  const [amountRupees, setAmountRupees] = useState(5000)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [transactionId, setTransactionId] = useState('')
  const [referenceNo, setReferenceNo] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadResidents() {
      const { data } = await supabase
        .from('v_resident_current')
        .select('*')
        .eq('status', 'active')
        .order('full_name')

      if (data && data.length > 0) {
        setResidents(data)
        if (!selectedResidentId) {
          setSelectedResidentId(data[0].resident_id)
          if (data[0].total_outstanding_paise > 0) {
            setAmountRupees(data[0].total_outstanding_paise / 100)
          }
        }
      }
    }
    loadResidents()
  }, [selectedResidentId, supabase])

  const selectedResident = residents.find((r) => r.resident_id === selectedResidentId)

  const handleResidentChange = (resId: string) => {
    setSelectedResidentId(resId)
    const res = residents.find((r) => r.resident_id === resId)
    if (res && res.total_outstanding_paise > 0) {
      setAmountRupees(res.total_outstanding_paise / 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResidentId || amountRupees <= 0) {
      setError('Please provide a valid resident and payment amount.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const idempotencyKey = generateIdempotencyKey()
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: selectedResidentId,
          amount_paise: rupeesToPaise(amountRupees),
          payment_method: paymentMethod,
          payment_date: paymentDate,
          transaction_id: transactionId || null,
          reference_no: referenceNo || null,
          notes: notes || null,
          idempotency_key: idempotencyKey,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record payment')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Recorded Successfully!</h2>
            <p className="text-xs text-gray-500 mt-1">
              ₹{amountRupees.toLocaleString('en-IN')} received and credited to resident ledger. Outstanding balance updated.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/residents/${selectedResidentId}?tab=ledger`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              View Updated Ledger →
            </Link>
            <Link
              href="/dashboard/payments"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
            >
              Back to Collection Log
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Payment Collection</h1>
        <p className="text-xs text-gray-500">
          Accept cash, UPI, or bank transfer payments. Automatically allocated to oldest unpaid invoices.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        {/* Resident Select */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Resident *</label>
          <select
            value={selectedResidentId}
            onChange={(e) => handleResidentChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
          >
            {residents.map((r) => (
              <option key={r.resident_id} value={r.resident_id}>
                {r.full_name} ({r.registration_number}) · Room {r.room_number || '—'} Bed {r.bed_label || '—'}
              </option>
            ))}
          </select>
        </div>

        {/* Selected resident due info */}
        {selectedResident && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600">Current Outstanding Due</span>
              <p className="font-extrabold text-gray-900 text-sm mt-0.5">
                {formatCurrency(selectedResident.total_outstanding_paise)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAmountRupees(selectedResident.total_outstanding_paise / 100)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700"
            >
              Fill Full Due
            </button>
          </div>
        )}

        {/* Amount & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Amount Collected (₹) *</label>
            <input
              type="number"
              min={1}
              required
              value={amountRupees}
              onChange={(e) => setAmountRupees(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-extrabold text-green-700 text-base"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
            >
              <option value="upi">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer (IMPS / NEFT)</option>
              <option value="card">Debit / Credit Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Date & Transaction ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">UPI Ref / Transaction ID</label>
            <input
              type="text"
              placeholder="e.g. UPI/123456789 or Cheque #"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Remarks</label>
          <input
            type="text"
            placeholder="e.g. Paid in full for August month"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Recording...' : 'Confirm & Collect Payment'}
          </button>
        </div>
      </form>
    </div>
  )
}
