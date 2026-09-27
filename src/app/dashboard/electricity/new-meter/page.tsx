'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, ArrowLeft, CheckCircle2, Loader2, BedDouble, Building2 } from 'lucide-react'
import { generateBedMeterNumber } from '@/lib/electricity-helper'
import { rupeesToPaise } from '@/lib/money'

export default function NewMeterPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState<any[]>([])

  const [form, setForm] = useState({
    meter_number: '',
    meter_type: 'sub',
    room_id: '',
    bed_id: '',
    allocation_method: 'per_resident',
    initial_reading: '0.0',
    rate_per_unit_rupees: 10,
    notes: '',
  })

  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await fetch('/api/rooms')
        const data = await res.json()
        if (data.rooms && data.rooms.length > 0) {
          setRooms(data.rooms)
        }
      } catch (err) {
        console.error('Failed to load rooms:', err)
      }
    }
    loadRooms()
  }, [])

  const selectedRoom = rooms.find((r) => r.id === form.room_id)
  const availableBeds = selectedRoom?.beds || []

  const handleRoomChange = (roomId: string) => {
    const rm = rooms.find((r) => r.id === roomId)
    const firstBed = rm?.beds?.[0]
    const suggestedMeter = rm && firstBed ? generateBedMeterNumber(rm.room_number, firstBed.bed_label) : (rm ? `MTR-${rm.room_number}` : '')

    setForm((prev) => ({
      ...prev,
      room_id: roomId,
      bed_id: firstBed?.id || '',
      meter_number: suggestedMeter,
      allocation_method: firstBed ? 'per_resident' : 'equal_split',
    }))
  }

  const handleBedChange = (bedId: string) => {
    const bed = availableBeds.find((b: any) => b.id === bedId)
    const suggestedMeter = selectedRoom && bed ? generateBedMeterNumber(selectedRoom.room_number, bed.bed_label) : form.meter_number

    setForm((prev) => ({
      ...prev,
      bed_id: bedId,
      meter_number: suggestedMeter,
      allocation_method: bedId ? 'per_resident' : 'equal_split',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/electricity/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rate_per_unit_paise: rupeesToPaise(form.rate_per_unit_rupees),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add meter')

      router.push('/dashboard/electricity')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <Link
          href="/dashboard/electricity"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Add Electricity Sub-Meter</h1>
        <p className="text-xs text-gray-500 font-medium">
          Configure a digital or physical sub-meter linked bed-wise or room-wise with baseline starting units.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Room & Bed Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Target Room *</label>
            <select
              value={form.room_id}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-semibold"
            >
              <option value="">Select Room</option>
              {rooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  Room {rm.room_number} ({rm.floors?.name || 'Floor'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Bed Assignment (Bed-Wise Meter)</label>
            <select
              value={form.bed_id}
              disabled={!form.room_id}
              onChange={(e) => handleBedChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-semibold disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">Shared / Whole Room (Equal Split)</option>
              {availableBeds.map((bd: any) => (
                <option key={bd.id} value={bd.id}>
                  Bed {bd.bed_label} {bd.status === 'occupied' ? '(Occupied)' : '(Available)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Meter Number & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Meter Serial / Identifier Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. MTR-101-A"
              value={form.meter_number}
              onChange={(e) => setForm({ ...form, meter_number: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-mono font-bold uppercase"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Physical label or sub-meter ID</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Meter Type</label>
            <select
              value={form.meter_type}
              onChange={(e) => setForm({ ...form, meter_type: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none uppercase font-semibold"
            >
              <option value="sub">Sub-Meter (Dedicated)</option>
              <option value="main">Main Grid Meter</option>
              <option value="virtual">Virtual Calculated Meter</option>
            </select>
          </div>
        </div>

        {/* Opening Reading Baseline & Rate */}
        <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600 fill-current" />
            <h4 className="text-xs font-bold text-gray-900">Opening Reading &amp; Differential Billing</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Starting / Baseline Reading (kWh)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 1450.0"
                value={form.initial_reading}
                onChange={(e) => setForm({ ...form, initial_reading: e.target.value })}
                className="w-full px-3.5 py-2 text-xs border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-mono font-extrabold text-blue-900 bg-white"
              />
              <p className="text-[10px] text-gray-500 mt-0.5">Baseline units (0 units debited today)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Rate per Unit (₹/kWh) *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={form.rate_per_unit_rupees}
                onChange={(e) => setForm({ ...form, rate_per_unit_rupees: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-bold bg-white"
              />
              <p className="text-[10px] text-gray-500 mt-0.5">Electricity tariff for this meter</p>
            </div>
          </div>

          <p className="text-[11px] text-yellow-900 leading-relaxed">
            ℹ️ <strong>Differential Calculation:</strong> When next reading is uploaded, the system will minus this starting reading to compute the consumed units automatically.
          </p>
        </div>

        {/* Allocation Strategy */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Bill Allocation Strategy</label>
          <select
            value={form.allocation_method}
            onChange={(e) => setForm({ ...form, allocation_method: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-medium"
          >
            <option value="per_resident">Per Resident / Dedicated Bed (Direct Debit to Occupant)</option>
            <option value="equal_split">Equal Split Among Room Occupants</option>
            <option value="room_based">Fixed Flat Fee Per Room</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Description</label>
          <input
            type="text"
            placeholder="e.g. Bed A private AC meter"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
          />
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 disabled:bg-yellow-300 text-gray-950 rounded-xl text-xs font-bold transition shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Creating...' : 'Register Electricity Meter'}
          </button>
        </div>
      </form>
    </div>
  )
}
