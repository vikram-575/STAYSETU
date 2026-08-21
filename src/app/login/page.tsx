'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { Building2, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

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

      const destination = redirectTo !== '/dashboard' ? redirectTo : (data.redirect || '/dashboard')
      router.push(destination)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="text-xs text-gray-500 mt-1">Enter your registered email and password to access the portal</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="admin@pgsetu.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
        <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
          Forgot password?
        </Link>
        <Link href="/register" className="text-gray-700 hover:text-gray-900 font-bold">
          Create Owner Account →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-md shadow-blue-200">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">PG-SETU</h1>
          <p className="text-gray-500 text-xs mt-1 font-medium">PG Management & Revenue Control System</p>
        </div>

        <Suspense fallback={<div className="bg-white p-8 rounded-2xl text-center text-xs text-gray-500">Loading form...</div>}>
          <LoginForm />
        </Suspense>

        {/* Tenant Self-Service Passbook Portal Link */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-200/50 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black">Living as a Resident / Tenant?</p>
            <p className="text-[11px] text-blue-100 font-medium mt-0.5">View your bills, receipts & ledger with Phone + DOB</p>
          </div>
          <Link
            href="/portal"
            className="px-3.5 py-2 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-extrabold text-xs rounded-xl shadow-xs shrink-0 transition"
          >
            Tenant Portal →
          </Link>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6 font-medium">
          © 2026 PG-SETU. All data encrypted and secured.
        </p>
      </div>
    </div>
  )
}
