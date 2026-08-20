'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, ArrowLeft, Plus, Trash2, CheckCircle2,
  Calendar, Loader2, DollarSign, Calculator
} from 'lucide-react'
import { formatCurrency, rupeesToPaise, paiseToRupees } from '@/lib/money'

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [residents, setResidents] = useState<any[]>([])
  const [selectedResidentId, setSelectedResidentId] = useState('')

  // Dates
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const defaultDueDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0]

  const [periodStart, setPeriodStart] = useState(firstDay)
  const [periodEnd, setPeriodEnd] = useState(lastDay)
  const [dueDate, setDueDate] = useState(defaultDueDate)

  // Invoice Line Items
  const [items, setItems] = useState<any[]>([
    { description: 'Monthly Bed Rent', category: 'rent', quantity: 1, unit_price_rupees: 6000 },
  ])

  useEffect(() => {
    async function loadActiveResidents() {
      const { data } = await supabase
        .from('v_resident_current')
        .select('*')
        .eq('status', 'active')
        .order('full_name')

      if (data && data.length > 0) {
        setResidents(data)
        setSelectedResidentId(data[0].resident_id)
        if (data[0].monthly_rent_paise) {
          setItems([
            { description: 'Monthly Bed Rent', category: 'rent', quantity: 1, unit_price_rupees: data[0].monthly_rent_paise / 100 },
          ])
        }
      }
    }
    loadActiveResidents()
  }, [supabase])

  const handleResidentChange = (resId: string) => {
    setSelectedResidentId(resId)
    const res = residents.find((r) => r.resident_id === resId)
    if (res && res.monthly_rent_paise) {
      setItems([
        { description: 'Monthly Bed Rent', category: 'rent', quantity: 1, unit_price_rupees: res.monthly_rent_paise / 100 },
      ])
    }
  }

  const addItem = (cat: string, desc: string, defaultPrice: number) => {
    setItems([...items, { description: desc, category: cat, quantity: 1, unit_price_rupees: defaultPrice }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, val: any) => {
    const updated = [...items]
    updated[index][field] = val
    setItems(updated)
  }

  const subtotalRupees = items.reduce((sum, it) => sum + (it.quantity * it.unit_price_rupees || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResidentId) {
      setError('Please select a resident.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/billing/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: selectedResidentId,
          period_start: periodStart,
          period_end: periodEnd,
          due_date: dueDate,
          items: items.map((it) => ({
            description: it.description,
            category: it.category,
            quantity: Number(it.quantity),
            unit_price_paise: rupeesToPaise(Number(it.unit_price_rupees)),
            total_paise: rupeesToPaise(Number(it.quantity) * Number(it.unit_price_rupees)),
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate invoice')

      router.push('/dashboard/billing')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Generate Invoice / Statement</h1>
        <p className="text-xs text-gray-500">
          Create billing invoice for bed rent, electricity, food, and miscellaneous services.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        {/* Resident Selector */}
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

        {/* Period & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Period Start *</label>
            <input
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Period End *</label>
            <input
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Payment Due Date *</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-red-600"
            />
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Quick Add Charges to Invoice:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addItem('electricity', 'Electricity Consumption', 750)}
              className="px-2.5 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg text-xs font-semibold"
            >
              + Electricity (₹750)
            </button>
            <button
              type="button"
              onClick={() => addItem('food', 'Monthly Meal / Mess Plan', 2500)}
              className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 rounded-lg text-xs font-semibold"
            >
              + Meal Plan (₹2,500)
            </button>
            <button
              type="button"
              onClick={() => addItem('laundry', 'Laundry Services', 300)}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold"
            >
              + Laundry (₹300)
            </button>
            <button
              type="button"
              onClick={() => addItem('parking', 'Vehicle Parking Fee', 500)}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold"
            >
              + Parking (₹500)
            </button>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="space-y-2 pt-2 border-t">
          <span className="text-xs font-bold text-gray-900 block">Invoice Items:</span>
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              <input
                type="text"
                required
                value={it.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                placeholder="Item description"
                className="flex-1 px-2.5 py-1.5 text-xs border rounded-lg bg-white outline-none"
              />
              <input
                type="number"
                min={1}
                value={it.quantity}
                onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                className="w-14 px-2 py-1.5 text-xs border rounded-lg bg-white outline-none text-center"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  min={0}
                  value={it.unit_price_rupees}
                  onChange={(e) => updateItem(idx, 'unit_price_rupees', Number(e.target.value))}
                  className="w-24 px-2 py-1.5 text-xs border rounded-lg bg-white outline-none font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-1 text-gray-400 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
          <span className="font-bold text-xs text-blue-900">Total Invoice Amount:</span>
          <span className="text-xl font-extrabold text-blue-700">₹{subtotalRupees.toLocaleString('en-IN')}</span>
        </div>

        {/* Submit */}
        <div className="pt-3 border-t flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Creating Invoice...' : 'Generate & Post to Ledger'}
          </button>
        </div>
      </form>
    </div>
  )
}
