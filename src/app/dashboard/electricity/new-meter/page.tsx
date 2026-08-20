'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Zap, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

export default function NewMeterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState<any[]>([])

  const [form, setForm] = useState({
    meter_number: '',
    meter_type: 'sub',
    room_id: '',
    allocation_method: 'equal_split',
    notes: '',
  })

  useEffect(() => {
    async function loadRooms() {
      const { data } = await supabase.from('rooms').select('*, floors(*, buildings(*))').eq('is_active', true)
      if (data && data.length > 0) {
        setRooms(data)
      }
    }
    loadRooms()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/electricity/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/electricity"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Electricity Sub-Meter</h1>
        <p className="text-xs text-gray-500">
          Configure a digital or physical sub-meter linked to a specific room or common floor.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Meter Serial / Identifier Number *</label>
          <input
            type="text"
            required
            placeholder="e.g. MTR-204 or 83921829"
            value={form.meter_number}
            onChange={(e) => setForm({ ...form, meter_number: e.target.value })}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Linked Room (Optional)</label>
            <select
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Common / Building Main Meter</option>
              {rooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  Room {rm.room_number} ({rm.floors?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Meter Type</label>
            <select
              value={form.meter_type}
              onChange={(e) => setForm({ ...form, meter_type: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
            >
              <option value="sub">Sub-Meter (Room Dedicated)</option>
              <option value="main">Main Grid Meter</option>
              <option value="virtual">Virtual Calculated Meter</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Bill Allocation Strategy</label>
          <select
            value={form.allocation_method}
            onChange={(e) => setForm({ ...form, allocation_method: e.target.value })}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          >
            <option value="equal_split">Equal Split Among Room Residents (Default)</option>
            <option value="per_resident">Per Resident Consumption Units</option>
            <option value="room_based">Fixed Flat Fee Per Room</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            placeholder="e.g. 2nd Floor Room 204 AC sub-meter"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="pt-3 border-t flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-gray-950 rounded-xl text-xs font-bold transition shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Creating...' : 'Register Electricity Meter'}
          </button>
        </div>
      </form>
    </div>
  )
}
