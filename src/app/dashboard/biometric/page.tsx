'use client'

import { useState, useEffect } from 'react'
import {
  ShieldAlert, CheckCircle2, AlertCircle, Clock, Wifi,
  Users, UserX, BellRing, Plus, Play, Loader2, ArrowRight
} from 'lucide-react'

export default function BiometricTurnstilePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/biometric')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSimulatePunch = async (isLate: boolean) => {
    try {
      setSimulating(true)
      const res = await fetch('/api/erp/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentName: isLate ? 'Rohan Deshmukh' : 'Shreya Patil',
          roomNumber: isLate ? '304-A' : '102-B',
          direction: 'IN',
          isLate,
        }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch {} finally {
      setSimulating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              HARDWARE IOT
            </span>
            <h1 className="text-xl font-black text-gray-900">Biometric & RFID Turnstile Cloud Sync</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Cloud integration with eSSL, Realtime, and Hikvision turnstiles. Automated 10:00 PM curfew violation detection and parent SMS alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulatePunch(false)}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            <span>Test Normal Entry</span>
          </button>
          <button
            onClick={() => handleSimulatePunch(true)}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Simulate Late Curfew Breach</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Connected Devices</span>
          <div className="flex items-center gap-2 mt-1">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <p className="text-lg font-black text-gray-900">{data?.summary?.onlineDevices || 0} / {data?.summary?.totalDevices || 0} Online</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-rose-500 font-bold uppercase block">Curfew Violations (&gt;10 PM)</span>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-rose-600" />
            <p className="text-lg font-black text-rose-600">{data?.summary?.curfewViolationsCount || 0} Flagged</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Today&apos;s Total Punches</span>
          <p className="text-lg font-black text-gray-900 mt-1">{data?.summary?.totalPunchesToday || 0} Logs</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Parent Alerts Sent</span>
          <div className="flex items-center gap-2 mt-1">
            <BellRing className="w-4 h-4 text-blue-600" />
            <p className="text-lg font-black text-blue-700">{data?.summary?.curfewViolationsCount || 0} Dispatched</p>
          </div>
        </div>
      </div>

      {/* Connected Hardware Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.devices?.map((dev: any) => (
          <div key={dev.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-900">{dev.name}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
              <div>
                <span className="text-gray-400 block text-[10px]">IP Address:</span>
                <strong className="font-mono text-gray-800">{dev.ipAddress}</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Hardware Protocol:</span>
                <strong className="text-gray-800">{dev.protocol}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Punch Stream Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-800">Real-Time Access Control Log</h3>
          <span className="text-[11px] text-gray-500">Auto-syncs with physical turnstiles every 30 seconds</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Resident</th>
                <th className="p-3">Room</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Scanner Device</th>
                <th className="p-3">Curfew Status</th>
                <th className="p-3">Parent Notification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {data?.punches?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition">
                  <td className="p-3 font-mono text-[11px] text-gray-600">
                    {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3 font-bold text-gray-900">{p.residentName}</td>
                  <td className="p-3 text-gray-600">{p.roomNumber}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      p.direction === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.direction}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-[11px]">{p.deviceName}</td>
                  <td className="p-3">
                    {p.isCurfewViolation ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> LATE ENTRY (&gt;10 PM)
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold">✓ Within Timings</span>
                    )}
                  </td>
                  <td className="p-3 text-[11px]">
                    {p.parentAlertSent ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <BellRing className="w-3 h-3" /> WhatsApp Sent to Parent
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
