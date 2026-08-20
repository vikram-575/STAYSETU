'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, ArrowLeft, CheckCircle2, AlertTriangle,
  Users, Calculator, Loader2
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'

export default function RecordElectricityReadingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultMeterId = searchParams.get('meter') || ''

  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [meters, setMeters] = useState<any[]>([])
  const [selectedMeterId, setSelectedMeterId] = useState(defaultMeterId)
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0])
  const [previousReading, setPreviousReading] = useState(0)
  const [currentReading, setCurrentReading] = useState(0)
  const [ratePerUnitRupees, setRatePerUnitRupees] = useState(8)
  const [isMeterReset, setIsMeterReset] = useState(false)
  const [notes, setNotes] = useState('')
  const [roomResidents, setRoomResidents] = useState<any[]>([])

  useEffect(() => {
    async function loadMeters() {
      const { data } = await supabase
        .from('electricity_meters')
        .select('*, rooms(*)')
        .eq('is_active', true)

      if (data && data.length > 0) {
        setMeters(data)
        const activeMeter = selectedMeterId ? data.find((m) => m.id === selectedMeterId) : data[0]
        if (activeMeter) {
          setSelectedMeterId(activeMeter.id)
          loadMeterLatestReading(activeMeter.id)
          if (activeMeter.room_id) loadRoomResidents(activeMeter.room_id)
        }
      }
      setLoading(false)
    }
    loadMeters()
  }, [supabase])

  const loadMeterLatestReading = async (meterId: string) => {
    const { data } = await supabase
      .from('electricity_readings')
      .select('current_reading')
      .eq('meter_id', meterId)
      .order('reading_date', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setPreviousReading(data.current_reading)
      setCurrentReading(data.current_reading + 50)
    } else {
      setPreviousReading(1000)
      setCurrentReading(1050)
    }
  }

  const loadRoomResidents = async (roomId: string) => {
    const { data } = await supabase
      .from('v_resident_current')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'active')

    setRoomResidents(data || [])
  }

  const handleMeterChange = (meterId: string) => {
    setSelectedMeterId(meterId)
    loadMeterLatestReading(meterId)
    const m = meters.find((x) => x.id === meterId)
    if (m?.room_id) loadRoomResidents(m.room_id)
    else setRoomResidents([])
  }

  const unitsConsumed = isMeterReset ? currentReading : Math.max(0, currentReading - previousReading)
  const totalAmountRupees = unitsConsumed * ratePerUnitRupees
  const perResidentShare = roomResidents.length > 0 ? Math.round((totalAmountRupees / roomResidents.length) * 100) / 100 : totalAmountRupees

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMeterReset && currentReading < previousReading) {
      setError('Current reading cannot be lower than previous reading unless meter reset is explicitly checked.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const now = new Date(readingDate)
      const res = await fetch('/api/electricity/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meter_id: selectedMeterId,
          reading_date: readingDate,
          previous_reading: previousReading,
          current_reading: currentReading,
          rate_per_unit_paise: rupeesToPaise(ratePerUnitRupees),
          is_meter_reset: isMeterReset,
          period_month: now.getMonth() + 1,
          period_year: now.getFullYear(),
          notes,
          residents_count: roomResidents.length,
          resident_ids: roomResidents.map((r) => r.resident_id),
          per_resident_paise: rupeesToPaise(perResidentShare),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save electricity reading')

      router.push('/dashboard/electricity')
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/electricity"
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Electricity Reading</h1>
        <p className="text-xs text-gray-500">
          Enter current meter reading. Units consumed will be calculated and split automatically among room residents.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Meter *</label>
          <select
            value={selectedMeterId}
            onChange={(e) => handleMeterChange(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
          >
            {meters.map((m) => (
              <option key={m.id} value={m.id}>
                Meter {m.meter_number} {m.rooms ? `· Room ${m.rooms.room_number}` : '· Common Meter'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reading Date *</label>
            <input
              type="date"
              required
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Rate per Unit (₹/kWh) *</label>
            <input
              type="number"
              min={1}
              required
              value={ratePerUnitRupees}
              onChange={(e) => setRatePerUnitRupees(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Previous Meter Reading *</label>
            <input
              type="number"
              required
              value={previousReading}
              onChange={(e) => setPreviousReading(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Current Meter Reading *</label>
            <input
              type="number"
              required
              value={currentReading}
              onChange={(e) => setCurrentReading(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-blue-700 text-sm"
            />
          </div>
        </div>

        {/* Meter Reset Checkbox */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            id="meterReset"
            checked={isMeterReset}
            onChange={(e) => setIsMeterReset(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="meterReset" className="text-xs text-gray-700 font-semibold cursor-pointer">
            Meter Reset / Replacement (Check this if a new meter was installed and reading restarted)
          </label>
        </div>

        {/* Calculated Consumption Strip */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-gray-900">Consumption & Cost Calculation:</h4>
          <div className="flex justify-between">
            <span className="text-gray-600">Units Consumed:</span>
            <span className="font-extrabold text-yellow-800">{unitsConsumed.toLocaleString('en-IN')} kWh</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Electricity Amount:</span>
            <span className="font-extrabold text-gray-900 text-sm">₹{totalAmountRupees.toLocaleString('en-IN')}</span>
          </div>

          {roomResidents.length > 0 && (
            <div className="pt-2 border-t border-yellow-200/60 flex justify-between items-center text-xs">
              <span className="text-gray-700 font-semibold">
                Split across {roomResidents.length} active resident{roomResidents.length > 1 ? 's' : ''}:
              </span>
              <span className="font-extrabold text-blue-700">₹{perResidentShare.toLocaleString('en-IN')} / resident</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Remarks</label>
          <input
            type="text"
            placeholder="e.g. Month of August AC consumption"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="pt-3 border-t flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-gray-950 rounded-xl text-xs font-bold transition shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {submitting ? 'Recording...' : 'Post Reading & Split Bill'}
          </button>
        </div>
      </form>
    </div>
  )
}
