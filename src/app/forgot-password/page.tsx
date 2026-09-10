'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/firebase/auth'
import { Building2, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Mail, ShieldCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await resetPassword(email)
      setLoading(false)
      setSent(true)
    } catch (err: any) {
      setLoading(false)
      setError(err?.message || 'Failed to send password reset email. Please verify your email.')
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17211B] flex flex-col justify-between p-4 sm:p-6 selection:bg-[#DCFCE7] selection:text-[#14532D] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(22,163,74,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#16A34A_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 pt-2 pb-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#DCFCE7] flex items-center justify-center text-[#14532D] shadow-sm font-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-[#17211B] block leading-none">StaySetu</span>
            <span className="text-[10px] font-bold text-[#16A34A] tracking-wider uppercase mt-0.5 block">Account Recovery</span>
          </div>
        </Link>
        <Link
          href="/login"
          className="text-xs font-semibold text-[#647067] hover:text-[#14532D] transition px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      <div className="w-full max-w-md mx-auto my-auto relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#14532D] to-[#16A34A] rounded-2xl shadow-xl shadow-[#16A34A]/20 text-white mb-1 border border-[#16A34A]/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17211B] tracking-tight">Recover Password</h1>
          <p className="text-xs sm:text-sm text-[#647067] font-medium">
            Reset your PG-SETU Property Cloud credentials securely
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-xl shadow-slate-200/70 p-7 sm:p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-[#DCFCE7] border border-[#16A34A]/30 rounded-2xl flex items-center justify-center mx-auto text-[#14532D] shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-[#17211B]">Reset Link Dispatched</h2>
              <p className="text-xs text-[#647067] leading-relaxed">
                We sent password recovery instructions to <span className="font-bold text-[#17211B]">{email}</span>. Please check your inbox or spam folder.
              </p>
              <div className="pt-3">
                <Link
                  href="/login"
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#16A34A] to-[#14532D] hover:from-[#15803D] hover:to-[#0F3E22] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#16A34A]/20 inline-flex items-center justify-center gap-2 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-[#E5E7EB] pb-3.5 mb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A] block">Email Verification</span>
                <p className="text-[11px] text-[#647067] mt-0.5">
                  Enter your registered account email to receive a secure recovery link.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#17211B] uppercase tracking-wider mb-1.5">Registered Email Address</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#647067]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                      placeholder="e.g. owner@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#16A34A] to-[#14532D] hover:from-[#15803D] hover:to-[#0F3E22] disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/25 cursor-pointer"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Dispatching Reset Link...' : 'Send Password Reset Link →'}</span>
                </button>
              </form>

              <div className="mt-5 text-center pt-3 border-t border-[#E5E7EB]">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#647067] hover:text-[#14532D] transition">
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
              </div>
            </>
          )}
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
