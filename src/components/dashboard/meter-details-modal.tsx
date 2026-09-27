'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  X, Gauge, Zap, BedDouble, Users, Calendar,
  ArrowRight, Calculator, CheckCircle2, AlertCircle, Clock,
  DollarSign, ChevronRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import { calculateProRataElectricitySplit } from '@/lib/electricity-helper'

interface MeterDetailsModalProps {
  meter: any
  onClose: () => void
}

export function MeterDetailsModal({ meter, onClose }: MeterDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'beds' | 'prorata' | 'history'>('beds')

  // Pro-rata simulator state
  const [simUnits, setSimUnits] = useState<number>(100)
  const [simRate, setSimRate] = useState<number>(meter.rate_per_unit_paise ? meter.rate_per_unit_paise / 100 : 10)

  const roomBeds = meter.room_beds || []
  const roomResidents = meter.room_residents || []
  const meterReadings = meter.meter_readings || []

  const now = new Date()
  const periodMonth = now.getMonth() + 1
  const periodYear = now.getFullYear()

  // Live simulation calculation based on active residents in this room
  const proRataResult = useMemo(() => {
    return calculateProRataElectricitySplit({
      totalUnits: simUnits,
      ratePerUnitPaise: Math.round(simRate * 100),
      periodMonth,
      periodYear,
      residents: roomResidents,
    })
  }, [simUnits, simRate, periodMonth, periodYear, roomResidents])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-3 bg-gradient-to-r from-gray-50 via-yellow-50/20 to-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-yellow-500 text-gray-950 flex items-center justify-center shadow-xs shrink-0 font-black">
              <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-gray-900 font-mono">
                  Meter {meter.meter_number}
                </h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                    meter.is_bed_meter ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {meter.is_bed_meter ? `Bed ${meter.bed_label || 'A'} Dedicated` : 'Room Shared'}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                  {meter.meter_type}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Location:{' '}
                <strong className="text-gray-900">
                  {meter.rooms ? `Room ${meter.rooms.room_number}` : 'Common Area'}
                  {meter.bed_label ? ` · Bed ${meter.bed_label}` : ''}
                </strong>
                {meter.rooms?.floors && (
                  <span className="text-gray-400">
                    {' '}({meter.rooms.floors.name || 'Floor'}
                    {meter.rooms.floors.buildings ? ` · ${meter.rooms.floors.buildings.name}` : ''})
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-gray-50/80 border-b border-gray-100 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Latest Baseline</span>
            <span className="font-mono font-black text-gray-900 text-sm">
              {meter.latest_reading || 0} kWh
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Tariff Rate</span>
            <span className="font-semibold text-gray-900 text-sm">
              ₹{(meter.rate_per_unit_paise / 100).toFixed(2)}/u
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Room Beds</span>
            <span className="font-bold text-gray-900 text-sm">{roomBeds.length} Beds</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Active Occupants</span>
            <span className="font-bold text-emerald-800 text-sm">{roomResidents.length} Residents</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab('beds')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'beds'
                ? 'bg-[#14532D] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Room Beds &amp; Occupants ({roomBeds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('prorata')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'prorata'
                ? 'bg-yellow-500 text-gray-950 shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Mid-Month Usage Calculator</span>
            {proRataResult.hasMidMonthMovement && (
              <span className="ml-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Readings Log ({meterReadings.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: Room Beds & Occupants */}
          {activeTab === 'beds' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                  Room {meter.rooms?.room_number || ''} Bed Inventory &amp; Live Meter Status
                </h4>
                <span className="text-[11px] text-gray-500 font-medium">
                  {roomResidents.length} occupied · {roomBeds.length - roomResidents.length} available
                </span>
              </div>

              {roomBeds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roomBeds.map((bed: any) => {
                    const isOccupied = bed.is_occupied || Boolean(bed.resident)
                    return (
                      <div
                        key={bed.id}
                        className={`p-4 rounded-2xl border transition ${
                          isOccupied
                            ? 'bg-white border-gray-200 shadow-2xs'
                            : 'bg-gray-50/60 border-dashed border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isOccupied ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {bed.bed_label}
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-gray-900">Bed {bed.bed_label}</h5>
                              <p className="text-[10px] text-gray-400">
                                Rent: {formatCurrency(bed.base_rent_paise || 600000)}/mo
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isOccupied
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {isOccupied ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>

                        {bed.resident ? (
                          <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-[11px]">Resident:</span>
                              <strong className="text-gray-900 font-bold">{bed.resident.full_name}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-[11px]">Phone:</span>
                              <span className="font-mono text-gray-700">{bed.resident.phone || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-[11px]">Checked In:</span>
                              <span className="font-medium text-gray-900">{formatDate(bed.resident.check_in_date)}</span>
                            </div>
                            <div className="mt-2 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-medium">
                              ⚡ Linked to Meter {meter.meter_number} (Differential billing active)
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-2.5 border-t border-gray-200/60 text-center py-2">
                            <p className="text-xs text-gray-400">Bed is available</p>
                            <Link
                              href="/dashboard/residents/new"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14532D] hover:underline mt-1"
                            >
                              + Check In Resident to Bed {bed.bed_label}
                            </Link>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  No beds registered for this room yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Mid-Month Usage & Pro-Rata Bill Calculator */}
          {activeTab === 'prorata' && (
            <div className="space-y-4">
              {/* Formula & Rule Explanatory Card */}
              <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600 fill-current" />
                  <h4 className="text-xs sm:text-sm font-black text-gray-900">
                    Mid-Month Move-In Bill Adjustment Formula
                  </h4>
                </div>
                <p className="text-xs text-yellow-950 leading-relaxed">
                  When a resident uses the room from the <strong>start of the month</strong> and another resident <strong>shifts in mid-month</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-white/90 rounded-xl border border-yellow-200/80">
                    <span className="font-black text-yellow-800 block text-[11px] uppercase mb-0.5">
                      1. Solo Extra Days (100% Paid by Early Occupant)
                    </span>
                    <p className="text-gray-700 text-[11px]">
                      The days before the new roommate shifted in were used solely by the first resident. Those days are charged <strong>100% to him alone</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-white/90 rounded-xl border border-yellow-200/80">
                    <span className="font-black text-yellow-800 block text-[11px] uppercase mb-0.5">
                      2. Shared Days (Divided 50/50 Equally)
                    </span>
                    <p className="text-gray-700 text-[11px]">
                      For the remaining days when both roommates were living together, the usage is <strong>divided equally</strong> between both.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Simulator */}
              <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-gray-500" />
                    Live Room Bill Split Simulator (Current Billing Month)
                  </h5>
                  <span className="text-[11px] font-mono text-gray-400">
                    {periodMonth}/{periodYear} · {proRataResult.daysInMonth} Days
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Room Differential Consumption (kWh Units)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={simUnits}
                      onChange={(e) => setSimUnits(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Tariff Rate per Unit (₹/kWh)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={simRate}
                      onChange={(e) => setSimRate(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Total Room Electricity Amount:</span>
                  <span className="font-black text-gray-900 text-sm">
                    {formatCurrency(proRataResult.totalPaise)}
                  </span>
                </div>

                {/* Resident Split Output Table */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-500 block uppercase">
                    Calculated Breakdown Per Resident
                  </span>

                  {proRataResult.allocations.length > 0 ? (
                    <div className="space-y-2">
                      {proRataResult.allocations.map((alloc) => (
                        <div
                          key={alloc.resident_id}
                          className="p-3 bg-gray-50 hover:bg-yellow-50/30 rounded-xl border border-gray-200 transition space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-xs font-bold text-gray-900">{alloc.resident_name}</strong>
                              <p className="text-[10px] text-gray-500">
                                Bed {alloc.bed_label || 'A'} · Checked In: {formatDate(alloc.check_in_date)} ·{' '}
                                <strong className="text-gray-800">{alloc.active_days} days active</strong>
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
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400">
                      No active residents currently assigned to this room.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Readings Log History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Recorded Readings for Meter {meter.meter_number}
              </h4>

              {meterReadings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Prev</th>
                        <th className="py-2.5 px-3 text-right">Current</th>
                        <th className="py-2.5 px-3 text-right">Units</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Total Bill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {meterReadings.map((r: any) => (
                        <tr key={r.id} className="hover:bg-yellow-50/30">
                          <td className="py-2.5 px-3 text-gray-700">{formatDate(r.reading_date)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-600">{r.previous_reading}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">{r.current_reading}</td>
                          <td className="py-2.5 px-3 text-right font-black text-yellow-700">{r.units_consumed} kWh</td>
                          <td className="py-2.5 px-3 text-right text-gray-600">₹{(r.rate_per_unit_paise / 100).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-black text-green-700">
                            {formatCurrency(r.total_paise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-200">
                  No readings logged for this meter yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">
            Click &apos;Record Reading&apos; to enter newly uploaded meter units and automatically apply pro-rata calculation.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <Link
              href={`/dashboard/electricity/reading?meter=${meter.id}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-gray-950 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Zap className="w-4 h-4" /> Record Reading →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
