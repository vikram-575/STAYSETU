'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Eye, EyeOff, Loader2, Lock, Mail,
  ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, Star, Phone, User, Briefcase, Calendar,
  KeyRound, Shield, Check, Info, RefreshCw
} from 'lucide-react'

type FlowStep = 'mobile_entry' | 'existing_otp' | 'new_details' | 'optional_aadhaar'

const PROFESSIONS = [
  'IT & Software Engineer',
  'Corporate Professional',
  'Student / Scholar',
  'Medical & Healthcare',
  'Banking & Finance',
  'Civil Services / Government',
  'Freelancer / Creative',
  'Business / Self-Employed',
  'Other',
]

function UnifiedLoginForm() {
  const router = useRouter()

  // Steps state
  const [step, setStep] = useState<FlowStep>('mobile_entry')
  const [usePasswordLogin, setUsePasswordLogin] = useState(false)

  // Form Fields
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [age, setAge] = useState('')
  const [profession, setProfession] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [aadhaarOtp, setAadhaarOtp] = useState('')
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false)
  const [aadhaarVerified, setAadhaarVerified] = useState(false)

  // Password Login Fields (For existing Owners / Superadmin fallback)
  const [passwordEmail, setPasswordEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [existingUserInfo, setExistingUserInfo] = useState<any>(null)

  // Clean 10-digit mobile
  const cleanMobile = (m: string) => m.replace(/\D/g, '').slice(-10)

  // 1. Submit Mobile Number
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')

    const cleaned = cleanMobile(mobile)
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)
    try {
      // Step A: Check if mobile exists
      const checkRes = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-mobile', mobile: cleaned }),
      })
      const checkData = await checkRes.json()

      if (!checkRes.ok) {
        throw new Error(checkData.error || 'Failed to verify mobile number.')
      }

      // Send OTP
      const otpRes = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', mobile: cleaned }),
      })
      const otpData = await otpRes.json()
      if (otpData.devOtp) {
        setDevOtp(otpData.devOtp)
      }

      if (checkData.exists) {
        // Existing user -> OTP login
        setExistingUserInfo(checkData)
        setInfoMessage(`Welcome back! An OTP has been sent to +91 ${cleaned}`)
        setStep('existing_otp')
      } else {
        // New user -> Details & Verification
        setInfoMessage(`Verification code sent to +91 ${cleaned}`)
        setStep('new_details')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Verify OTP for Existing User
  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleaned = cleanMobile(mobile)
    try {
      const res = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp-login',
          mobile: cleaned,
          otp: otp.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP. Please try again.')
      }

      window.location.href = data.redirect || '/my-profile'
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.')
      setLoading(false)
    }
  }

  // 3. Submit New User Required Details & Advance to Aadhaar Step
  const handleNewDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP sent to your mobile.')
      return
    }
    if (!gender) {
      setError('Please select your gender.')
      return
    }
    if (!age || Number(age) < 16 || Number(age) > 100) {
      setError('Please enter a valid age (16-100).')
      return
    }
    if (!profession) {
      setError('Please select your profession.')
      return
    }

    // Advance to optional Aadhaar step
    setStep('optional_aadhaar')
  }

  // 4. Finalize Registration (With or Without Aadhaar)
  const handleFinalizeRegistration = async (skipAadhaar = false) => {
    setError('')
    setLoading(true)

    const cleaned = cleanMobile(mobile)
    try {
      const res = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-new-user',
          mobile: cleaned,
          full_name: fullName,
          gender,
          age: Number(age),
          profession,
          email: email.trim() || undefined,
          aadhaar_number: skipAadhaar ? undefined : aadhaarNumber.replace(/\D/g, ''),
          aadhaar_verified: skipAadhaar ? false : aadhaarVerified,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.')
      }

      window.location.href = '/my-profile'
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
      setLoading(false)
    }
  }

  // 5. Password Login fallback (For PG Owners & Superadmin)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: passwordEmail.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.')
      }

      window.location.href = '/my-profile'
    } catch (err: any) {
      setError(err.message || 'Login failed.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-md ring-2 ring-[#DCFCE7]">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#14532D]">PGSetu</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {step === 'mobile_entry' && !usePasswordLogin && 'Sign In or Create Profile'}
          {step === 'existing_otp' && 'Verify Mobile Number'}
          {step === 'new_details' && 'Set Up Your Profile'}
          {step === 'optional_aadhaar' && 'Identity Verification'}
          {usePasswordLogin && 'Owner & Staff Password Login'}
        </h1>
        <p className="mt-1 text-xs text-gray-600">
          {step === 'mobile_entry' && !usePasswordLogin && 'One unified login for tenants, PG owners, and residents.'}
          {step === 'existing_otp' && `Enter the 6-digit code sent to +91 ${cleanMobile(mobile)}`}
          {step === 'new_details' && 'Required details to create your verified PGSetu profile.'}
          {step === 'optional_aadhaar' && 'Optional government KYC for instant verified badge.'}
          {usePasswordLogin && 'Sign in using your registered email and password.'}
        </p>
      </div>

      {/* Info / Success banner */}
      {infoMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Development OTP helper box */}
      {devOtp && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <span>OTP Code:</span>
            <span className="bg-amber-200 px-2 py-0.5 rounded text-amber-950 text-sm tracking-widest">{devOtp}</span>
          </div>
          <button
            type="button"
            onClick={() => setOtp(devOtp)}
            className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. MOBILE NUMBER ENTRY */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'mobile_entry' && !usePasswordLogin && (
        <form onSubmit={handleMobileSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-gray-300 bg-white shadow-xs focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/20">
              <span className="pl-3.5 pr-2 text-xs font-bold text-gray-500 select-none">+91</span>
              <input
                type="tel"
                maxLength={10}
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit mobile"
                className="w-full py-2.5 pr-3 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                autoFocus
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              We will check if you are an existing member or help you set up a new profile.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || cleanMobile(mobile).length < 10}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Continue with Mobile</span><ArrowRight className="h-4 w-4" /></>}
          </button>

          <div className="pt-3 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={() => setUsePasswordLogin(true)}
              className="text-xs font-semibold text-gray-600 hover:text-[#14532D] transition inline-flex items-center gap-1"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Owner & Admin Password Login →</span>
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2A. EXISTING USER OTP VERIFICATION */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'existing_otp' && (
        <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
          <div className="rounded-xl bg-[#F7FAF7] p-3 border border-gray-200 text-xs text-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">
                {existingUserInfo?.name || 'Registered Account'}
              </span>
              <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#14532D]">
                Existing User
              </span>
            </div>
            <div className="mt-1 text-gray-500 font-mono">+91 {cleanMobile(mobile)}</div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Enter 6-Digit OTP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 123456"
              className="w-full px-4 py-2.5 text-center tracking-[0.3em] font-mono text-lg font-bold rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify & Sign In</span><Check className="h-4 w-4" /></>}
          </button>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('mobile_entry')
                setOtp('')
              }}
              className="text-gray-500 hover:text-gray-900"
            >
              ← Change Mobile
            </button>
            <button
              type="button"
              onClick={() => setUsePasswordLogin(true)}
              className="font-semibold text-[#14532D] hover:underline"
            >
              Use Password Instead
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2B. NEW USER DETAILS (NAME, GENDER, AGE, PROFESSION, EMAIL) */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'new_details' && (
        <form onSubmit={handleNewDetailsSubmit} className="space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-[#14532D] pb-1 border-b border-gray-200">
            <span>Step 1 of 2: Required Details</span>
            <span className="text-[10px] text-gray-500 font-normal">Next: Identity Verification</span>
          </div>

          {/* OTP Verification for Mobile */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Verify Mobile OTP (+91 {cleanMobile(mobile)}) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full px-3 py-2 text-center tracking-widest font-mono font-bold rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none text-sm"
              autoFocus
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
            />
          </div>

          {/* Gender Pills */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'male', label: '👨 Male' },
                { id: 'female', label: '👩 Female' },
                { id: 'other', label: '🧑 Other' },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    gender === g.id
                      ? 'border-[#14532D] bg-[#14532D] text-white shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age & Email Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={16}
                max={100}
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 24"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Email
                </label>
                <span className="text-[10px] text-gray-400 font-medium">Optional</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@mail.com"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
              />
            </div>
          </div>

          {/* Profession */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Profession / Occupation <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 bg-white focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
            >
              <option value="">Select your profession...</option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!fullName.trim() || !gender || !age || !profession || otp.length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
          >
            <span>Next: Identity Verification</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setStep('mobile_entry')}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              ← Back to Mobile Number
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. OPTIONAL AADHAAR KYC VERIFICATION */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'optional_aadhaar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#14532D] pb-1 border-b border-gray-200">
            <span>Step 2 of 2: Government ID</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Optional
            </span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D] shrink-0">
                <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Verify Aadhaar with DigiLocker</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Instantly verify identity for zero-deposit booking guarantees and instant check-in approval.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  12-Digit Aadhaar Number (Optional)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChange={(e) => {
                    setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))
                    setAadhaarVerified(false)
                  }}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full px-3.5 py-2 font-mono tracking-widest text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none"
                />
              </div>

              {aadhaarNumber.length === 12 && !aadhaarVerified && (
                <div className="pt-1">
                  {!aadhaarOtpSent ? (
                    <button
                      type="button"
                      onClick={() => setAadhaarOtpSent(true)}
                      className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
                    >
                      Send Aadhaar OTP
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={aadhaarOtp}
                        onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit Aadhaar OTP"
                        className="w-full px-3 py-1.5 text-center tracking-widest font-mono text-sm rounded-lg border border-gray-300 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setAadhaarVerified(true)}
                        className="w-full py-2 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition"
                      >
                        Confirm Aadhaar Verification
                      </button>
                    </div>
                  )}
                </div>
              )}

              {aadhaarVerified && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Aadhaar Verified Successfully via Sandbox!</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary & Skip Buttons */}
          <div className="space-y-2 pt-2">
            {aadhaarVerified ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleFinalizeRegistration(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Finish & Open My Profile</span><Check className="h-4 w-4" /></>}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleFinalizeRegistration(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Skip for Now & Open Profile</span><ArrowRight className="h-4 w-4" /></>}
                </button>
                <p className="text-center text-[11px] text-gray-400">
                  You can verify Aadhaar anytime from your profile dashboard.
                </p>
              </>
            )}
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setStep('new_details')}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              ← Back to Details
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. PASSWORD LOGIN FALLBACK (OWNERS & SUPERADMIN) */}
      {/* ────────────────────────────────────────────────────────── */}
      {usePasswordLogin && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email or Mobile <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={passwordEmail}
              onChange={(e) => setPasswordEmail(e.target.value)}
              placeholder="e.g. owner@pgsetu.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In with Password</span>}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setUsePasswordLogin(false)
                setStep('mobile_entry')
              }}
              className="text-xs font-semibold text-[#14532D] hover:underline"
            >
              ← Back to Mobile OTP Login
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col justify-between selection:bg-[#DCFCE7] selection:text-[#14532D]">
      {/* Top Mobile Bar */}
      <div className="lg:hidden bg-[#14532D] text-white px-4 py-3 flex items-center justify-between border-b border-[#16A34A]/30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#16A34A] to-[#DCFCE7] flex items-center justify-center text-[#14532D] shadow-sm font-black">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight">PGSetu</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-bold bg-[#DCFCE7] text-[#14532D] px-3 py-1.5 rounded-full hover:bg-white transition flex items-center gap-1"
        >
          <span>Explore Spaces</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="w-full flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-screen">
        {/* Left Side: Illustration / Brand Story */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#14532D] via-[#166534] to-[#0F3E22] text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md ring-1 ring-white/20">
                <Building2 className="h-5 w-5 text-[#DCFCE7]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">PGSetu</span>
            </Link>

            <div className="mt-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7]/20 px-3 py-1 text-xs font-bold text-[#DCFCE7] backdrop-blur-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Unified Tenant & Owner Auth</span>
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white">
                One Account for All Your PG & Coliving Needs.
              </h2>
              <p className="mt-3 text-sm text-gray-200 leading-relaxed">
                Whether you are renting a room or running 100+ beds, PGSetu unifies tenant passbooks, real-time rent receipts, and smart property management under a single mobile identity.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-8 border-t border-white/10 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#DCFCE7]" />
              <span>Instant mobile login with 6-digit OTP</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#DCFCE7]" />
              <span>Single permanent Unique Universal Tenant ID</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#DCFCE7]" />
              <span>Optional instant DigiLocker Aadhaar KYC</span>
            </div>
          </div>
        </div>

        {/* Right Side: Unified Form */}
        <div className="flex-1 lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" /></div>}>
            <UnifiedLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
