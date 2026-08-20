'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, ArrowLeft, Building2, BedDouble, CheckCircle2, Loader2 } from 'lucide-react'
import { rupeesToPaise } from '@/lib/money'

export default function NewRoomPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [buildings, setBuildings] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])

  const [form, setForm] = useState({
    building_id: '',
    floor_id: '',
    room_number: '',
    room_type: 'triple',
    capacity: 3,
    base_rent_rupees: 6000,
    description: '',
    bed_labels: ['A', 'B', 'C'],
  })

  useEffect(() => {
    async function loadBuildings() {
      const { data } = await supabase.from('buildings').select('*').eq('is_active', true)
      if (data && data.length > 0) {
        setBuildings(data)
        setForm((prev) => ({ ...prev, building_id: data[0].id }))
      }
    }
    loadBuildings()
  }, [supabase])

  useEffect(() => {
    if (!form.building_id) return
    async function loadFloors() {
      const { data } = await supabase.from('floors').select('*').eq('building_id', form.building_id).order('floor_number')
      if (data && data.length > 0) {
        setFloors(data)
        setForm((prev) => ({ ...prev, floor_id: data[0].id }))
      }
    }
    loadFloors()
  }, [form.building_id, supabase])

  const handleCapacityChange = (cap: number) => {
    const defaultLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const newLabels = defaultLabels.slice(0, cap)
    setForm({ ...form, capacity: cap, bed_labels: newLabels })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          base_rent_paise: rupeesToPaise(form.base_rent_rupees),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create room')

      router.push('/dashboard/rooms')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/rooms"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Room & Beds</h1>
        <p className="text-xs text-gray-500">
          Configure room number, floor, capacity, and bed identifiers.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Building *</label>
            <select
              value={form.building_id}
              onChange={(e) => setForm({ ...form, building_id: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Floor *</label>
            <select
              value={form.floor_id}
              onChange={(e) => setForm({ ...form, floor_id: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>{fl.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Room Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. 204"
              value={form.room_number}
              onChange={(e) => setForm({ ...form, room_number: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Base Bed Rent (₹/mo) *</label>
            <input
              type="number"
              min={0}
              required
              value={form.base_rent_rupees}
              onChange={(e) => setForm({ ...form, base_rent_rupees: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Room Capacity (Beds)</label>
            <select
              value={form.capacity}
              onChange={(e) => handleCapacityChange(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            >
              <option value={1}>1 Bed (Single)</option>
              <option value={2}>2 Beds (Double Sharing)</option>
              <option value={3}>3 Beds (Triple Sharing)</option>
              <option value={4}>4 Beds (Four Sharing)</option>
              <option value={6}>6 Beds (Dormitory)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Room Sharing Type</label>
            <select
              value={form.room_type}
              onChange={(e) => setForm({ ...form, room_type: e.target.value })}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="single">Single Room</option>
              <option value="double">Double Sharing</option>
              <option value="triple">Triple Sharing</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </div>
        </div>

        {/* Bed Identifiers Preview */}
        <div className="pt-2 border-t">
          <label className="block text-xs font-bold text-gray-700 mb-2">Bed Identifiers to be created:</label>
          <div className="flex gap-2">
            {form.bed_labels.map((lbl, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold"
              >
                Bed {lbl}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Creating...' : 'Create Room & Beds'}
          </button>
        </div>
      </form>
    </div>
  )
}
