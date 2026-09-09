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

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <Link href="/forgot-password" className="text-slate-400 hover:text-blue-400 font-medium transition">
          Forgot password?
        </Link>
        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-bold transition">
          Register New PG →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Subtle Professional Ambient Gradients & Architectural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b14_1px,transparent_1px),linear-gradient(to_bottom,#1e293b14_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-black tracking-tight text-white">PG-SETU</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
            Enterprise Cloud
          </span>
        </div>
      </header>

      {/* Center Container */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-1 border border-blue-400/30">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PG-SETU Property Cloud</h1>
          <p className="text-xs text-slate-400 font-medium">Operations & Revenue Management System</p>
        </div>

        {/* Owner & Staff Login Box */}
        <LoginForm />

        {/* Professional Tenant Passbook Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">
                Tenant Portal
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate">Looking for your Stay Passbook?</p>
            <p className="text-[11px] text-slate-400 truncate">View rent bills, electricity & pay via UPI</p>
          </div>

          <Link
            href="/portal"
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>Tenant Login →</span>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[10px] text-slate-500 font-medium">
          © 2026 PG-SETU Platform Enterprise · Strict 256-bit TLS Security
        </p>
      </div>

      <div />
    </div>
  )
}
