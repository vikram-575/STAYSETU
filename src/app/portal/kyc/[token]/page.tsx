'use client'

import { useState, useEffect, use } from 'react'
import {
  ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2,
  Sparkles, Building2, Check, ArrowRight, Shield
} from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default function TenantRemoteKYCPage({ params }: Props) {
  const { token } = use(params)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [tokenData, setTokenData] = useState<any>(null)

  // Verification states
  const [step, setStep] = useState<'aadhaar' | 'otp' | 'success'>('aadhaar')
  const [rawAadhaar, setRawAadhaar] = useState('')
  const [maskedDisplay, setMaskedDisplay] = useState('')
  const [otp, setOtp] = useState('')
  const [demoOtp, setDemoOtp] = useState<string | undefined>()
  const [verificationId, setVerificationId] = useState('')

  // Load token data on mount
  useEffect(() => {
    fetch(`/api/v1/tenant-kyc/public/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) {
          setError(d.error || 'Invalid or expired verification link.')
        } else {
          setTokenData(d)
          if (d.status === 'verified') setStep('success')
        }
      })
      .catch((err) => setError(err.message || 'Failed to connect'))
      .finally(() => setLoading(false))
  }, [token])

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 12)
    setRawAadhaar(digitsOnly)
    const parts: string[] = []
    for (let i = 0; i < digitsOnly.length; i += 4) {
      parts.push(digitsOnly.substring(i, i + 4))
    }
    setMaskedDisplay(parts.join(' '))
    setError('')
  }

  const handleStartAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rawAadhaar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/tenant-kyc/public/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_number: rawAadhaar }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')

      setDemoOtp(data.demo_otp)
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 4) {
      setError('Please enter the 6-digit OTP.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/tenant-kyc/public/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Verification failed')

      setVerificationId(data.verification_id)
      setStep('success')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-2" />
        <span className="text-sm font-bold text-slate-300">Loading Secure Verification Portal...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-gradient-to-b from-blue-600/20 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto my-auto relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/25 text-white mb-1">
            <ShieldCheck className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">PG-SETU TENANT KYC</h1>
          <p className="text-xs text-blue-200/80 font-medium">
            Self-Service Identity Verification for <strong className="text-white">{tokenData?.organization_name || 'Your PG'}</strong>
          </p>
        </div>

        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-slate-200">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: AADHAAR INPUT */}
          {step === 'aadhaar' && (
            <form onSubmit={handleStartAuth} className="space-y-4">
              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200/80 space-y-0.5 text-xs">
                <span className="text-blue-700 font-bold block text-[10px] uppercase">Verifying Identity For:</span>
                <div className="font-black text-slate-900 text-sm">{tokenData?.tenant_name}</div>
                <div className="text-slate-500">{tokenData?.phone}</div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Enter 12-Digit Aadhaar Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={maskedDisplay}
                    onChange={handleAadhaarChange}
                    placeholder="XXXX XXXX XXXX"
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-lg font-mono font-black text-slate-900 tracking-widest focus:bg-white focus:border-blue-600 outline-none"
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>256-bit encrypted. Unmasked Aadhaar is never saved.</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || rawAadhaar.length !== 12}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{submitting ? 'Connecting...' : 'Proceed to OTP Verification →'}</span>
              </button>
            </form>
          )}

          {/* STEP 2: OTP INPUT */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black text-slate-900">Enter Aadhaar OTP</h4>
                <p className="text-xs text-slate-500">
                  An OTP has been dispatched to your Aadhaar-linked mobile number.
                </p>
                {demoOtp && (
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-1">
                    Demo OTP: {demoOtp}
                  </span>
                )}
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  autoFocus
                  className="w-full text-center py-3 bg-slate-50 border border-slate-300 rounded-2xl text-2xl font-mono font-black text-slate-900 tracking-widest focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('aadhaar')}
                  className="w-1/3 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || otp.length < 4}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{submitting ? 'Verifying...' : 'Complete KYC Verification →'}</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Verification Complete
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Aadhaar KYC Verified ✓</h3>
                <p className="text-xs text-slate-600">
                  Thank you, <strong>{tokenData?.tenant_name}</strong>! Your identity verification has been cryptographically recorded and shared with <strong>{tokenData?.organization_name}</strong>.
                </p>
              </div>

              {verificationId && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600">
                  Verification ID: <strong className="text-slate-900">{verificationId}</strong>
                </div>
              )}

              <p className="text-[11px] text-slate-400 font-medium">
                You may now close this browser tab.
              </p>
            </div>
          )}

        </div>

        <p className="text-center text-[11px] text-slate-500 font-medium pt-2">
          © 2026 PG-SETU. Authorized e-KYC Security Protocol.
        </p>
      </div>

      <div />
    </div>
  )
}
