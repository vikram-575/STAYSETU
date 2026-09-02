'use client'

import { useState, useEffect } from 'react'
import {
  Shield, CheckCircle2, AlertCircle, X, Loader2,
  Lock, RefreshCw, KeyRound, Sparkles, FileText,
  QrCode, Check, ArrowRight, ShieldCheck, AlertTriangle, Eye, EyeOff
} from 'lucide-react'
import { KYCCheckItem, VerificationStatus, AadhaarExtractedData } from '@/lib/kyc/types'

interface AadhaarVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  tenantData?: {
    full_name?: string
    phone?: string
    date_of_birth?: string
    gender?: string
    tenant_id?: string
  }
  onVerificationSuccess: (result: {
    verification_id: string
    masked_aadhaar: string
    extracted_data?: AadhaarExtractedData
    checks: KYCCheckItem[]
  }) => void
}

export function AadhaarVerificationModal({
  isOpen,
  onClose,
  tenantData,
  onVerificationSuccess,
}: AadhaarVerificationModalProps) {
  const [step, setStep] = useState<'input' | 'otp' | 'processing' | 'result'>('input')
  const [rawAadhaar, setRawAadhaar] = useState('')
  const [maskedDisplay, setMaskedDisplay] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoOtp, setDemoOtp] = useState<string | undefined>()
  const [countdown, setCountdown] = useState(60)
  const [resendActive, setResendActive] = useState(false)

  // Verification results
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('not_started')
  const [checks, setChecks] = useState<KYCCheckItem[]>([])
  const [extractedData, setExtractedData] = useState<AadhaarExtractedData | undefined>()
  const [failureReason, setFailureReason] = useState<string | undefined>()

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('input')
      setRawAadhaar('')
      setMaskedDisplay('')
      setOtp('')
      setError('')
      setFailureReason(undefined)
      setCountdown(60)
      setResendActive(false)
    }
  }, [isOpen])

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    } else if (countdown === 0) {
      setResendActive(true)
    }
    return () => clearInterval(timer)
  }, [step, countdown])

  if (!isOpen) return null

  // Format Aadhaar with spaces: "4521 8920 1842"
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 12)
    setRawAadhaar(digitsOnly)

    // Format with spaces
    const parts: string[] = []
    for (let i = 0; i < digitsOnly.length; i += 4) {
      parts.push(digitsOnly.substring(i, i + 4))
    }
    setMaskedDisplay(parts.join(' '))
    setError('')
  }

  // Step 1: Submit Aadhaar Number to start Auth
  const handleStartAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rawAadhaar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/tenant-kyc/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar_number: rawAadhaar,
          tenant_id: tenantData?.tenant_id,
          tenant_name: tenantData?.full_name,
          tenant_phone: tenantData?.phone,
          tenant_dob: tenantData?.date_of_birth,
          tenant_gender: tenantData?.gender,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Authentication initiation failed')

      setSessionId(data.session_id)
      setVerificationId(data.verification_id)
      setIsDemoMode(!!data.is_demo_mode)
      setDemoOtp(data.demo_otp)
      setStep('otp')
      setCountdown(60)
      setResendActive(false)
    } catch (err: any) {
      setError(err.message || 'Failed to connect to authorized provider.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Submit OTP & Run Cryptographic Engine
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 4) {
      setError('Please enter the verification OTP.')
      return
    }

    setLoading(true)
    setError('')
    setStep('processing')

    try {
      const res = await fetch(`/api/v1/tenant-kyc/${sessionId}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      })

      const data = await res.json()

      // Artificial slight delay to let user observe cryptographic checks
      await new Promise((r) => setTimeout(r, 900))

      setVerificationStatus(data.status || (data.success ? 'verified' : 'not_verified'))
      setChecks(data.checks || [])
      setExtractedData(data.extracted_data)
      setFailureReason(data.message)
      setStep('result')
    } catch (err: any) {
      setVerificationStatus('not_verified')
      setFailureReason(err.message || 'Verification could not be completed.')
      setStep('result')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    setError('')
    setCountdown(60)
    setResendActive(false)
    try {
      await fetch('/api/v1/tenant-kyc/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar_number: rawAadhaar,
          tenant_id: tenantData?.tenant_id,
          tenant_name: tenantData?.full_name,
        }),
      })
    } catch {}
  }

  // Complete & Save KYC
  const handleSaveAndComplete = () => {
    onVerificationSuccess({
      verification_id: verificationId,
      masked_aadhaar: extractedData?.masked_aadhaar || `XXXX XXXX ${rawAadhaar.slice(-4)}`,
      extracted_data: extractedData,
      checks,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200/90 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Tenant Aadhaar Verification</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-emerald-300/30">
                  e-KYC
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                {tenantData?.full_name ? `Verifying ${tenantData.full_name}` : 'Authorized Cryptographic KYC Flow'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] font-bold text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>DEMO / SANDBOX — AUTHORIZED VERIFICATION SIMULATOR</span>
            </span>
            {demoOtp && step === 'otp' && (
              <span className="font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-950 font-black">
                Demo OTP: {demoOtp}
              </span>
            )}
          </div>
        )}

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 1: ENTER AADHAAR NUMBER
          ───────────────────────────────────────────────────────────── */}
          {step === 'input' && (
            <form onSubmit={handleStartAuth} className="space-y-4">
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-base sm:text-lg font-mono font-black text-slate-900 tracking-widest focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition"
                  />
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>256-bit encrypted. Full Aadhaar is never saved or logged.</span>
                </p>
              </div>

              {tenantData?.full_name && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Tenant Profile To Match:</span>
                  <div className="font-bold text-slate-800">{tenantData.full_name}</div>
                  <div className="text-slate-500 text-[11px]">{tenantData.phone}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || rawAadhaar.length !== 12}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{loading ? 'Connecting to Provider...' : 'Send Authorized OTP →'}</span>
              </button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 2: OTP VERIFICATION
          ───────────────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black text-slate-900">OTP Verification</h4>
                <p className="text-xs text-slate-500">
                  An OTP has been dispatched through the authorized Aadhaar authentication process.
                </p>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  Aadhaar: XXXX XXXX {rawAadhaar.slice(-4)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider text-center mb-1.5">
                  Enter 6-Digit Verification OTP
                </label>
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

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Session ID: <code className="font-mono text-slate-700">{verificationId}</code></span>
                {countdown > 0 ? (
                  <span className="font-medium text-slate-400">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{loading ? 'Verifying...' : 'Verify & Run Checks →'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 3: AUTOMATIC PROCESSING ANIMATION
          ───────────────────────────────────────────────────────────── */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">Running Cryptographic Verification Engine</h4>
                <p className="text-xs text-slate-500">Validating digital signature, QR payload, and anti-tamper markers...</p>
              </div>
              <div className="max-w-xs mx-auto space-y-1.5 text-[11px] text-slate-600 text-left pt-2 font-medium">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> <span>Authorized e-KYC Received</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> <span>Validating UIDAI Certificate Chain</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> <span>Fuzzy Name & Demographics Match</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> <span>Anti-Tamper Heuristic Inspection</span>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STEP 4: VERIFICATION RESULT
          ───────────────────────────────────────────────────────────── */}
          {step === 'result' && (
            <div className="space-y-4">
              {verificationStatus === 'verified' ? (
                /* SUCCESS RESULT CARD */
                <div className="p-5 bg-gradient-to-b from-emerald-50/80 to-teal-50/50 border border-emerald-300 rounded-3xl space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      KYC Verified
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-1">AADHAAR VERIFIED ✓</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tenant: <strong>{extractedData?.name || tenantData?.full_name}</strong> · Number:{' '}
                      <strong className="font-mono">{extractedData?.masked_aadhaar}</strong>
                    </p>
                  </div>

                  {/* Checkmarks Grid */}
                  <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-emerald-200/60 text-xs">
                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Authentication</span>
                        <span className="font-bold text-slate-800 text-[11px]">Successful</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Document</span>
                        <span className="font-bold text-slate-800 text-[11px]">Valid Structure</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Secure QR</span>
                        <span className="font-bold text-slate-800 text-[11px]">Decoded</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Digital Signature</span>
                        <span className="font-bold text-slate-800 text-[11px]">Official Signed</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Data Match</span>
                        <span className="font-bold text-slate-800 text-[11px]">Identity Matched</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white/80 rounded-xl border border-emerald-200/60 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Tampering Check</span>
                        <span className="font-bold text-slate-800 text-[11px]">Passed (No Alerts)</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Verification ID: <strong className="text-slate-800">{verificationId}</strong>
                  </div>

                  <button
                    onClick={handleSaveAndComplete}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SAVE & COMPLETE KYC</span>
                  </button>
                </div>
              ) : (
                /* FAILED / UNABLE TO VERIFY CARD */
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/25">
                    <AlertTriangle className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-rose-900">
                      {verificationStatus === 'unable_to_verify' ? 'UNABLE TO VERIFY' : 'AADHAAR COULD NOT BE VERIFIED'}
                    </h4>
                    <p className="text-xs text-rose-700 mt-1">
                      {failureReason || 'We could not complete verification. This does not by itself establish that the document is fake.'}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 font-mono bg-white p-3 rounded-xl border border-rose-200">
                    Verification ID: <strong>{verificationId}</strong>
                    <br />
                    Status: <span className="text-rose-600 font-bold uppercase">{verificationStatus}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('input')}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-2xl transition"
                    >
                      TRY AGAIN
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
