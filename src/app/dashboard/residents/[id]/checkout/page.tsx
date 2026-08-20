'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LogOut, ArrowLeft, ArrowRight, CheckCircle2,
  Zap, AlertTriangle, ShieldCheck, DollarSign, Loader2
} from 'lucide-react'
import { formatCurrency, rupeesToPaise, paiseToRupees } from '@/lib/money'

interface Props {
  params: Promise<{ id: string }>
}

export default function CheckoutResidentPage({ params }: Props) {
  const { id: residentId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resident, setResident] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form State
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0])
  const [electricityReading, setElectricityReading] = useState('')
  const [electricityRate, setElectricityRate] = useState(8)
  const [damageChargesRupees, setDamageChargesRupees] = useState(0)
  const [damageReason, setDamageReason] = useState('')
  const [otherChargesRupees, setOtherChargesRupees] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadResident() {
      const { data } = await supabase
        .from('v_resident_current')
        .select('*')
        .eq('resident_id', residentId)
        .single()

      if (data) setResident(data)
      setLoading(false)
    }
    loadResident()
  }, [residentId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading resident details...
      </div>
    )
  }

  if (!resident) {
    return <div className="p-8 text-center text-red-500">Resident not found.</div>
  }

  // Calculations
  const outstandingPaise = resident.total_outstanding_paise || 0
  const depositHeldPaise = resident.deposit_held_paise || 0
  const damagePaise = rupeesToPaise(damageChargesRupees)
  const otherPaise = rupeesToPaise(otherChargesRupees)
  const totalDuesPaise = outstandingPaise + damagePaise + otherPaise

  // Net settlement:
  // If depositHeld >= totalDues: Refund to resident = depositHeld - totalDues
  // If depositHeld < totalDues: Extra to collect = totalDues - depositHeld
  const isRefund = depositHeldPaise >= totalDuesPaise
  const netAmountPaise = Math.abs(depositHeldPaise - totalDuesPaise)

  const handleCheckout = async () => {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/residents/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: residentId,
          exit_date: exitDate,
          damage_charges_paise: damagePaise,
          damage_reason: damageReason,
          other_charges_paise: otherPaise,
          deposit_deduction_paise: Math.min(depositHeldPaise, totalDuesPaise),
          refund_amount_paise: isRefund ? netAmountPaise : 0,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete checkout')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
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
            <h2 className="text-2xl font-bold text-gray-900">Check-Out & Settlement Complete!</h2>
            <p className="text-xs text-gray-500 mt-1">
              Bed has been marked vacant. Complete audit trail preserved in the ledger.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/residents/${residentId}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              View Profile & Final Ledger →
            </Link>
            <Link
              href="/dashboard/residents"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
            >
              Back to Residents List
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
          href={`/dashboard/residents/${residentId}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return to Profile
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Resident Check-Out Workflow</h1>
        <p className="text-xs text-gray-500">
          Final electricity reading · Deposit adjustment · Outstanding clearance · Bed vacancy
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Resident Info Box */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-sm">{resident.full_name}</h2>
          <p className="text-xs text-gray-500 font-mono">{resident.registration_number}</p>
          <p className="text-xs text-blue-600 font-semibold mt-0.5">
            Room {resident.room_number || '—'} · Bed {resident.bed_label || '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase font-bold">Security Deposit Held</p>
          <p className="text-base font-extrabold text-purple-700">{formatCurrency(depositHeldPaise)}</p>
        </div>
      </div>

      {/* Settlement Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Final Settlement Calculation</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Exit / Departure Date *</label>
            <input
              type="date"
              required
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Current Unpaid Dues</label>
            <input
              type="text"
              disabled
              value={formatCurrency(outstandingPaise)}
              className="w-full px-3 py-2 text-xs border rounded-lg bg-gray-50 font-bold text-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Damage / Repair Charges (₹)</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={damageChargesRupees}
              onChange={(e) => setDamageChargesRupees(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Damage Reason (if applicable)</label>
            <input
              type="text"
              placeholder="e.g. Wall paint, broken switch"
              value={damageReason}
              onChange={(e) => setDamageReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Other Final Charges (₹)</label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={otherChargesRupees}
              onChange={(e) => setOtherChargesRupees(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Settlement Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="Key returned, AC remote handed over, room inspection clear..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-gray-900 mb-2">Final Settlement Breakdown:</h4>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-600">Total Unpaid Dues (Rent + Extra):</span>
            <span className="font-bold text-gray-900">{formatCurrency(outstandingPaise)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-600">Damage / Repair Charges:</span>
            <span className="font-bold text-red-600">+{formatCurrency(damagePaise)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-600">Other Final Charges:</span>
            <span className="font-bold text-red-600">+{formatCurrency(otherPaise)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-gray-600 font-semibold">Total Payable Charges:</span>
            <span className="font-extrabold text-gray-900">{formatCurrency(totalDuesPaise)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-200/60">
            <span className="text-purple-700 font-semibold">Security Deposit Available:</span>
            <span className="font-extrabold text-purple-700">{formatCurrency(depositHeldPaise)}</span>
          </div>

          {/* Result */}
          <div className="pt-2 flex justify-between items-center text-sm">
            <span className="font-extrabold text-gray-900">
              {isRefund ? 'Refund to Resident:' : 'Additional Due from Resident:'}
            </span>
            <span
              className={`font-black text-base px-3 py-1 rounded-lg ${
                isRefund ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {formatCurrency(netAmountPaise)}
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t flex justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={handleCheckout}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {submitting ? 'Processing Checkout...' : 'Confirm Final Settlement & Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}
