'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck, AlertCircle, CheckCircle2, Clock, User,
  Phone, Home, Car, Calendar, ArrowLeft, Loader2, KeyRound
} from 'lucide-react'

export default function GatePassVerifyPage() {
  const params = useParams()
  const passId = params?.passId as string
  const [pass, setPass] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)

  useEffect(() => {
    async function loadPass() {
      if (!passId) return
      try {
        setLoading(true)
        const res = await fetch(`/api/portal/gate-pass?pass_id=${encodeURIComponent(passId)}`)
        const data = await res.json()
        if (res.ok && data.pass) {
          setPass(data.pass)
          if (data.pass.status === 'checked_in') setCheckedIn(true)
        } else {
          setError(data.error || 'Gate pass not found or invalid')
        }
      } catch (err: any) {
        setError('Failed to connect to security database')
      } finally {
        setLoading(false)
      }
    }
    loadPass()
  }, [passId])

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      const res = await fetch('/api/portal/gate-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_in', passId }),
      })
      const data = await res.json()
      if (res.ok && data.pass) {
        setPass(data.pass)
        setCheckedIn(true)
      }
    } catch {
      alert('Error updating gate pass status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
          <p className="text-sm font-semibold text-gray-600">Verifying Gate Pass...</p>
        </div>
      </div>
    )
  }

  if (error || !pass) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-rose-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Invalid or Expired Pass</h2>
          <p className="text-xs text-gray-500 mb-6">{error || 'This gate pass code does not exist in the security registry.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const isCheckedIn = pass.status === 'checked_in' || checkedIn
  const isValid = pass.status === 'approved' || isCheckedIn

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 md:p-8">
      {/* Header */}
      <div className="max-w-lg mx-auto w-full pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#16A34A] flex items-center justify-center font-black text-white text-xs">
              PG
            </div>
            <div>
              <p className="text-xs font-black tracking-wider text-emerald-400">PG-SETU SECURITY GATE</p>
              <p className="text-[10px] text-gray-400">Visitor Verification Terminal</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-gray-300 font-mono">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* Status Card */}
        <div
          className={`rounded-2xl p-6 border text-center transition-all ${
            isCheckedIn
              ? 'bg-blue-950/60 border-blue-500/50'
              : isValid
              ? 'bg-emerald-950/60 border-emerald-500/50'
              : 'bg-rose-950/60 border-rose-500/50'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg ${
              isCheckedIn
                ? 'bg-blue-600 text-white'
                : isValid
                ? 'bg-[#16A34A] text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isCheckedIn ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isValid ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>

          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 ${
              isCheckedIn
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : isValid
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isCheckedIn ? 'Checked In' : isValid ? 'Approved - Entry Permitted' : 'Access Denied'}
          </span>

          <h1 className="text-2xl font-black tracking-tight">{pass.guestName}</h1>
          <p className="text-xs text-gray-400 mt-1">
            Expected: {pass.guestCount} Guest{pass.guestCount > 1 ? 's' : ''}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/10 font-mono">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400">PIN CODE:</span>
            <span className="text-lg font-black tracking-widest text-emerald-400">{pass.pinCode}</span>
          </div>
        </div>

        {/* Details List */}
        <div className="mt-4 bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-400 text-[11px] flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Resident Host
              </p>
              <p className="font-bold text-white">{pass.residentName}</p>
              <p className="text-[10px] text-gray-400">{pass.residentPhone}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px] flex items-center gap-1.5 mb-1">
                <Home className="w-3.5 h-3.5 text-emerald-400" /> Host Room
              </p>
              <p className="font-bold text-white">{pass.roomNumber}</p>
              <p className="text-[10px] text-gray-400">Room Verified</p>
            </div>
          </div>

          <hr className="border-white/10" />

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Guest Phone:
              </span>
              <span className="font-mono font-bold text-white">{pass.guestPhone || 'Not provided'}</span>
            </div>

            {pass.vehicleNumber && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" /> Vehicle No:
                </span>
                <span className="font-mono font-bold text-amber-300">{pass.vehicleNumber}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Purpose:
              </span>
              <span className="font-medium text-white">{pass.purpose}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Valid Until:
              </span>
              <span className="text-gray-300 font-mono text-[11px]">
                {new Date(pass.validUntil).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button for Guard */}
        <div className="mt-6">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#16A34A] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  MARK VISITOR ENTERED (ALLOW ENTRY)
                </>
              )}
            </button>
          ) : (
            <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-semibold">
              ✓ Checked in at {new Date(pass.checkedInAt || Date.now()).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-[10px] text-gray-500 pt-6">
        Protected by PG-SETU Real-Time Access Control System
      </footer>
    </div>
  )
}
