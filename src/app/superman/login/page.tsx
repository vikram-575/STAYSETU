'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldAlert, ShieldCheck, KeyRound, Lock, Eye, EyeOff,
  Loader2, Sparkles, Terminal, ArrowRight, CheckCircle2,
  AlertTriangle, Building2, Server
} from 'lucide-react'

function CompanyAdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/superman'

  const handleAdminLogin = async (e: React.FormEvent) => {
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
        throw new Error(data.error || 'Invalid Company Admin Credentials')
      }

      if (data.role !== 'superadmin' && cleanEmail !== 'vikramtomar0505@gmail.com') {
        throw new Error('Access Denied: This portal is strictly for Platform Super Administrators.')
      }

      const destination = redirectTo !== '/dashboard' ? redirectTo : '/superman'
      router.push(destination)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify master credentials.')
      setLoading(false)
    }
  }

  const fillMasterCredentials = () => {
    setEmail('vikramtomar0505@gmail.com')
    setPassword('qwerty123')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-blue-500/20 border border-blue-400/30 mb-1">
          <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Root System Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Company Admin Panel
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            PG-SETU Platform Enterprise · SaaS Operations & Cross-PG Control Center
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-xs text-rose-300 font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikramtomar0505@gmail.com"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Master Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 active:scale-98 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{loading ? 'Authenticating Root Access...' : 'Authorize & Enter Command Center'}</span>
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Pill */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={fillMasterCredentials}
              className="w-full py-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              <span>Fill Master Credentials (Vikram Tomar)</span>
            </button>
          </div>

          {/* Security & Isolation Footnote */}
          <div className="pt-2 text-center space-y-3">
            <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> 256-Bit TLS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3 text-blue-500" /> Multi-Tenant Root
              </span>
            </div>

            <div className="pt-1">
              <Link
                href="/login"
                className="text-xs text-slate-400 hover:text-white transition font-semibold inline-flex items-center gap-1"
              >
                ← Back to PG Owner & Staff Login
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 font-medium mt-6">
          © 2026 PG-SETU Platform Enterprise · Strict Access Audit Logged
        </p>
      </div>
    </div>
  )
}

export default function CompanyAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing Security Shield...
        </div>
      }
    >
      <CompanyAdminLoginForm />
    </Suspense>
  )
}
