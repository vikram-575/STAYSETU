'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck, Lock, Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, ArrowRight, KeyRound, Sparkles, Building2,
  Check, X
} from 'lucide-react'

export default function SetPermanentPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('PG Owner / Staff')

  useEffect(() => {
    // Read auth cookies client-side if available
    if (typeof document !== 'undefined') {
      const matchEmail = document.cookie.match(/auth_email=([^;]+)/)
      if (matchEmail) setUserEmail(decodeURIComponent(matchEmail[1]))
      const matchRole = document.cookie.match(/auth_role=([^;]+)/)
      if (matchRole) {
        const r = decodeURIComponent(matchRole[1])
        setUserRole(r === 'owner' ? 'PG Owner' : r === 'manager' ? 'Property Manager' : r === 'staff' ? 'Staff / Warden' : r)
      }
    }
  } , [])

  // Calculate password strength
  const getStrength = (pwd: string) => {
    if (!pwd) return 0
    let score = 0
    if (pwd.length >= 6) score += 1
    if (pwd.length >= 8) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[a-zA-Z]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score += 1
    return score
  }

  const strength = getStrength(password)
  const strengthLabels = ['Too Weak', 'Weak', 'Good', 'Strong']
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']

  const isMinLength = password.length >= 6
  const isMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const isFormValid = isMinLength && password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMinLength) {
      setError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-type to confirm.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to set new password. Please try again.')
      }

      setSuccess('Password set successfully! Redirecting you to your PG Dashboard...')
      setTimeout(() => {
        router.push(data.redirect || '/dashboard')
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 border border-blue-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">PG-SETU</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold uppercase border border-blue-500/30">
                  Security Vault
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Next-Gen Property Operations Cloud</p>
            </div>
          </div>

          <Link
            href="/login"
            className="text-xs text-slate-400 hover:text-white transition font-medium flex items-center gap-1.5"
          >
            <span>Sign in as different user</span>
          </Link>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800 backdrop-blur-xl p-6 sm:p-8 space-y-6">
            
            {/* Header / Security Badge */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20 mb-1 border border-amber-400/30">
                <KeyRound className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> First-Time Account Activation
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Create Your Permanent Password
              </h1>
              <p className="text-xs text-slate-400">
                Your account was initialized with a temporary password. Choose a secure permanent password to protect your PG data.
              </p>
            </div>

            {/* User Account Pill */}
            {userEmail && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Securing Account</span>
                  <span className="text-white font-semibold font-mono text-[11px] sm:text-xs truncate max-w-[220px] block">{userEmail}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[11px]">
                  {userRole}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 font-medium flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  New Permanent Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-4 py-3 pr-11 bg-slate-950/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password strength:</span>
                      <span className="font-bold text-slate-300">{strengthLabels[Math.max(0, strength - 1)] || 'Weak'}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`rounded-full transition-all duration-300 ${
                            strength >= step ? strengthColors[strength - 1] : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password"
                    className="w-full px-4 py-3 pr-11 bg-slate-950/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    {isMatch ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Passwords match perfectly
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" /> Passwords do not match yet
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Requirement Checkpoints */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1 text-[11px] text-slate-400">
                <div className={`flex items-center gap-2 ${isMinLength ? 'text-emerald-400 font-semibold' : ''}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isMinLength ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800'}`}>
                    ✓
                  </div>
                  <span>Minimum 6 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-emerald-400 font-semibold' : ''}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[0-9]/.test(password) ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800'}`}>
                    ✓
                  </div>
                  <span>Contains numbers or special characters (recommended)</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3.5 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-blue-500/25 active:scale-[0.99] cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Saving Permanent Password...' : 'Save Password & Enter PG Dashboard →'}</span>
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-500">
                Once saved, you can log in directly to your dashboard with this password.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
        PG-SETU Security Vault · Enterprise Tenant & PG Management Cloud
      </footer>
    </div>
  )
}
