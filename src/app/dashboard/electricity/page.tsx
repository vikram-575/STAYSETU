import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import {
  Zap, Plus, History, CheckCircle2, AlertTriangle,
  RotateCcw, Scale, ArrowRight, Gauge
} from 'lucide-react'

export default async function ElectricityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  const orgId = profile.organization_id

  // Meters list with linked rooms
  const { data: meters } = await supabase
    .from('electricity_meters')
    .select('*, rooms(*, floors(*, buildings(*)))')
    .eq('organization_id', orgId)
    .order('meter_number')

  // Readings history
  const { data: readings } = await supabase
    .from('electricity_readings')
    .select('*, electricity_meters(*, rooms(*))')
    .eq('organization_id', orgId)
    .order('reading_date', { ascending: false })
    .limit(20)

  // Total consumption this month
  const totalUnits = readings?.reduce((s, r) => s + (r.units_consumed || 0), 0) || 0
  const totalAmountPaise = readings?.reduce((s, r) => s + (r.total_paise || 0), 0) || 0

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Electricity Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Per-unit billing · Sub-meter readings · Room-based & equal split allocations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/electricity/new-meter"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> Add Sub-Meter
          </Link>
          <Link
            href="/dashboard/electricity/reading"
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Zap className="w-4 h-4" /> Record New Reading
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500">Active Meters</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{meters?.length || 0}</p>
          <p className="text-[10px] text-gray-400">Room & main sub-meters</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm bg-yellow-50/20">
          <p className="text-[10px] uppercase font-bold text-yellow-700">Units Recorded</p>
          <p className="text-xl font-extrabold text-yellow-800 mt-0.5">{totalUnits.toLocaleString('en-IN')} kWh</p>
          <p className="text-[10px] text-yellow-600">Total consumption</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm bg-green-50/20">
          <p className="text-[10px] uppercase font-bold text-green-700">Total Electricity Value</p>
          <p className="text-xl font-extrabold text-green-800 mt-0.5">{formatCurrency(totalAmountPaise)}</p>
          <p className="text-[10px] text-green-600">Calculated billings</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500">Default Allocation</p>
          <p className="text-base font-bold text-gray-900 mt-1">Equal Split</p>
          <p className="text-[10px] text-gray-400">Per room residents</p>
        </div>
      </div>

      {/* Meters List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Configured Electricity Meters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meters && meters.length > 0 ? (
            meters.map((meter: any) => (
              <div key={meter.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">Meter {meter.meter_number}</h3>
                      <p className="text-[11px] text-gray-500 uppercase">{meter.meter_type} meter</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded-full uppercase">
                    Active
                  </span>
                </div>

                <div className="text-xs space-y-1 text-gray-600 border-t pt-2">
                  <p>
                    Location:{' '}
                    <span className="font-semibold text-gray-900">
                      {meter.rooms ? `Room ${meter.rooms.room_number}` : 'Common / Main Area'}
                    </span>
                  </p>
                  <p>
                    Allocation:{' '}
                    <span className="font-semibold text-gray-900">
                      {meter.allocation_method.replace('_', ' ')}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <Link
                    href={`/dashboard/electricity/reading?meter=${meter.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Enter Reading →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-gray-400 text-xs">
              No meters added yet. Click &quot;Add Sub-Meter&quot; above to create one.
            </div>
          )}
        </div>
      </div>

      {/* Reading History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900">Reading History & Allocation Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Meter #</th>
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3 text-right">Previous Reading</th>
                <th className="py-3 px-3 text-right">Current Reading</th>
                <th className="py-3 px-3 text-right">Units Consumed</th>
                <th className="py-3 px-3 text-right">Rate / Unit</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
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
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No electricity readings logged yet.
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
