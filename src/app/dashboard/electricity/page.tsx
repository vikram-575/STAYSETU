import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import {
  Zap, Plus, History, CheckCircle2, AlertTriangle,
  RotateCcw, Scale, ArrowRight, Gauge, BedDouble, UserCheck
} from 'lucide-react'

import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { parseMeterNotes } from '@/lib/electricity-helper'

export default async function ElectricityPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const orgId = await resolveEffectiveOrgId(user)

  let meters: any[] = []
  let readings: any[] = []

  if (orgId && isValidUUID(orgId)) {
    try {
      const [
        { data: mData },
        { data: rData },
        { data: bedsData },
        { data: assignsData },
        { data: allocsData },
      ] = await Promise.all([
        supabase
          .from('electricity_meters')
          .select('*, rooms(*, floors(*, buildings(*)))')
          .eq('organization_id', orgId)
          .eq('is_active', true)
          .order('meter_number'),
        supabase
          .from('electricity_readings')
          .select('*, electricity_meters(*, rooms(*))')
          .eq('organization_id', orgId)
          .order('reading_date', { ascending: false })
          .limit(30),
        supabase
          .from('beds')
          .select('id, room_id, bed_label, status')
          .eq('organization_id', orgId),
        supabase
          .from('resident_assignments')
          .select('id, resident_id, bed_id, check_in_date, residents(id, full_name, phone)')
          .eq('organization_id', orgId)
          .is('check_out_date', null),
        supabase
          .from('electricity_allocations')
          .select('id, reading_id, resident_id, units_allocated, amount_paise, residents(id, full_name)')
          .eq('organization_id', orgId),
      ])

      // Map beds by id
      const bedsById: Record<string, any> = {}
      bedsData?.forEach((b) => {
        bedsById[b.id] = b
      })

      // Map active resident by bed_id
      const residentByBedId: Record<string, any> = {}
      assignsData?.forEach((a) => {
        if (a.bed_id) residentByBedId[a.bed_id] = a.residents
      })

      // Map latest reading by meter_id
      const latestReadingByMeter: Record<string, any> = {}
      rData?.forEach((r) => {
        if (!latestReadingByMeter[r.meter_id]) {
          latestReadingByMeter[r.meter_id] = r
        }
      })

      // Map allocations by reading_id
      const allocsByReadingId: Record<string, any[]> = {}
      allocsData?.forEach((al) => {
        if (!allocsByReadingId[al.reading_id]) allocsByReadingId[al.reading_id] = []
        allocsByReadingId[al.reading_id].push(al)
      })

      meters = (mData ?? []).map((m: any) => {
        const meta = parseMeterNotes(m.notes)
        const bed = meta.bed_id ? bedsById[meta.bed_id] : null
        const activeRes = bed?.id ? residentByBedId[bed.id] : null
        const latestRead = latestReadingByMeter[m.id]

        return {
          ...m,
          bed_label: bed?.bed_label || meta.bed_label,
          bed,
          active_resident: activeRes,
          is_bed_meter: Boolean(bed || meta.isBedMeter),
          latest_reading: latestRead?.current_reading ?? 0,
          latest_reading_date: latestRead?.reading_date ?? null,
          rate_per_unit_paise: latestRead?.rate_per_unit_paise ?? 1000,
        }
      })

      readings = (rData ?? []).map((r: any) => {
        const meta = parseMeterNotes(r.electricity_meters?.notes)
        const bed = meta.bed_id ? bedsById[meta.bed_id] : null
        const allocs = allocsByReadingId[r.id] || []
        const residentNames = allocs.map((a) => a.residents?.full_name).filter(Boolean)

        return {
          ...r,
          bed_label: bed?.bed_label || meta.bed_label,
          billed_resident_names: residentNames,
        }
      })
    } catch (err) {
      console.error('Failed fetching electricity data:', err)
    }
  }

  // Total consumption this month
  const totalUnits = readings?.reduce((s, r) => s + (r.units_consumed || 0), 0) || 0
  const totalAmountPaise = readings?.reduce((s, r) => s + (r.total_paise || 0), 0) || 0
  const bedMetersCount = meters.filter((m) => m.is_bed_meter).length

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Electricity Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Bed-wise sub-metering · Onboarding baselines · Differential billing (Current − Previous)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/electricity/new-meter"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Add Sub-Meter
          </Link>
          <Link
            href="/dashboard/electricity/reading"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-gray-950 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <Zap className="w-4 h-4" /> Record Reading
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate">Total Meters</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 truncate">{meters?.length || 0}</p>
          <p className="text-[10px] text-gray-400">{bedMetersCount} bed-wise dedicated</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-yellow-200 shadow-2xs bg-yellow-50/20">
          <p className="text-[10px] uppercase font-bold text-yellow-700 truncate">Differential Units</p>
          <p className="text-lg sm:text-xl font-black text-yellow-800 mt-0.5 truncate">{totalUnits.toLocaleString('en-IN')} kWh</p>
          <p className="text-[10px] text-yellow-600">Total consumed</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-green-200 shadow-2xs bg-green-50/20">
          <p className="text-[10px] uppercase font-bold text-green-700 truncate">Total Electricity Billed</p>
          <p className="text-lg sm:text-xl font-black text-green-800 mt-0.5 truncate">{formatCurrency(totalAmountPaise)}</p>
          <p className="text-[10px] text-green-600">Debited to resident ledgers</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate">Billing Policy</p>
          <p className="text-sm sm:text-base font-bold text-gray-900 mt-1 truncate">Bed Differential</p>
          <p className="text-[10px] text-gray-400">Current − Baseline</p>
        </div>
      </div>

      {/* Meters List */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Configured Bed &amp; Room Meters</h2>
          <span className="text-xs text-gray-500 font-medium">{meters.length} meters configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {meters && meters.length > 0 ? (
            meters.map((meter: any) => (
              <div key={meter.id} className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-yellow-500 shrink-0" />
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-gray-900 font-mono">Meter {meter.meter_number}</h3>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">
                        {meter.is_bed_meter ? `Bed ${meter.bed_label || 'A'} Sub-Meter` : `${meter.meter_type} meter`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                    meter.is_bed_meter ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {meter.is_bed_meter ? `Bed ${meter.bed_label || 'A'}` : 'Room Shared'}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-gray-600 border-t border-gray-200/60 pt-2">
                  <p>
                    Location:{' '}
                    <span className="font-bold text-gray-900">
                      {meter.rooms ? `Room ${meter.rooms.room_number}` : 'Common Area'}
                      {meter.bed_label ? ` · Bed ${meter.bed_label}` : ''}
                    </span>
                  </p>
                  <p>
                    Occupant / Billed To:{' '}
                    {meter.active_resident ? (
                      <span className="font-bold text-emerald-800">
                        {meter.active_resident.full_name}
                      </span>
                    ) : meter.is_bed_meter ? (
                      <span className="text-amber-700 font-semibold">Bed Vacant</span>
                    ) : (
                      <span className="font-semibold text-gray-900">Equal Room Split</span>
                    )}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-500 text-[11px]">Latest Baseline:</span>
                    <span className="font-mono font-bold text-gray-900 text-xs">
                      {meter.latest_reading || 0} kWh
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-semibold">
                    ₹{(meter.rate_per_unit_paise / 100).toFixed(2)}/u
                  </span>
                  <Link
                    href={`/dashboard/electricity/reading?meter=${meter.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95"
                  >
                    Enter Reading →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-2">
              <Gauge className="w-8 h-8 text-gray-300 mx-auto" />
              <h4 className="text-xs font-bold text-gray-800">No Sub-Meters Configured</h4>
              <p className="text-[11px] text-gray-400">Add digital sub-meters to track bed &amp; room electricity usage.</p>
              <Link
                href="/dashboard/electricity/new-meter"
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Meter
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Reading History */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-gray-900">Reading History &amp; Differential Allocation Log</h2>

        {/* 1. Mobile Cards View */}
        <div className="block md:hidden space-y-2.5">
          {readings && readings.length > 0 ? (
            readings.map((r: any) => (
              <div key={r.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-yellow-600 block">
                      Meter {r.electricity_meters?.meter_number ?? '—'}
                      {r.bed_label ? ` · Bed ${r.bed_label}` : ''}
                    </span>
                    <p className="font-bold text-xs text-gray-900 mt-0.5">
                      {r.electricity_meters?.rooms?.room_number ? `Room ${r.electricity_meters.rooms.room_number}` : 'Common Meter'}
                      {r.billed_resident_names?.length > 0 ? ` (${r.billed_resident_names.join(', ')})` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-green-600">{formatCurrency(r.total_paise)}</span>
                    <span className="text-[10px] text-gray-400 block">{formatDate(r.reading_date)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded-xl border border-gray-100 text-center">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Prev → Curr</span>
                    <span className="font-mono text-gray-700 font-bold">{r.previous_reading} → {r.current_reading}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Differential</span>
                    <span className="font-extrabold text-yellow-700">{r.units_consumed} kWh</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Rate / Unit</span>
                    <span className="font-semibold text-gray-700">₹{(r.rate_per_unit_paise / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
              No electricity readings logged yet.
            </div>
          )}
        </div>

        {/* 2. Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Meter #</th>
                <th className="py-3 px-3">Room &amp; Bed</th>
                <th className="py-3 px-3">Billed Resident</th>
                <th className="py-3 px-3 text-right">Previous Reading</th>
                <th className="py-3 px-3 text-right">Current Reading</th>
                <th className="py-3 px-3 text-right">Differential Units</th>
                <th className="py-3 px-3 text-right">Rate / Unit</th>
                <th className="py-3 px-3 text-right">Total Billed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {readings && readings.length > 0 ? (
                readings.map((r: any) => (
                  <tr key={r.id} className="hover:bg-yellow-50/20 transition-colors">
                    <td className="py-3 px-3 text-gray-700">{formatDate(r.reading_date)}</td>
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {r.electricity_meters?.meter_number ?? '—'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-800">
                      {r.electricity_meters?.rooms?.room_number ? `Room ${r.electricity_meters.rooms.room_number}` : 'Common'}
                      {r.bed_label ? ` · Bed ${r.bed_label}` : ''}
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      {r.billed_resident_names?.length > 0 ? (
                        <span className="font-bold text-emerald-800">{r.billed_resident_names.join(', ')}</span>
                      ) : (
                        <span className="text-gray-400">Baseline / Vacant</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-gray-600">{r.previous_reading}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">{r.current_reading}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-yellow-700">{r.units_consumed} kWh</td>
                    <td className="py-3 px-3 text-right text-gray-700">₹{(r.rate_per_unit_paise / 100).toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-green-700 text-sm">
                      {formatCurrency(r.total_paise)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-gray-400">
                    <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="font-bold text-gray-800 text-xs">No Electricity Readings Logged Yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Record meter units to automatically compute differential units and bill residents.</p>
                    <Link
                      href="/dashboard/electricity/reading"
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-gray-950 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" /> Record Reading
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
