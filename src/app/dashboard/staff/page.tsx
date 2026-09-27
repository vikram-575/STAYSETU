'use client'

import { useState, useEffect } from 'react'
import {
  Users, UserCheck, Clock, DollarSign, Phone,
  Calendar, Shield, Plus, FileText, Download, Loader2,
  Trash2, AlertCircle, CheckCircle2, X, PlusCircle, AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function StaffPayrollPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'roster' | 'payroll'>('roster')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState<any | null>(null)
  const [showOvertimeModal, setShowOvertimeModal] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Add Staff Form
  const [form, setForm] = useState({
    name: '',
    role: 'Housekeeping',
    phone: '',
    shift: 'General (9 AM - 6 PM)',
    salaryRupees: 18000,
    notes: '',
  })

  // Quick Action Forms
  const [advanceAmount, setAdvanceAmount] = useState<number>(2000)
  const [overtimeHours, setOvertimeHours] = useState<number>(4)

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

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setActionLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/erp/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: form.name.trim(),
          role: form.role,
          phone: form.phone,
          shift: form.shift,
          salaryRupees: form.salaryRupees,
          notes: form.notes,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        setSuccessMsg(`Staff member ${form.name} enrolled successfully!`)
        setShowAddModal(false)
        setForm({
          name: '',
          role: 'Housekeeping',
          phone: '',
          shift: 'General (9 AM - 6 PM)',
          salaryRupees: 18000,
          notes: '',
        })
        fetchData()
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setErrorMsg(result.error || 'Failed to add staff member.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error adding staff.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRecordAdvance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showAdvanceModal || advanceAmount <= 0) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/erp/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'advance',
          id: showAdvanceModal.id,
          advanceRupees: advanceAmount,
        }),
      })
      if (res.ok) {
        setSuccessMsg(`Recorded ₹${advanceAmount} advance for ${showAdvanceModal.name}.`)
        setShowAdvanceModal(null)
        setAdvanceAmount(2000)
        fetchData()
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch {} finally {
      setActionLoading(false)
    }
  }

  const handleRecordOvertime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showOvertimeModal || overtimeHours <= 0) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/erp/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'overtime',
          id: showOvertimeModal.id,
          overtimeHours: overtimeHours,
        }),
      })
      if (res.ok) {
        setSuccessMsg(`Recorded ${overtimeHours} hours overtime for ${showOvertimeModal.name}.`)
        setShowOvertimeModal(null)
        setOvertimeHours(4)
        fetchData()
        setTimeout(() => setSuccessMsg(''), 4000)
      }
    } catch {} finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (staffId: string) => {
    try {
      await fetch('/api/erp/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status', id: staffId }),
      })
      fetchData()
    } catch {}
  }

  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from active staff?`)) return
    try {
      await fetch('/api/erp/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: staffId }),
      })
      setSuccessMsg(`Staff member ${name} removed.`)
      fetchData()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-screen-2xl">
      {/* Toast Alert */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

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

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Monthly Pay Register</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#14532D] to-[#16A34A] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Active Staff</span>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {data?.summary?.activeOnDuty || 0} Employees
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {data?.summary?.totalStaff > 0 ? `${data.summary.activeOnDuty} On Duty · ${data.summary.onLeave || 0} On Leave` : 'No staff enrolled'}
          </span>
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
          <p className="text-2xl font-black text-blue-700 mt-1">
            {data?.summary?.totalStaff > 0 ? `${data.summary.activeOnDuty} Shifts Active` : '0 Shifts Active'}
          </p>
          <span className="text-[10px] text-blue-600 font-semibold">
            {data?.summary?.totalStaff > 0 ? 'Morning, Day & Night Coverage' : 'Enroll staff to activate shifts'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[#14532D] text-white shadow-2xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Shift Duty Roster ({data?.staff?.length || 0} Staff)
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-[#14532D] text-white shadow-2xs'
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
      ) : !data?.staff || data.staff.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Staff Members Added</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You have not registered any wardens, cooks, security guards, or housekeeping staff yet.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#14532D] to-[#16A34A] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll First Staff Member</span>
          </button>
        </div>
      ) : activeTab === 'roster' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.staff?.map((s: any) => (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-3.5 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {s.role}
                  </span>
                  <h3 className="text-sm font-black text-gray-900 mt-1">{s.name}</h3>
                  {s.phone ? (
                    <a href={`tel:${s.phone}`} className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5 font-medium">
                      <Phone className="w-3 h-3" /> {s.phone}
                    </a>
                  ) : (
                    <span className="text-[10px] text-gray-400">No phone added</span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleStatus(s.id)}
                  title="Click to toggle status"
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition active:scale-95 cursor-pointer ${
                    s.status === 'active'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {s.status === 'active' ? '● On Duty' : '○ On Leave'}
                </button>
              </div>

              <div className="bg-gray-50/80 p-3 rounded-xl space-y-1.5 text-xs border border-gray-100">
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
                  <span className="font-semibold text-emerald-700">{s.overtimeHours || 0} hrs (+₹{s.overtimePayRupees || 0})</span>
                </div>
                {s.advanceRupees > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Advance Taken:</span>
                    <strong className="font-semibold">-₹{s.advanceRupees?.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 pt-1 border-t border-gray-200/60 font-bold">
                  <span>Net Payable:</span>
                  <span className="text-emerald-800">₹{s.netPayableRupees?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-1.5 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAdvanceModal(s)}
                    className="text-[11px] font-bold text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                  >
                    + Advance
                  </button>
                  <button
                    onClick={() => setShowOvertimeModal(s)}
                    className="text-[11px] font-bold text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 transition cursor-pointer"
                  >
                    + Overtime
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteStaff(s.id, s.name)}
                  title="Remove staff member"
                  className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
                  <th className="p-3">Role &amp; Shift</th>
                  <th className="p-3 text-right">Base Salary</th>
                  <th className="p-3 text-right">Overtime Pay</th>
                  <th className="p-3 text-right">Advance Taken</th>
                  <th className="p-3 text-right">PF (12%)</th>
                  <th className="p-3 text-right">Net Payable</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data?.staff?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition">
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{s.phone || 'No phone'}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {s.role}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.shift}</p>
                    </td>
                    <td className="p-3 text-right font-mono">₹{s.baseSalaryRupees?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono text-emerald-700">+₹{s.overtimePayRupees || 0}</td>
                    <td className="p-3 text-right font-mono text-rose-600">
                      {s.advanceRupees > 0 ? `-₹${s.advanceRupees?.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-500">-₹{s.pfDeductionRupees?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-black text-sm text-emerald-800">
                      ₹{s.netPayableRupees?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setShowAdvanceModal(s)}
                          title="Record Advance"
                          className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition"
                        >
                          Adv
                        </button>
                        <button
                          onClick={() => setShowOvertimeModal(s)}
                          title="Add Overtime"
                          className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                        >
                          OT
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s.id, s.name)}
                          title="Delete staff"
                          className="p-1 text-gray-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ADD STAFF MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#14532D] to-[#166534] text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="font-extrabold text-sm">Add New Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Role / Designation</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  >
                    <option value="Warden">Warden</option>
                    <option value="Security Guard">Security Guard</option>
                    <option value="Cook">Cook / Kitchen</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Maintenance Tech">Maintenance Tech</option>
                    <option value="Manager / Supervisor">Manager / Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={10}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Duty Shift Timing</label>
                  <select
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  >
                    <option value="General (9 AM - 6 PM)">General (9 AM - 6 PM)</option>
                    <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM)</option>
                    <option value="Night (10 PM - 6 AM)">Night (10 PM - 6 AM)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={form.salaryRupees}
                    onChange={(e) => setForm({ ...form, salaryRupees: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Notes / Identity (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Aadhaar: XXXX-XXXX-1234 or Emergency Contact"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !form.name.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-[#14532D] to-[#16A34A] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Save &amp; Enroll Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RECORD ADVANCE MODAL ─── */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900">Record Salary Advance</h3>
              <button onClick={() => setShowAdvanceModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Record advance paid to <strong>{showAdvanceModal.name}</strong> ({showAdvanceModal.role}). This will be deducted from their net pay.
            </p>
            <form onSubmit={handleRecordAdvance} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(null)}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || advanceAmount <= 0}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {actionLoading ? 'Recording...' : 'Deduct from Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RECORD OVERTIME MODAL ─── */}
      {showOvertimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900">Log Overtime Hours</h3>
              <button onClick={() => setShowOvertimeModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Log extra shift hours for <strong>{showOvertimeModal.name}</strong>. Paid at ₹150 / hour.
            </p>
            <form onSubmit={handleRecordOvertime} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Additional Overtime Hours</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Calculated pay: +₹{overtimeHours * 150}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOvertimeModal(null)}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || overtimeHours <= 0}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {actionLoading ? 'Logging...' : 'Add Overtime'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
