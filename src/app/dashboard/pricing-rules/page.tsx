'use client'

import { useState, useEffect } from 'react'
import {
  Tag, Percent, Sparkles, CheckCircle2, TrendingUp,
  AlertCircle, Calculator, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function PricingRulesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Calculator State
  const [baseRent, setBaseRent] = useState(10000)
  const [tenureMonths, setTenureMonths] = useState(6)
  const [occupancy, setOccupancy] = useState(92)
  const [calcResult, setCalcResult] = useState<any>(null)
  const [calculating, setCalculating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/pricing-rules')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  const runSimulation = async () => {
    try {
      setCalculating(true)
      const res = await fetch('/api/erp/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          baseRentRupees: baseRent,
          tenureMonths,
          occupancyPercent: occupancy,
        }),
      })
      const json = await res.json()
      if (res.ok) setCalcResult(json.calculation)
    } catch {} finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    fetchData()
    runSimulation()
  }, [])

  const handleToggle = async (ruleId: string) => {
    try {
      const res = await fetch('/api/erp/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', ruleId }),
      })
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          rules: prev.rules.map((r: any) =>
            r.id === ruleId ? { ...r, isActive: !r.isActive } : r
          ),
        }))
        runSimulation()
      }
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              REVENUE AUTOMATION
            </span>
            <h1 className="text-xl font-black text-gray-900">Dynamic Tariff & Seasonal Discount Rules</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure automated upfront payment discounts, peak college admission surges, and high-occupancy pricing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Matrix */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900">Active Pricing Rules</h3>
            <span className="text-xs text-gray-500">{data?.summary?.activeRules || 0} Rules Active</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
            </div>
          ) : (
            data?.rules?.map((rule: any) => (
              <div
                key={rule.id}
                className={`bg-white rounded-2xl p-5 border shadow-2xs space-y-2 transition ${
                  rule.isActive ? 'border-gray-200' : 'border-gray-200/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${
                      rule.adjustmentValue < 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rule.adjustmentValue < 0 ? 'DISCOUNT' : 'SURGE / PREMIUM'}
                    </span>
                    <h4 className="text-xs font-black text-gray-900">{rule.name}</h4>
                  </div>

                  <button
                    onClick={() => handleToggle(rule.id)}
                    className="text-gray-400 hover:text-gray-700 transition"
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-300" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-600">{rule.condition}</p>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                  <span className="text-gray-400">Adjustment:</span>
                  <strong className={rule.adjustmentValue < 0 ? 'text-emerald-700 font-black' : 'text-amber-700 font-black'}>
                    {rule.adjustmentValue > 0 ? '+' : ''}{rule.adjustmentValue}{rule.adjustmentType === 'percentage' ? '%' : ' INR'}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Simulator Widget */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 h-max">
          <div className="flex items-center gap-2 border-b pb-3">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-gray-900">Dynamic Tariff Simulator</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Standard Bed Rent (₹)</label>
              <input
                type="number"
                value={baseRent}
                onChange={(e) => setBaseRent(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Upfront Tenure (Months)</label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value={1}>1 Month (Monthly Standard)</option>
                <option value={3}>3 Months Advance</option>
                <option value={6}>6 Months Advance (Eligible for 5% off)</option>
                <option value={12}>12 Months Annual Advance</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Current PG Occupancy ({occupancy}%)</label>
              <input
                type="range"
                min="50"
                max="100"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <button
              onClick={runSimulation}
              disabled={calculating}
              className="w-full py-2.5 bg-[#16A34A] hover:bg-[#14532D] text-white font-bold rounded-xl shadow-xs transition"
            >
              {calculating ? 'Simulating...' : 'Recalculate Effective Rent'}
            </button>
          </div>

          {calcResult && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Standard Base Rent:</span>
                <span>₹{calcResult.baseRentRupees?.toLocaleString('en-IN')}/mo</span>
              </div>

              {calcResult.appliedDiscounts?.map((d: any, idx: number) => (
                <div key={idx} className="flex justify-between text-emerald-700 font-bold">
                  <span>• {d.name}:</span>
                  <span>{d.discountRupees ? `-₹${d.discountRupees}` : `+₹${d.surgeRupees}`}</span>
                </div>
              ))}

              <hr className="border-gray-200" />

              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-black text-gray-900">Effective Rent:</span>
                <span className="font-black text-lg text-emerald-800">
                  ₹{calcResult.finalRentRupees?.toLocaleString('en-IN')}/mo
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
