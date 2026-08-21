'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, Loader2, ArrowRight, Sparkles, Layers } from 'lucide-react'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    org_name: '',
    property_name: '',
    property_city: '',
    property_address: '',
    phone: '',
    num_floors: 2,
    rooms_per_floor: 4,
    beds_per_room: 2,
    default_rent_rupees: 6500,
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong while setting up your PG')
      }

      // Successful setup
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const calculatedRooms = (Number(form.num_floors) || 1) * (Number(form.rooms_per_floor) || 1)
  const calculatedBeds = calculatedRooms * (Number(form.beds_per_room) || 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-xl space-y-6 my-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/20 text-white mb-1">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Setup Your PG Profile</h1>
          <p className="text-xs sm:text-sm text-blue-200/80 font-medium">
            Configure your PG business, campus name, and initial room capacity in 60 seconds.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">PG Profile & Real Inventory</span>
            <p className="text-xs text-gray-500 mt-0.5">Live Production Setup · ₹10/Bed/Month Plan</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">PG Business / Brand Name *</label>
                <input
                  required
                  value={form.org_name}
                  onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                  placeholder="e.g. Royal Palace PG"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Property Campus Name *</label>
                <input
                  required
                  value={form.property_name}
                  onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                  placeholder="e.g. Main Residency Campus"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-bold focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                <input
                  required
                  value={form.property_city}
                  onChange={(e) => setForm({ ...form, property_city: e.target.value })}
                  placeholder="e.g. Pune / Bangalore"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Owner Contact Phone *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Property Address</label>
              <textarea
                value={form.property_address}
                onChange={(e) => setForm({ ...form, property_address: e.target.value })}
                rows={2}
                placeholder="Street address, landmark, area pin code..."
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none resize-none transition"
              />
            </div>

            {/* Room Capacity Setup */}
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> Initial Room & Bed Generator
                </span>
                <span className="text-[11px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md">
                  {calculatedRooms} Rooms · {calculatedBeds} Beds
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-gray-500 text-[11px] font-medium mb-1">Floors</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.num_floors}
                    onChange={(e) => setForm({ ...form, num_floors: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[11px] font-medium mb-1">Rooms/Floor</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.rooms_per_floor}
                    onChange={(e) => setForm({ ...form, rooms_per_floor: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[11px] font-medium mb-1">Beds/Room</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={form.beds_per_room}
                    onChange={(e) => setForm({ ...form, beds_per_room: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-[11px] font-medium mb-1">Rent / Bed (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={form.default_rent_rupees}
                    onChange={(e) => setForm({ ...form, default_rent_rupees: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:bg-blue-400 text-white font-black rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Creating your PG Profile...' : 'Launch PG Management Dashboard →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
