'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3, TrendingUp, Sparkles, BedDouble,
  Calculator, DollarSign, Layers, ArrowUpRight, Loader2
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [roomsData, setRoomsData] = useState<any[]>([])
  const [occupiedBedsCount, setOccupiedBedsCount] = useState(0)
  const [totalBedsCount, setTotalBedsCount] = useState(0)
  const [totalMonthlyRentPaise, setTotalMonthlyRentPaise] = useState(0)

  // What-If Simulator States
  const [rentIncreaseRupees, setRentIncreaseRupees] = useState(500)
  const [extraBedsToFill, setExtraBedsToFill] = useState(5)
  const [extraBedAvgRent, setExtraBedAvgRent] = useState(6000)
  const [electricityUnitIncrease, setElectricityUnitIncrease] = useState(2)

  useEffect(() => {
    async function loadData() {
      // Fetch rooms with beds
      const { data: rooms } = await supabase
        .from('rooms')
        .select('*, floors(*, buildings(*)), beds(*, resident_assignments(*))')

      if (rooms) {
        let occupied = 0
        let total = 0
        let totalRent = 0

        rooms.forEach((rm) => {
          rm.beds?.forEach((b: any) => {
            total++
            if (b.status === 'occupied') {
              occupied++
              const activeAssign = b.resident_assignments?.find((a: any) => !a.check_out_date)
              if (activeAssign) totalRent += activeAssign.monthly_rent_paise || 0
            }
          })
        })

        setRoomsData(rooms)
        setOccupiedBedsCount(occupied)
        setTotalBedsCount(total)
        setTotalMonthlyRentPaise(totalRent)
      }
      setLoading(false)
    }
    loadData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading analytics & intelligence...
      </div>
    )
  }

  // What-If Calculations
  const currentMonthlyRent = totalMonthlyRentPaise / 100
  const projectedRentIncreaseMonthly = occupiedBedsCount * rentIncreaseRupees
  const projectedNewRentMonthly = currentMonthlyRent + projectedRentIncreaseMonthly
  const projectedRentIncreaseAnnual = projectedRentIncreaseMonthly * 12

  const extraBedsRevenueMonthly = extraBedsToFill * extraBedAvgRent
  const extraBedsRevenueAnnual = extraBedsRevenueMonthly * 12

  const vacantBedsCount = totalBedsCount - occupiedBedsCount
  const avgRentPerBed = occupiedBedsCount > 0 ? Math.round(currentMonthlyRent / occupiedBedsCount) : 6000
  const vacancyPotentialMonthly = vacantBedsCount * avgRentPerBed

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Analytics & What-If Simulator</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Data-driven business intelligence · Interactive revenue forecasting · Room yield analysis
        </p>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500">Monthly Contracted Rent</p>
          <p className="text-xl font-extrabold text-blue-900 mt-0.5">₹{currentMonthlyRent.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gray-400">From {occupiedBedsCount} active beds</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-green-600">Annualized Run Rate</p>
          <p className="text-xl font-extrabold text-green-800 mt-0.5">₹{(currentMonthlyRent * 12).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-green-600 font-semibold">12-month projection</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
          <p className="text-[10px] uppercase font-bold text-purple-600">Average Revenue / Bed</p>
          <p className="text-xl font-extrabold text-purple-800 mt-0.5">₹{avgRentPerBed.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-purple-500">Yield per occupied bed</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm bg-orange-50/20">
          <p className="text-[10px] uppercase font-bold text-orange-600">Vacancy Revenue Potential</p>
          <p className="text-xl font-extrabold text-orange-800 mt-0.5">₹{vacancyPotentialMonthly.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-orange-500">{vacantBedsCount} vacant beds opportunity</p>
        </div>
      </div>

      {/* What-If Simulator Section */}
      <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-base font-bold text-gray-900">Owner &quot;What-If&quot; Revenue Simulator</h2>
            <p className="text-xs text-gray-500">
              Simulate rent increases, occupancy optimizations, and tariff changes instantly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulation 1: Rent Increase */}
          <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-blue-900">Scenario 1: Increase Rent across all Beds</h3>
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                <span>Rent Increase per Bed:</span>
                <span className="text-blue-700">₹{rentIncreaseRupees} / month</span>
              </div>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={rentIncreaseRupees}
                onChange={(e) => setRentIncreaseRupees(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="p-3 bg-white border border-blue-100 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Monthly Revenue:</span>
                <span className="font-bold text-gray-900">₹{currentMonthlyRent.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-blue-700 font-bold">
                <span>Projected New Monthly:</span>
                <span>₹{projectedNewRentMonthly.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-green-700 font-extrabold pt-1 border-t">
                <span>Additional Monthly Gain:</span>
                <span>+₹{projectedRentIncreaseMonthly.toLocaleString('en-IN')} / mo</span>
              </div>
              <div className="flex justify-between text-green-800 font-black">
                <span>Annualized Extra Profit:</span>
                <span>+₹{projectedRentIncreaseAnnual.toLocaleString('en-IN')} / year</span>
              </div>
            </div>
          </div>

          {/* Simulation 2: Fill Vacant Beds */}
          <div className="p-5 bg-green-50/50 border border-green-200 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-green-900">Scenario 2: Fill Additional Vacant Beds</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Additional Beds Filled</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, vacantBedsCount)}
                  value={extraBedsToFill}
                  onChange={(e) => setExtraBedsToFill(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Average Bed Rent (₹)</label>
                <input
                  type="number"
                  min={1000}
                  value={extraBedAvgRent}
                  onChange={(e) => setExtraBedAvgRent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-white border border-green-100 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between text-green-700 font-extrabold">
                <span>Additional Monthly Inflow:</span>
                <span>+₹{extraBedsRevenueMonthly.toLocaleString('en-IN')} / mo</span>
              </div>
              <div className="flex justify-between text-green-800 font-black pt-1 border-t">
                <span>Annualized Additional Inflow:</span>
                <span>+₹{extraBedsRevenueAnnual.toLocaleString('en-IN')} / year</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Profitability Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900">Room Yield & Occupancy Profitability</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                <th className="py-3 px-3">Room</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Capacity</th>
                <th className="py-3 px-3">Occupied</th>
                <th className="py-3 px-3">Occupancy Rate</th>
                <th className="py-3 px-3 text-right">Base Rent</th>
                <th className="py-3 px-3 text-right">Monthly Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {roomsData.map((rm) => {
                const totalB = rm.beds?.length || 0
                const occB = rm.beds?.filter((b: any) => b.status === 'occupied').length || 0
                const occPct = totalB > 0 ? Math.round((occB / totalB) * 100) : 0
                const monthlyYield = rm.beds?.reduce((sum: number, b: any) => {
                  const active = b.resident_assignments?.find((a: any) => !a.check_out_date)
                  return sum + (active?.monthly_rent_paise || 0)
                }, 0) || 0

                return (
                  <tr key={rm.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-gray-900">Room {rm.room_number}</td>
                    <td className="py-3 px-3 text-gray-600">{rm.floors?.buildings?.name} · {rm.floors?.name}</td>
                    <td className="py-3 px-3 text-gray-700">{totalB} Beds</td>
                    <td className="py-3 px-3 font-bold text-green-700">{occB} Beds</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        occPct === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {occPct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      {rm.base_rent_paise ? formatCurrency(rm.base_rent_paise) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-blue-700 text-sm">
                      {formatCurrency(monthlyYield)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
