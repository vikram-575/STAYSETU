'use client'

import { useState, useEffect } from 'react'
import {
  Users, UserCheck, Clock, DollarSign, Phone,
  Calendar, Shield, Plus, FileText, Download, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function StaffPayrollPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'roster' | 'payroll'>('roster')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/staff')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              HUMAN RESOURCES
            </span>
            <h1 className="text-xl font-black text-gray-900">Shift Roster & Staff Payroll Calculator</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage wardens, cooks, guards, and housekeeping shifts, track advances, and calculate net take-home salary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Monthly Pay Register</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Active Staff</span>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {data?.summary?.activeOnDuty || 0} Employees
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Shift Coverage</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Net Monthly Salary Payout</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(data?.summary?.totalMonthlyPayrollPaise || 0)}
          </p>
          <span className="text-[10px] text-gray-500 font-semibold">Post PF & Advance deductions</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Current Shift Coverage</span>
          <p className="text-2xl font-black text-blue-700 mt-1">3 Shifts / 24 hrs</p>
          <span className="text-[10px] text-blue-600 font-semibold">Morning, Day & Night Guard</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'roster'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Shift Duty Roster ({data?.staff?.length || 0} Staff)
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'payroll'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Monthly Salary & PF Ledger
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        </div>
      ) : activeTab === 'roster' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.staff?.map((s: any) => (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {s.role}
                  </span>
                  <h3 className="text-sm font-black text-gray-900 mt-1">{s.name}</h3>
                  <a href={`tel:${s.phone}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {s.phone}
                  </a>
                </div>

                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ● On Duty
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Assigned Shift:</span>
                  <strong className="text-gray-800">{s.shift}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Base Monthly Salary:</span>
                  <strong className="text-gray-900">₹{s.baseSalaryRupees?.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Overtime This Month:</span>
                  <span className="font-semibold text-emerald-700">{s.overtimeHours} hrs (+₹{s.overtimePayRupees})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Payroll Table */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-right">Base Salary</th>
                  <th className="p-3 text-right">Overtime Pay</th>
                  <th className="p-3 text-right">Advance Taken</th>
                  <th className="p-3 text-right">PF (12%)</th>
                  <th className="p-3 text-right">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data?.staff?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-3 font-bold text-gray-900">{s.name}</td>
                    <td className="p-3 text-gray-600">{s.role}</td>
                    <td className="p-3 text-right font-mono">₹{s.baseSalaryRupees?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-emerald-700">+₹{s.overtimePayRupees}</td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {s.advanceRupees > 0 ? `-₹${s.advanceRupees?.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-500">-₹{s.pfDeductionRupees?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-black text-sm text-emerald-800">
                      ₹{s.netPayableRupees?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
