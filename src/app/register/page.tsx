'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      router.push(data.redirect || '/onboarding')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17211B] flex flex-col justify-between p-4 sm:p-6 selection:bg-[#DCFCE7] selection:text-[#14532D] relative overflow-hidden">
      {/* Subtle Ambient Glows & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(22,163,74,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(245,158,11,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#16A34A_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 pt-2 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#DCFCE7] flex items-center justify-center text-[#14532D] shadow-sm font-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#17211B] block leading-none">PGSetu</span>
            <span className="text-[10px] font-bold text-[#16A34A] tracking-wider uppercase mt-0.5 block">Owner Registration</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-bold text-white bg-gradient-to-r from-[#16A34A] to-[#14532D] hover:from-[#15803D] hover:to-[#0F3E22] transition px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <span>Login to Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="w-full max-w-md mx-auto my-auto relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#14532D] via-[#0F3E22] to-[#16A34A] rounded-2xl shadow-xl shadow-[#16A34A]/20 text-white mb-1 border border-[#16A34A]/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17211B] tracking-tight">Create Property Account</h1>
          <p className="text-xs sm:text-sm text-[#647067] font-medium max-w-sm mx-auto">
            Automate room inventory, 1-click rent rolls & smart electricity sub-meters
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-[#E5E7EB] p-7 sm:p-8 space-y-5">
          {/* Account Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#F7FAF7] rounded-xl border border-[#E5E7EB] text-xs font-bold">
            <div className="py-2 px-3 rounded-lg bg-white text-[#14532D] shadow-sm border border-[#E5E7EB] flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Create Account</span>
            </div>
            <Link
              href="/login"
              className="py-2 px-3 rounded-lg text-[#647067] hover:text-[#17211B] transition flex items-center justify-center gap-1.5"
            >
              <span>Sign In / Login →</span>
            </Link>
          </div>

          {/* Mobile OTP Fast-Track Banner */}
          <Link
            href="/login"
            className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#DCFCE7] to-[#DCFCE7]/40 border border-[#16A34A]/30 text-xs text-[#14532D] hover:bg-[#DCFCE7]/70 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📱</span>
              <div>
                <span className="font-bold block">Sign In or Register with Mobile OTP</span>
                <span className="text-[10px] text-[#166534]">Instant login if number exists, otherwise creates profile</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#16A34A] group-hover:translate-x-0.5 transition" />
          </Link>

          <div className="border-b border-[#E5E7EB] pb-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] block">PG Owner & Manager Sign Up</span>
            <p className="text-[11px] text-[#647067] mt-0.5">
              Start your 30-day free trial · No credit card required
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#17211B] uppercase tracking-wider mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                placeholder="e.g. Vikram Tomar"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] uppercase tracking-wider mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] uppercase tracking-wider mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-11 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#647067] hover:text-[#17211B] p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] uppercase tracking-wider mb-1.5">Confirm Password *</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#16A34A] to-[#14532D] hover:from-[#15803D] hover:to-[#0F3E22] active:scale-[0.99] disabled:opacity-50 text-white font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/25 cursor-pointer mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating Your Account...' : 'Continue to PG Onboarding →'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-[#E5E7EB] space-y-2 text-center text-xs text-[#647067]">
            <div>
              Already have an account?{' '}
              <Link href="/login" className="text-[#16A34A] hover:text-[#14532D] font-bold">
                Sign In to Owner Dashboard →
              </Link>
            </div>
            <div className="text-[11px] pt-1.5 border-t border-slate-100 flex items-center justify-center gap-2">
              <span>Are you a resident or tenant?</span>
              <Link href="/portal" className="text-blue-600 font-bold hover:underline">
                Tenant Passbook Login →
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-[#647067]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Strict 256-Bit TLS Bank-Grade Encryption</span>
        </div>
      </div>

      <div />
    </div>
  )
}
