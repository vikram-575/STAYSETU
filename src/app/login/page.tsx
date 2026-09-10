'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Eye, EyeOff, Loader2, Lock, Mail,
  ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Star, Zap, Receipt, Users, Phone
} from 'lucide-react'

function LoginFormContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
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
        throw new Error(data.error || 'Invalid email, mobile number or password.')
      }

      // If temporary password is used, direct jump to set permanent password
      let destination: string
      if (data.requiresPasswordChange || data.redirect === '/set-password') {
        destination = '/set-password'
      } else if (data.role === 'superadmin') {
        destination = data.redirect || '/superman'
      } else {
        const safeRedirect =
          redirectTo &&
          !redirectTo.startsWith('/superman') &&
          !redirectTo.startsWith('/superadmin') &&
          !redirectTo.startsWith('/admin')
            ? redirectTo
            : '/dashboard'
        destination = safeRedirect !== '/dashboard' ? safeRedirect : data.redirect || '/dashboard'
        if (
          destination.startsWith('/superman') ||
          destination.startsWith('/superadmin') ||
          destination.startsWith('/admin')
        ) {
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
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col justify-between selection:bg-[#DCFCE7] selection:text-[#14532D]">
      {/* Top Mobile Bar */}
      <div className="lg:hidden bg-[#14532D] text-white px-4 py-3 flex items-center justify-between border-b border-[#16A34A]/30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#16A34A] to-[#DCFCE7] flex items-center justify-center text-[#14532D] shadow-sm font-black">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">StaySetu</span>
        </Link>
        <Link
          href="/portal"
          className="text-xs font-bold bg-[#DCFCE7] text-[#14532D] px-3 py-1.5 rounded-full hover:bg-white transition flex items-center gap-1"
        >
          <span>Tenant Passbook</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-screen">
        {/* ========================================================= */}
        {/* LEFT COLUMN: BRANDING, VALUE PROPOSITION & TRUST METRICS */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#14532D] via-[#0F3E22] to-[#14532D] text-white p-10 xl:p-14 flex-col justify-between relative overflow-hidden">
          {/* Subtle Geometric Mesh Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_-10%,rgba(22,163,74,0.3),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_110%,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none" />

          {/* Top Brand & Back to Home */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#DCFCE7] flex items-center justify-center text-[#14532D] shadow-lg shadow-[#16A34A]/20 transition group-hover:scale-105">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-white block leading-none">StaySetu</span>
                  <span className="text-[10px] font-bold text-[#DCFCE7] tracking-widest uppercase mt-0.5 block">Property ERP Cloud</span>
                </div>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#DCFCE7] hover:text-white transition px-3 py-1 rounded-full bg-white/5 border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Marketplace</span>
              </Link>
            </div>

            <div className="pt-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCFCE7]/15 border border-[#DCFCE7]/30 text-[#DCFCE7] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>The Modern PropTech Standard</span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-snug">
                Powering high-yield PGs, coliving & rental properties.
              </h1>
              <p className="text-sm text-[#DCFCE7]/80 leading-relaxed max-w-md">
                Streamline bed occupancy, automate 1-click rent collections via UPI, track smart electricity sub-meters, and give residents digital passbooks.
              </p>
            </div>
          </div>

          {/* Core Feature Pillars */}
          <div className="relative z-10 py-8 space-y-4">
            <div className="flex items-start gap-3.5 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-[#16A34A]/20 border border-[#16A34A]/40 flex items-center justify-center text-[#DCFCE7] shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">1-Click Rent Rolls & Auto UPI</h2>
                <p className="text-[11px] text-[#DCFCE7]/70 mt-0.5">Automated WhatsApp invoices with dynamic UPI QR codes and instant ledger reconciliation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Smart Sub-Meters & Billing</h2>
                <p className="text-[11px] text-[#DCFCE7]/70 mt-0.5">Split electricity units automatically per room, capture photo proof, and stop power leakage.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-[#16A34A]/20 border border-[#16A34A]/40 flex items-center justify-center text-[#DCFCE7] shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Govt. Aadhaar e-KYC & Agreements</h2>
                <p className="text-[11px] text-[#DCFCE7]/70 mt-0.5">Instant tenant identity verification, police compliance reports, and digital rental agreements.</p>
              </div>
            </div>
          </div>

          {/* Social Proof & Trust Strip */}
          <div className="relative z-10 pt-4 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-lg font-black text-white">15,000+</p>
                <p className="text-[10px] uppercase font-bold text-[#DCFCE7]/70">Beds Managed</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-lg font-black text-[#F59E0B]">₹18 Cr+</p>
                <p className="text-[10px] uppercase font-bold text-[#DCFCE7]/70">Rent Collected</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-lg font-black text-[#DCFCE7]">99.98%</p>
                <p className="text-[10px] uppercase font-bold text-[#DCFCE7]/70">System Uptime</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#DCFCE7]/70 pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                Bank-Grade 256-Bit SSL
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                4.9/5 PG Owner Rating
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: PROFESSIONAL LOGIN INTERFACE */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 xl:p-16 relative">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(#16A34A_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          {/* Top Navigation Bar on Desktop */}
          <div className="relative z-10 hidden lg:flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-xs font-bold text-[#647067]">Enterprise Property Operations</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#647067]">Staying in a StaySetu PG?</span>
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#DCFCE7] text-[#14532D] text-xs font-bold hover:bg-[#bbf7d0] transition border border-[#16A34A]/20"
              >
                <span>Tenant Passbook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Central Login Card */}
          <div className="w-full max-w-md mx-auto my-auto relative z-10">
            {/* Header */}
            <div className="mb-6 text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#14532D] mb-3 shadow-md shadow-[#16A34A]/10 border border-[#16A34A]/20">
                <Building2 className="w-6 h-6 text-[#14532D]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#17211B] tracking-tight">
                PG Owner & Staff Login
              </h2>
              <p className="text-xs sm:text-sm text-[#647067] font-medium mt-1">
                Access your room inventory, rent roll, electricity billing & ledger.
              </p>
            </div>

            {/* Main Auth Container */}
            <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-200/70 border border-[#E5E7EB] space-y-6">
              {/* Account Type Toggle */}
              <div className="grid grid-cols-2 p-1 bg-[#F7FAF7] rounded-xl border border-[#E5E7EB] text-xs font-bold">
                <button
                  type="button"
                  className="py-2 px-3 rounded-lg bg-white text-[#14532D] shadow-sm border border-[#E5E7EB] flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Owner / Staff</span>
                </button>
                <Link
                  href="/portal"
                  className="py-2 px-3 rounded-lg text-[#647067] hover:text-[#17211B] transition flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Resident Passbook</span>
                </Link>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#17211B] uppercase tracking-wider mb-1.5">
                    Registered Email or Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647067]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                      placeholder="e.g. owner@example.com or 9876543210"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#17211B] uppercase tracking-wider">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-[#16A34A] hover:text-[#14532D] transition"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647067]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                      placeholder="••••••••"
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

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#647067]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#E5E7EB] text-[#16A34A] focus:ring-[#16A34A] cursor-pointer"
                    />
                    <span className="font-medium">Remember this browser for 30 days</span>
                  </label>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#16A34A] to-[#14532D] hover:from-[#15803D] hover:to-[#0F3E22] active:scale-[0.99] disabled:opacity-50 text-white font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/25 cursor-pointer mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Authenticating Credentials...' : 'Sign In to Dashboard →'}</span>
                </button>
              </form>

              {/* Divider & Register CTA */}
              <div className="pt-4 border-t border-[#E5E7EB] space-y-3 text-center">
                <p className="text-xs text-[#647067]">
                  New to PG-SETU Property Cloud?
                </p>
                <Link
                  href="/register"
                  className="w-full py-2.5 px-4 rounded-xl border border-[#16A34A] text-[#14532D] font-bold text-xs bg-[#DCFCE7]/40 hover:bg-[#DCFCE7] transition flex items-center justify-center gap-1.5 group"
                >
                  <span>Register New Property (Free Trial)</span>
                  <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Resident Passbook Quick Link Card on Mobile */}
            <div className="lg:hidden mt-4 p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#17211B]">Looking for your Stay Passbook?</p>
                <p className="text-[11px] text-[#647067]">Pay rent via UPI, check bills & electricity</p>
              </div>
              <Link
                href="/portal"
                className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] text-[#14532D] text-xs font-bold shrink-0 hover:bg-[#bbf7d0]"
              >
                Tenant Login →
              </Link>
            </div>

            {/* Subtle Security & Super Admin Link */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#647067] gap-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                ISO 27001 Certified & 256-Bit TLS Security
              </span>
              <Link
                href="/superman/login"
                className="text-[#647067]/70 hover:text-[#14532D] transition font-medium"
              >
                Super Admin Access
              </Link>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 text-center lg:text-left text-[11px] text-[#647067]/70 pt-6">
            © 2026 StaySetu Platform Enterprise · All Rights Reserved
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
