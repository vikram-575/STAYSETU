'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Gauge, Zap, BedDouble, Users, ArrowRight,
  Filter, Search, Calculator, CheckCircle2, ChevronRight
} from 'lucide-react'
import { MeterDetailsModal } from './meter-details-modal'

interface ElectricityClientViewProps {
  meters: any[]
}

export function ElectricityClientView({ meters }: ElectricityClientViewProps) {
  const [selectedMeter, setSelectedMeter] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'bed' | 'room'>('all')

  const filteredMeters = meters.filter((meter) => {
    // Filter type
    if (filterType === 'bed' && !meter.is_bed_meter) return false
    if (filterType === 'room' && meter.is_bed_meter) return false

    // Search query
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const meterNum = String(meter.meter_number || '').toLowerCase()
    const roomNum = String(meter.rooms?.room_number || '').toLowerCase()
    const bedLabel = String(meter.bed_label || '').toLowerCase()
    const residentName = String(meter.active_resident?.full_name || '').toLowerCase()
    const residentPhone = String(meter.active_resident?.phone || '').toLowerCase()

    return (
      meterNum.includes(q) ||
      roomNum.includes(q) ||
      bedLabel.includes(q) ||
      residentName.includes(q) ||
      residentPhone.includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search meter number, room, bed, or resident..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({meters.length})
          </button>
          <button
            onClick={() => setFilterType('bed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterType === 'bed'
                ? 'bg-white text-yellow-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bed-Wise ({meters.filter((m) => m.is_bed_meter).length})
          </button>
          <button
            onClick={() => setFilterType('room')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterType === 'room'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Room-Shared ({meters.filter((m) => !m.is_bed_meter).length})
          </button>
        </div>
      </div>

      {/* Helper Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-yellow-50/70 border border-yellow-200/80 rounded-xl text-xs text-yellow-900">
        <span className="flex items-center gap-1.5 font-medium">
          <Zap className="w-3.5 h-3.5 text-yellow-600 fill-current shrink-0" />
          Click any meter box to view bed-wise readings, occupant stay history &amp; mid-month pro-rata calculations.
        </span>
        <span className="text-[11px] text-yellow-700 font-bold hidden sm:inline">
          {filteredMeters.length} shown
        </span>
      </div>

      {/* Meter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredMeters.length > 0 ? (
          filteredMeters.map((meter: any) => {
            const hasMidMonth = meter.pro_rata_preview?.hasMidMonthMovement
            const roomResidentsCount = meter.room_residents?.length || 0

            return (
              <div
                key={meter.id}
                onClick={() => setSelectedMeter(meter)}
                className="group relative p-4 rounded-2xl border border-gray-200 hover:border-yellow-400 bg-white hover:bg-yellow-50/10 hover:shadow-md transition-all duration-200 cursor-pointer space-y-3 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-yellow-500/15 text-yellow-700 flex items-center justify-center font-bold shrink-0 group-hover:bg-yellow-500 group-hover:text-gray-950 transition-colors">
                        <Gauge className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-mono font-bold text-sm text-gray-900 group-hover:text-yellow-900 transition-colors">
                            Meter {meter.meter_number}
                          </h3>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">
                          {meter.is_bed_meter ? `Bed ${meter.bed_label || 'A'} Sub-Meter` : `${meter.meter_type} meter`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shrink-0 ${
                        meter.is_bed_meter
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {meter.is_bed_meter ? `Bed ${meter.bed_label || 'A'}` : 'Room Shared'}
                    </span>
                  </div>

                  {/* Mid-Month Movement Indicator Tag */}
                  {hasMidMonth && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold">
                      <Calculator className="w-3 h-3 text-amber-600" />
                      Mid-Month Move-In Detected (Pro-Rata Active)
                    </div>
                  )}

                  {/* Details Block */}
                  <div className="text-xs space-y-1.5 text-gray-600 border-t border-gray-100 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Location:</span>
                      <span className="font-bold text-gray-900">
                        {meter.rooms ? `Room ${meter.rooms.room_number}` : 'Common Area'}
                        {meter.bed_label ? ` · Bed ${meter.bed_label}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Occupant / Split:</span>
                      {meter.active_resident ? (
                        <span className="font-bold text-emerald-800 truncate max-w-[150px]">
                          {meter.active_resident.full_name}
                        </span>
                      ) : meter.is_bed_meter ? (
                        <span className="text-amber-700 font-semibold">Bed Vacant</span>
                      ) : roomResidentsCount > 0 ? (
                        <span className="font-bold text-gray-900">
                          {roomResidentsCount} Roommate{roomResidentsCount > 1 ? 's' : ''} (Stay-Split)
                        </span>
                      ) : (
                        <span className="text-gray-400">No active occupants</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-gray-500 text-[11px]">Latest Baseline:</span>
                      <span className="font-mono font-black text-gray-900 text-xs">
                        {meter.latest_reading || 0} kWh
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA Actions */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs gap-2">
                  <span className="text-[11px] font-bold text-gray-500">
                    ₹{(meter.rate_per_unit_paise / 100).toFixed(2)}/u
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-yellow-700 group-hover:text-yellow-800 flex items-center gap-0.5">
                      View Beds &amp; Split
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <Link
                      href={`/dashboard/electricity/reading?meter=${meter.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-bold px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-950 rounded-lg transition active:scale-95 flex items-center gap-1 shadow-2xs"
                      title="Directly enter new meter reading"
                    >
                      <Zap className="w-3 h-3 fill-current" /> Reading
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-2">
            <Gauge className="w-8 h-8 text-gray-300 mx-auto" />
            <h4 className="text-xs font-bold text-gray-800">No Matching Sub-Meters Found</h4>
            <p className="text-[11px] text-gray-400">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>

      {/* Drill-down Modal */}
      {selectedMeter && (
        <MeterDetailsModal
          meter={selectedMeter}
          onClose={() => setSelectedMeter(null)}
        />
      )}
    </div>
  )
}
