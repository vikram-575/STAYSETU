'use client'

import { useState, useEffect } from 'react'
import {
  Wrench, AlertTriangle, CheckCircle2, Clock, Phone,
  Calendar, ShieldCheck, Plus, Check, Loader2, ArrowRight
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function MaintenancePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [servicingId, setServicingId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/maintenance')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCompleteService = async (assetId: string) => {
    try {
      setServicingId(assetId)
      const res = await fetch('/api/erp/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_service', assetId }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch {} finally {
      setServicingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              FACILITY MGMT
            </span>
            <h1 className="text-xl font-black text-gray-900">Preventive Maintenance & AMC Scheduler</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated service schedules for ACs, RO plants, lifts, and generators to avoid sudden downtime.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Equipment Under AMC</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{data?.summary?.totalAssets || 0} Assets</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-rose-500 font-bold uppercase block">Service Due / Overdue</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{data?.summary?.dueCount || 0} Attention Required</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-emerald-600 font-bold uppercase block">Healthy & Serviced</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{data?.summary?.healthyCount || 0} Operational</p>
        </div>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.assets?.map((ast: any) => {
            const isDue = ast.status === 'service_due'
            return (
              <div
                key={ast.id}
                className={`bg-white rounded-2xl p-5 border shadow-2xs space-y-3 transition ${
                  isDue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      {ast.category}
                    </span>
                    <h3 className="text-sm font-black text-gray-900 mt-1">{ast.name}</h3>
                    <p className="text-[11px] text-gray-500">{ast.location}</p>
                  </div>

                  {isDue ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <AlertTriangle className="w-3 h-3" /> SERVICE DUE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Operational
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Last Serviced:</span>
                    <strong className="text-gray-800">{ast.lastServicedDate}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Next Due Date:</span>
                    <strong className={isDue ? 'text-rose-600 font-black' : 'text-gray-800'}>
                      {ast.nextServiceDueDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">AMC Vendor:</span>
                    <span className="font-semibold text-gray-800">{ast.vendorName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Vendor Phone:</span>
                    <a
                      href={`tel:${ast.vendorPhone}`}
                      className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> {ast.vendorPhone}
                    </a>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Est. Service Cost: <strong>{formatCurrency(ast.costPaise)}</strong>
                  </span>

                  <button
                    onClick={() => handleCompleteService(ast.id)}
                    disabled={servicingId === ast.id}
                    className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#14532D] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {servicingId === ast.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Mark Serviced Today</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
