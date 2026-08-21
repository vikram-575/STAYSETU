'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  PlusCircle, ArrowLeft, Coffee, Utensils, Shirt,
  Car, Sparkles, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'

export default function AddChargePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultResidentId = searchParams.get('resident') || ''

  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [residents, setResidents] = useState<any[]>([])
  const [selectedResidentId, setSelectedResidentId] = useState(defaultResidentId)

  // Catalog items
  const catalogItems = [
    { label: 'Breakfast', cat: 'food', price: 50, icon: Utensils },
    { label: 'Lunch', cat: 'food', price: 80, icon: Utensils },
    { label: 'Dinner', cat: 'food', price: 100, icon: Utensils },
    { label: 'Tea / Chai', cat: 'beverage', price: 15, icon: Coffee },
    { label: 'Coffee', cat: 'beverage', price: 30, icon: Coffee },
    { label: 'Cold Drink / Soda', cat: 'beverage', price: 40, icon: Coffee },
    { label: 'Mineral Water Bottle', cat: 'beverage', price: 20, icon: Coffee },
    { label: 'Laundry (Per Load)', cat: 'laundry', price: 50, icon: Shirt },
    { label: 'Room Cleaning (Special)', cat: 'cleaning', price: 100, icon: Sparkles },
    { label: 'Guest Stay (Per Night)', cat: 'guest', price: 300, icon: Utensils },
    { label: 'Monthly Two-Wheeler Parking', cat: 'parking', price: 300, icon: Car },
    { label: 'Monthly Four-Wheeler Parking', cat: 'parking', price: 800, icon: Car },
  ]

  // Form State
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('food')
  const [quantity, setQuantity] = useState(1)
  const [unitPriceRupees, setUnitPriceRupees] = useState(50)
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
        if (!selectedResidentId) setSelectedResidentId(data[0].resident_id)
      }
    }
    loadResidents()
  }, [selectedResidentId, supabase])

  const handlePickCatalog = (item: typeof catalogItems[0]) => {
    setDescription(item.label)
    setCategory(item.cat)
    setUnitPriceRupees(item.price)
    setQuantity(1)
  }

  const totalChargeRupees = quantity * unitPriceRupees

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedResidentId || !description || unitPriceRupees <= 0) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: selectedResidentId,
          description: `${description} (Qty: ${quantity})`,
          category,
          quantity,
          unit_price_paise: rupeesToPaise(unitPriceRupees),
          total_paise: rupeesToPaise(totalChargeRupees),
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post charge')

      router.push(`/dashboard/residents/${selectedResidentId}?tab=ledger`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Add Extra Consumption Charge</h1>
        <p className="text-xs text-gray-500 font-medium">
          Post food, drinks, laundry, guest, or maintenance charges directly to the resident&apos;s digital ledger.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Quick Catalog Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3">
        <span className="text-xs font-bold text-gray-900 block">Catalog Quick-Pick:</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {catalogItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handlePickCatalog(item)}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 active:scale-95 text-left transition flex flex-col justify-between text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-black text-blue-700">₹{item.price}</span>
                </div>
                <p className="font-bold text-gray-900 mt-1.5 truncate text-[11px]">{item.label}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Resident *</label>
          <select
            value={selectedResidentId}
            onChange={(e) => setSelectedResidentId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
          >
            {residents.map((r) => (
              <option key={r.resident_id} value={r.resident_id}>
                {r.full_name} ({r.registration_number}) · Room {r.room_number || '—'} Bed {r.bed_label || '—'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Item / Charge Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cold Drink / Guest Dinner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none capitalize font-semibold"
            >
              <option value="food">Food / Meals</option>
              <option value="beverage">Beverages / Drinks</option>
              <option value="laundry">Laundry</option>
              <option value="cleaning">Cleaning</option>
              <option value="guest">Guest Charges</option>
              <option value="parking">Parking</option>
              <option value="damage">Damage / Repair</option>
              <option value="late_fee">Late Fee</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Rate / Unit Price (₹) *</label>
            <input
              type="number"
              min={0}
              required
              value={unitPriceRupees}
              onChange={(e) => setUnitPriceRupees(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Remarks</label>
          <input
            type="text"
            placeholder="e.g. 2 guests stayed on Saturday night"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Total Box */}
        <div className="p-3.5 sm:p-4 bg-orange-50 border border-orange-200 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-2xs">
          <span className="font-bold text-xs text-orange-900">Total Charge to Ledger:</span>
          <span className="text-lg sm:text-xl font-black text-orange-700">₹{totalChargeRupees.toLocaleString('en-IN')}</span>
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 disabled:bg-orange-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            {loading ? 'Posting...' : 'Post Charge to Resident Ledger'}
          </button>
        </div>
      </form>
    </div>
  )
}
