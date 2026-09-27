'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap, ArrowLeft, CheckCircle2, AlertTriangle,
  Users, Calculator, Loader2, BedDouble, UserCheck, Shield,
  Info
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'
import { FirebaseFileUploader } from '@/components/ui/firebase-file-uploader'
import { calculateDifferentialUnits, calculateProRataElectricitySplit } from '@/lib/electricity-helper'
import { formatDate } from '@/lib/utils'

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

  // Pro-rata strategy selection: 'pro_rata' vs 'equal'
  const [splitStrategy, setSplitStrategy] = useState<'pro_rata' | 'equal'>('pro_rata')

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
    setRatePerUnitRupees(m.rate_per_unit_paise ? m.rate_per_unit_paise / 100 : 10)
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

  // Calculate Pro-Rata Stay Split for shared room meters
  const proRataResult = useMemo(() => {
    if (isBedMeter || roomResidents.length <= 1) return null

    const d = new Date(readingDate)
    const month = d.getMonth() + 1
    const year = d.getFullYear()

    return calculateProRataElectricitySplit({
      totalUnits: unitsConsumed,
      ratePerUnitPaise: rupeesToPaise(ratePerUnitRupees),
      periodMonth: month,
      periodYear: year,
      residents: roomResidents,
    })
  }, [isBedMeter, roomResidents, unitsConsumed, ratePerUnitRupees, readingDate])

  const perResidentEqualShare = !isBedMeter && roomResidents.length > 0
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
      const isProRataMode = !isBedMeter && roomResidents.length > 1 && splitStrategy === 'pro_rata' && proRataResult

      const payload: any = {
        meter_id: selectedMeterId,
        reading_date: readingDate,
        previous_reading: previousReading,
        current_reading: currentReading,
        rate_per_unit_paise: rupeesToPaise(ratePerUnitRupees),
        is_meter_reset: isMeterReset,
        period_month: now.getMonth() + 1,
        period_year: now.getFullYear(),
        notes,
        photo_url: meterPhotoUrl || null,
        bed_id: selectedMeter?.bed_id || null,
        resident_id: activeResident?.id || null,
        resident_ids: roomResidents.map((r: any) => r.resident_id),
      }

      if (isProRataMode && proRataResult.allocations.length > 0) {
        payload.allocation_method = 'pro_rata_stay'
        payload.allocations = proRataResult.allocations.map((a) => ({
          resident_id: a.resident_id,
          resident_name: a.resident_name,
          units_allocated: a.allocated_units,
          amount_paise: a.allocated_paise,
          explanation: a.explanation,
        }))
      } else {
        payload.per_resident_paise = rupeesToPaise(perResidentEqualShare)
      }

      const res = await fetch('/api/electricity/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          <ArrowLeft className="w-4 h-4" /> Cancel &amp; Return
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
                  <strong className="text-blue-700 font-bold">{roomResidents.length} Room Occupants (Stay-Split)</strong>
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
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl space-y-3 text-xs shadow-2xs">
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

          {/* Allocation summary footer */}
          {isBedMeter && activeResident ? (
            <div className="pt-2 border-t border-yellow-200/60 text-xs text-emerald-800 font-bold">
              ✓ 100% debited directly to {activeResident.full_name}&apos;s ledger (Bed {selectedMeter?.bed_label || 'A'})
            </div>
          ) : isBedMeter ? (
            <div className="pt-2 border-t border-yellow-200/60 text-xs text-amber-800 font-semibold">
              ℹ️ Bed currently vacant. Units recorded for meter baseline history.
            </div>
          ) : roomResidents.length === 0 ? (
            <div className="pt-2 border-t border-yellow-200/60 text-xs text-gray-500">
              No active residents found in room
            </div>
          ) : null}
        </div>

        {/* MID-MONTH PRO-RATA USAGE BREAKDOWN FOR SHARED ROOM METERS */}
        {!isBedMeter && roomResidents.length > 1 && proRataResult && (
          <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-yellow-600" />
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                  Room Electricity Allocation Strategy
                </h4>
              </div>

              {proRataResult.hasMidMonthMovement && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                  Mid-Month Move-In Detected
                </span>
              )}
            </div>

            {/* Explanatory Banner if Mid-Month Shift occurred */}
            {proRataResult.hasMidMonthMovement && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                  Mid-Month Pro-Rata Formula Applied:
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Solo days before roommate moved in are paid <strong>100% by the early occupant</strong>.
                  Shared days when both lived together are <strong>divided 50/50 equally</strong>.
                </p>
              </div>
            )}

            {/* Strategy Radio Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  splitStrategy === 'pro_rata'
                    ? 'bg-yellow-50/60 border-yellow-400 text-gray-900 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="splitStrategy"
                  checked={splitStrategy === 'pro_rata'}
                  onChange={() => setSplitStrategy('pro_rata')}
                  className="mt-0.5 accent-yellow-500"
                />
                <div>
                  <strong className="block text-xs font-bold">Stay-Adjusted Pro-Rata (Fair)</strong>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Calculates bill by exact days lived in room this month.
                  </span>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  splitStrategy === 'equal'
                    ? 'bg-yellow-50/60 border-yellow-400 text-gray-900 shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <input
                  type="radio"
                  name="splitStrategy"
                  checked={splitStrategy === 'equal'}
                  onChange={() => setSplitStrategy('equal')}
                  className="mt-0.5 accent-yellow-500"
                />
                <div>
                  <strong className="block text-xs font-bold">Simple Equal Split</strong>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Divide total bill equally ({roomResidents.length} ways) regardless of stay days.
                  </span>
                </div>
              </label>
            </div>

            {/* Resident Breakdown Cards */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Resulting Ledger Charges Per Resident:
              </span>

              {splitStrategy === 'pro_rata' ? (
                proRataResult.allocations.map((alloc) => (
                  <div
                    key={alloc.resident_id}
                    className="p-3 bg-gray-50 hover:bg-yellow-50/30 rounded-xl border border-gray-200 transition space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-xs font-bold text-gray-900">{alloc.resident_name}</strong>
                        <p className="text-[10px] text-gray-500">
                          Bed {alloc.bed_label || 'A'} · Checked in {formatDate(alloc.check_in_date)} ·{' '}
                          <strong className="text-gray-800">{alloc.active_days} of {proRataResult.daysInMonth} days active</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-green-700">
                          {formatCurrency(alloc.allocated_paise)}
                        </span>
                        <span className="text-[10px] text-gray-500 block font-mono font-bold">
                          {alloc.allocated_units} kWh ({alloc.percentage}%)
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium">
                      ℹ️ {alloc.explanation}
                    </p>
                  </div>
                ))
              ) : (
                roomResidents.map((r: any) => (
                  <div
                    key={r.resident_id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-xs font-bold text-gray-900">{r.resident_name}</strong>
                      <p className="text-[10px] text-gray-500">Bed {r.bed_label || 'A'} · Equal Room Split</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-green-700">
                        {formatCurrency(rupeesToPaise(perResidentEqualShare))}
                      </span>
                      <span className="text-[10px] text-gray-500 block font-mono font-bold">
                        {(unitsConsumed / roomResidents.length).toFixed(1)} kWh ({(100 / roomResidents.length).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
            ℹ️ Posting this reading will calculate differential units and debit each resident&apos;s ledger directly.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 disabled:bg-yellow-300 text-gray-950 rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {submitting ? 'Recording...' : 'Post Reading & Bill Resident'}
          </button>
        </div>
      </form>
    </div>
  )
}
