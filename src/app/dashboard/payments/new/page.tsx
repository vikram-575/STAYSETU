'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard, ArrowLeft, CheckCircle2, Loader2,
  DollarSign, Smartphone, Banknote, Building2,
  Printer, MessageCircle, Plus, RotateCcw, FileText
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'
import { generateIdempotencyKey, formatDate, buildWhatsAppLink } from '@/lib/utils'

export default function NewPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultResidentId = searchParams.get('resident') || ''

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
      try {
        const res = await fetch('/api/residents?status=active')
        const data = await res.json()
        if (data.residents && data.residents.length > 0) {
          setResidents(data.residents)
          if (!selectedResidentId) {
            setSelectedResidentId(data.residents[0].resident_id)
            if (data.residents[0].total_outstanding_paise > 0) {
              setAmountRupees(data.residents[0].total_outstanding_paise / 100)
            }
          }
        }
      } catch (e) {
        console.error('Failed to load residents:', e)
      }
    }
    loadResidents()
  }, [selectedResidentId])

  const selectedResident = residents.find((r) => r.resident_id === selectedResidentId)

  const handleResidentChange = (resId: string) => {
    setSelectedResidentId(resId)
    const res = residents.find((r) => r.resident_id === resId)
    if (res && res.total_outstanding_paise > 0) {
      setAmountRupees(res.total_outstanding_paise / 100)
    }
  }

  const [recordedPayment, setRecordedPayment] = useState<any>(null)

  const handleReset = () => {
    setSuccess(false)
    setRecordedPayment(null)
    setAmountRupees(5000)
    setTransactionId('')
    setNotes('')
    setError('')
    setLoading(false)
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

      setRecordedPayment({
        payment_number: data.payment_number || 'RCP-PAID',
        resident: selectedResident,
        amount: amountRupees,
        method: paymentMethod,
        date: paymentDate,
        transaction_id: transactionId,
        notes,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success && recordedPayment) {
    const res = recordedPayment.resident
    const receiptMessage = `*Payment Receipt - PG-SETU*\n\nDear ${res?.full_name || 'Resident'},\nWe have successfully received *₹${recordedPayment.amount.toLocaleString('en-IN')}* via ${recordedPayment.method.toUpperCase()}.\nReceipt No: *${recordedPayment.payment_number}*\nDate: ${formatDate(recordedPayment.date)}\n${recordedPayment.transaction_id ? `Ref: ${recordedPayment.transaction_id}\n` : ''}Room: ${res?.room_number || '—'} (Bed ${res?.bed_label || '—'})\n\nCredited to your digital ledger. Thank you!`
    const waLink = res?.phone ? buildWhatsAppLink(res.phone, receiptMessage) : ''

    return (
      <div className="max-w-xl mx-auto py-6 sm:py-10 px-4 space-y-4">
        {/* Printable Official Receipt Card */}
        <div id="receipt-card" className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xl space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-gray-900">Payment Collection Receipt</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Official money collection voucher</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 font-mono text-xs font-bold rounded-lg border border-blue-200">
                {recordedPayment.payment_number}
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(recordedPayment.date)}</p>
            </div>
          </div>

          {/* Resident Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Resident</span>
              <p className="font-bold text-gray-900 mt-0.5 text-sm">{res?.full_name}</p>
              <p className="font-mono text-[11px] text-gray-500">{res?.registration_number}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Assigned Space</span>
              <p className="font-bold text-gray-900 mt-0.5">
                Room {res?.room_number || '—'} · Bed {res?.bed_label || '—'}
              </p>
              <p className="text-[10px] text-gray-500">{res?.building_name || 'Main Property'}</p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Payment Mode</span>
              <span className="inline-block mt-0.5 uppercase font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-gray-200">
                {recordedPayment.method}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Transaction / Ref ID</span>
              <p className="font-mono font-semibold text-gray-800 mt-0.5 text-[11px]">
                {recordedPayment.transaction_id || 'Cash / Direct'}
              </p>
            </div>
          </div>

          {/* Amount Paid Big Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Total Amount Received
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-800">
                ₹{recordedPayment.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right text-xs text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Credited to Ledger</span>
            </div>
          </div>

          {recordedPayment.notes && (
            <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-xl">
              &quot;{recordedPayment.notes}&quot;
            </p>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
              >
                <MessageCircle className="w-4 h-4" /> Share on WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" /> Record Another Payment
            </button>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/residents/${res?.resident_id}?tab=ledger`}
                className="font-bold text-gray-600 hover:text-gray-900 transition"
              >
                View Ledger →
              </Link>
              <Link
                href="/dashboard/payments"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
              >
                Collection Log
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Record Payment Collection</h1>
        <p className="text-xs text-gray-500 font-medium">
          Accept cash, UPI, or bank transfer payments. Automatically allocated to oldest unpaid invoices.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
        {/* Resident Select */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Resident *</label>
          <select
            value={selectedResidentId}
            onChange={(e) => handleResidentChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
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
          <div className="p-3.5 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl flex items-center justify-between text-xs shadow-2xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600">Current Outstanding Due</span>
              <p className="font-black text-gray-900 text-sm mt-0.5">
                {formatCurrency(selectedResident.total_outstanding_paise)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAmountRupees(selectedResident.total_outstanding_paise / 100)}
              className="px-3 py-1.5 bg-blue-600 active:scale-95 text-white rounded-xl text-[11px] font-bold hover:bg-blue-700 transition"
            >
              Fill Full Due
            </button>
          </div>
        )}

        {/* Amount & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Amount Collected (₹) *</label>
            <input
              type="number"
              min={1}
              required
              value={amountRupees}
              onChange={(e) => setAmountRupees(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-green-700"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">UPI Ref / Transaction ID</label>
            <input
              type="text"
              placeholder="e.g. UPI/123456789 or Cheque #"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
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
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Recording...' : 'Confirm & Collect Payment'}
          </button>
        </div>
      </form>
    </div>
  )
}
