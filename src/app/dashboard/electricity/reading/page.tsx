'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap, ArrowLeft, CheckCircle2, AlertTriangle,
  Users, Calculator, Loader2, BedDouble, UserCheck, Shield
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'
import { FirebaseFileUploader } from '@/components/ui/firebase-file-uploader'
import { calculateDifferentialUnits } from '@/lib/electricity-helper'

export default function RecordElectricityReadingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultMeterId = searchParams.get('meter') || ''

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [meters, setMeters] = useState<any[]>([])
  const [selectedMeterId, setSelectedMeterId] = useState(defaultMeterId)
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0])
  const [previousReading, setPreviousReading] = useState(0)
  const [currentReading, setCurrentReading] = useState(0)
  const [ratePerUnitRupees, setRatePerUnitRupees] = useState(10)
  const [isMeterReset, setIsMeterReset] = useState(false)
  const [meterPhotoUrl, setMeterPhotoUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedMeter, setSelectedMeter] = useState<any | null>(null)

  useEffect(() => {
    async function loadMeters() {
      try {
        const res = await fetch('/api/electricity/meters')
        const data = await res.json()
        if (data.meters && data.meters.length > 0) {
          setMeters(data.meters)
          const active = defaultMeterId
            ? (data.meters.find((m: any) => m.id === defaultMeterId) || data.meters[0])
            : data.meters[0]

          if (active) {
            applyMeter(active)
          }
        }
      } catch (err) {
        console.error('Failed to load electricity meters:', err)
      }
      setLoading(false)
    }
    loadMeters()
  }, [defaultMeterId])

  const applyMeter = (m: any) => {
    setSelectedMeterId(m.id)
    setSelectedMeter(m)
    const latest = m.latest_reading ?? 0
    setPreviousReading(latest)
    setCurrentReading(latest > 0 ? latest + 15 : 15)
    setRatePerUnitRupees(m.default_rate_paise ? m.default_rate_paise / 100 : 10)
  }

  const handleMeterChange = (meterId: string) => {
    const m = meters.find((x) => x.id === meterId)
    if (m) {
      applyMeter(m)
    }
  }

  const isBedMeter = Boolean(selectedMeter?.is_bed_meter || selectedMeter?.bed_id)
  const activeResident = selectedMeter?.active_resident || null
  const roomResidents = selectedMeter?.room_residents || []

  // Differential calculation: current - previous
  const unitsConsumed = calculateDifferentialUnits(currentReading, previousReading, isMeterReset)
  const totalAmountRupees = Math.round(unitsConsumed * ratePerUnitRupees * 100) / 100
  const perResidentShare = !isBedMeter && roomResidents.length > 0
    ? Math.round((totalAmountRupees / roomResidents.length) * 100) / 100
    : totalAmountRupees

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMeterReset && currentReading < previousReading) {
      setError(`Current reading (${currentReading}) cannot be lower than previous baseline (${previousReading}) without meter reset.`)
      return
    }

    setSubmitting(true)
    setError('')
    setSuccessMsg('')

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
          bed_id: selectedMeter?.bed_id || null,
          resident_id: activeResident?.id || null,
          resident_ids: roomResidents.map((r: any) => r.resident_id),
          per_resident_paise: rupeesToPaise(perResidentShare),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save electricity reading')

      setSuccessMsg(data.message || 'Reading recorded successfully! Differential bill debited to resident.')
      setTimeout(() => {
        router.push('/dashboard/electricity')
      }, 1200)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <Link
          href="/dashboard/electricity"
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Record Electricity Reading</h1>
        <p className="text-xs text-gray-500 font-medium">
          Enter newly uploaded meter reading. System automatically minuses the previous reading to bill only the differential units consumed.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
        {/* Meter Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select Meter (Bed or Room) *</label>
          <select
            value={selectedMeterId}
            onChange={(e) => handleMeterChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
          >
            {meters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_title || `Meter ${m.meter_number}`} · Baseline: {m.latest_reading || 0} kWh
              </option>
            ))}
          </select>
        </div>

        {/* Selected Meter Info Banner */}
        {selectedMeter && (
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 font-mono">
                Meter {selectedMeter.meter_number}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isBedMeter ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isBedMeter ? `⚡ Bed-Wise (Bed ${selectedMeter.bed_label || 'A'})` : '👥 Room-Shared'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                Location:{' '}
                <strong className="text-gray-900">
                  {selectedMeter.rooms ? `Room ${selectedMeter.rooms.room_number}` : 'Common Area'}
                  {selectedMeter.bed_label ? ` · Bed ${selectedMeter.bed_label}` : ''}
                </strong>
              </div>
              <div>
                Billed To:{' '}
                {activeResident ? (
                  <strong className="text-emerald-700 font-bold">
                    {activeResident.full_name} ({activeResident.phone})
                  </strong>
                ) : isBedMeter ? (
                  <span className="text-amber-700 font-semibold">Bed Vacant</span>
                ) : (
                  <strong className="text-blue-700 font-bold">{roomResidents.length} Room Occupants (Equal Split)</strong>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reading Date & Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reading Date *</label>
            <input
              type="date"
              required
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Rate per Unit (₹/kWh) *</label>
            <input
              type="number"
              min={1}
              step={0.5}
              required
              value={ratePerUnitRupees}
              onChange={(e) => setRatePerUnitRupees(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
            />
          </div>
        </div>

        {/* Previous Reading & Current Reading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">Previous Reading (Baseline) *</label>
              <span className="text-[10px] text-gray-400 font-semibold">Starting Point</span>
            </div>
            <input
              type="number"
              step="0.1"
              required
              value={previousReading}
              onChange={(e) => setPreviousReading(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-mono bg-gray-50 text-gray-700"
            />
            <p className="text-[10px] text-gray-400 mt-0.5">Retrieved from resident onboarding or last recorded reading</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-900">Current / New Reading (kWh) *</label>
              <span className="text-[10px] text-blue-600 font-bold">Newly Uploaded</span>
            </div>
            <input
              type="number"
              step="0.1"
              required
              value={currentReading}
              onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 text-xs border border-yellow-400 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-mono font-black text-blue-800 text-sm bg-yellow-50/20"
            />
            <p className="text-[10px] text-gray-500 mt-0.5">Enter latest meter unit on display</p>
          </div>
        </div>

        {/* Meter Reset Checkbox */}
        <div className="flex items-center gap-2.5 p-3 sm:p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            id="meterReset"
            checked={isMeterReset}
            onChange={(e) => setIsMeterReset(e.target.checked)}
            className="w-4 h-4 text-yellow-600 rounded"
          />
          <label htmlFor="meterReset" className="text-xs text-gray-700 font-semibold cursor-pointer select-none">
            Meter Reset / Replacement (Check if sub-meter was swapped or counter reset to zero)
          </label>
        </div>

        {/* Calculated Differential Consumption Strip */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl space-y-2.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-gray-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-yellow-600 fill-current" />
              Differential Calculation Breakdown:
            </h4>
            <span className="text-[11px] font-mono font-bold text-gray-500">
              {currentReading} − {previousReading}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-white/80 rounded-xl border border-yellow-200/80">
            <div>
              <span className="text-[10px] text-gray-500 block">Differential Units</span>
              <span className="font-mono font-black text-yellow-900 text-sm sm:text-base">
                {unitsConsumed.toLocaleString('en-IN')} kWh
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Tariff Rate</span>
              <span className="font-semibold text-gray-800">₹{ratePerUnitRupees}/kWh</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gray-500 block">Total Electricity Bill</span>
              <span className="font-black text-green-700 text-sm sm:text-base">
                ₹{totalAmountRupees.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-yellow-200/60 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs">
            {isBedMeter && activeResident ? (
              <span className="text-emerald-800 font-bold">
                ✓ 100% debited directly to {activeResident.full_name}&apos;s ledger (Bed {selectedMeter?.bed_label || 'A'})
              </span>
            ) : isBedMeter ? (
              <span className="text-amber-800 font-semibold">
                ℹ️ Bed currently vacant. Units recorded for meter baseline history.
              </span>
            ) : roomResidents.length > 0 ? (
              <>
                <span className="text-gray-700 font-semibold">
                  Split equally across {roomResidents.length} room residents:
                </span>
                <span className="font-black text-blue-700">₹{perResidentShare.toLocaleString('en-IN')} / resident</span>
              </>
            ) : (
              <span className="text-gray-500">No active residents found in room</span>
            )}
          </div>
        </div>

        <FirebaseFileUploader
          label="Upload Sub-Meter Snapshot Photo (Optional)"
          storagePath={`meters/${selectedMeterId || 'general'}`}
          accept="image/*"
          currentUrl={meterPhotoUrl}
          onUploadSuccess={(url) => setMeterPhotoUrl(url)}
        />

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Remarks</label>
          <input
            type="text"
            placeholder="e.g. Month-end AC meter differential"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none"
          />
        </div>

        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">
            ℹ️ Posting this reading will calculate differential units and debit the resident&apos;s ledger directly.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 disabled:bg-yellow-300 text-gray-950 rounded-xl text-xs font-bold transition shadow-xs shrink-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {submitting ? 'Recording...' : 'Post Reading & Bill Resident'}
          </button>
        </div>
      </form>
    </div>
  )
}
