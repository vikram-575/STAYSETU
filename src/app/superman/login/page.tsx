'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldAlert, ShieldCheck, Lock, Eye, EyeOff,
  Loader2, ArrowRight, Building2, Server, Terminal
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

  return (
    <div className="min-h-screen bg-[#07130c] text-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#DCFCE7] selection:text-[#14532D]">
      {/* Subtle Professional Ambient Gradients & Architectural Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(22,163,74,0.18),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3 px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-xl shadow-[#16A34A]/25 border border-[#16A34A]/40 mb-1">
          <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A]/15 border border-[#16A34A]/30 text-[#DCFCE7] text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            Root System Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Company Admin Panel
          </h1>
          <p className="text-xs sm:text-sm text-[#DCFCE7]/70 mt-1 max-w-sm mx-auto">
            PG-SETU Platform Enterprise · SaaS Operations & Cross-PG Control Center
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-[#0b1c12]/90 backdrop-blur-xl border border-[#16A34A]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-xs text-rose-300 font-semibold flex items-start gap-2.5 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#DCFCE7] uppercase tracking-wider mb-1.5">
                Master Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikramtomar0505@gmail.com"
                  className="w-full px-4 py-3 bg-black/40 border border-[#16A34A]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/30 outline-none transition font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#DCFCE7] uppercase tracking-wider">
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
                  className="w-full px-4 py-3 pr-11 bg-black/40 border border-[#16A34A]/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/30 outline-none transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#16A34A] to-[#14532D] hover:from-[#15803D] hover:to-[#0F3E22] active:scale-98 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#16A34A]/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{loading ? 'Authenticating Root Access...' : 'Authorize & Enter Command Center'}</span>
            </button>
          </form>

          {/* Security & Isolation Footnote */}
          <div className="pt-2 text-center space-y-3">
            <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-[#DCFCE7]/70">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#16A34A]" /> 256-Bit TLS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3 text-[#16A34A]" /> Multi-Tenant Root
              </span>
            </div>

            <div className="pt-1">
              <Link
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#DCFCE7]/70 hover:text-white transition font-semibold inline-flex items-center gap-1"
              >
                ← Back to PG Owner & Staff Login
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 font-medium mt-6">
          © 2026 PG-SETU Platform Enterprise · Strict Access Audit Logged
        </p>
      </div>

      <div />
    </div>
  )
}

export default function CompanyAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07130c] flex items-center justify-center text-[#DCFCE7] text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing Security Shield...
        </div>
      }
    >
      <CompanyAdminLoginForm />
    </Suspense>
  )
}
