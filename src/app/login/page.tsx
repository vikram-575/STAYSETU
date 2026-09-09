'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Eye, EyeOff, Loader2, KeyRound, Sparkles,
  Shield, QrCode, FileText, CheckCircle2
} from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const target = params.get('redirectTo')
      if (target) setRedirectTo(target)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanEmail = email.trim().toLowerCase()

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password')
      }

      // If temporary password is used, direct jump to set permanent password
      let destination: string
      if (data.requiresPasswordChange || data.redirect === '/set-password') {
        destination = '/set-password'
      } else if (data.role === 'superadmin') {
        // Only superadmin goes to superman — never redirect regular users there
        destination = data.redirect || '/superman'
      } else {
        // Non-superadmin users always go to /dashboard regardless of redirectTo
        // (prevents accidental redirect to /superadmin if cookie was stale)
        const safeRedirect = redirectTo && !redirectTo.startsWith('/superman') && !redirectTo.startsWith('/superadmin') && !redirectTo.startsWith('/admin')
          ? redirectTo
          : '/dashboard'
        destination = safeRedirect !== '/dashboard' ? safeRedirect : (data.redirect || '/dashboard')
        // Final safety: ensure non-superadmin never lands on admin routes
        if (destination.startsWith('/superman') || destination.startsWith('/superadmin') || destination.startsWith('/admin')) {
          destination = '/dashboard'
        }
      }

      router.push(destination)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-8 space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">PG Owner & Staff Login</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Access your property management dashboard, room inventory & ledger
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold animate-in fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Registered Email or Mobile Number
          </label>
          <input
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition"
            placeholder="e.g. owner@example.com or 9876543210"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 active:scale-[0.99] disabled:opacity-50 text-white font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard →'}</span>
        </button>
      </form>

      {/* Quick Demo Login Preset Pills */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
            ⚡ Quick Demo 1-Click Login:
          </span>
          <span className="text-[10px] text-blue-600 font-bold">Auto-fills credentials</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-left">
          <button
            type="button"
            onClick={() => {
              setEmail('vikram.rathore@stanzaliving.com')
              setPassword('84920183')
              setError('')
            }}
            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-[11px] text-slate-700 hover:text-blue-800 text-left font-semibold cursor-pointer"
          >
            🏢 <strong className="font-bold">Stanza Living</strong>
            <span className="block text-[9px] text-slate-400 font-mono">vikram.rathore@...</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('ananya.deshmukh@zolostays.com')
              setPassword('73910482')
              setError('')
            }}
            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-[11px] text-slate-700 hover:text-blue-800 text-left font-semibold cursor-pointer"
          >
            🏢 <strong className="font-bold">Zolo Stays</strong>
            <span className="block text-[9px] text-slate-400 font-mono">ananya.deshmukh@...</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('rajesh.khurana@olivepg.com')
              setPassword('62849103')
              setError('')
            }}
            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-[11px] text-slate-700 hover:text-blue-800 text-left font-semibold cursor-pointer"
          >
            🏢 <strong className="font-bold">Olive PG</strong>
            <span className="block text-[9px] text-slate-400 font-mono">rajesh.khurana@...</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('venkatesh.reddy@balajipg.com')
              setPassword('51938204')
              setError('')
            }}
            className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition text-[11px] text-slate-700 hover:text-blue-800 text-left font-semibold cursor-pointer"
          >
            🏢 <strong className="font-bold">Sri Balaji PG</strong>
            <span className="block text-[9px] text-slate-400 font-mono">venkatesh.reddy@...</span>
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <Link href="/forgot-password" className="text-slate-500 hover:text-blue-600 font-medium transition">
          Forgot password?
        </Link>
        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold transition">
          Register New PG →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-between p-4 sm:p-6 selection:bg-blue-600 selection:text-white relative">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-blue-600/20 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-white">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-black text-white tracking-tight">PG-SETU CLOUD</span>
        </div>
      </header>

      <div className="w-full max-w-md mx-auto my-auto relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/25 text-white mb-1">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">PG-SETU</h1>
          <p className="text-xs sm:text-sm text-blue-200/80 font-medium">PG Operations & Revenue Management System</p>
        </div>

        {/* Owner & Staff Login Box */}
        <LoginForm />

        {/* 🌟 HIGH-VISIBILITY HIGHLIGHTED TENANT PASSBOOK CARD */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-emerald-900/30 border border-emerald-400/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Tenant Self-Service
            </span>
            <span className="text-[11px] text-emerald-100 font-bold">Phone + DOB Login</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-white leading-tight">
              Resident & Tenant Passbook Portal
            </h3>
            <p className="text-xs text-emerald-50 leading-relaxed font-medium">
              View your rent receipts, check live electricity dues, download bills & pay rent directly via UPI.
            </p>
          </div>

          <Link
            href="/portal"
            className="w-full py-3 px-4 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-[0.99] font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 group"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Open Resident Digital Passbook →</span>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500 font-medium">
          © 2026 PG-SETU. Enterprise 256-bit SSL encrypted.
        </p>
      </div>

      <div />
    </div>
  )
}
