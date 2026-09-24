'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Loader2, ShieldCheck, CheckCircle2,
  ArrowRight, ArrowLeft, User, Check, AlertCircle, Phone, RefreshCw
} from 'lucide-react'
import { setupRecaptcha, sendPhoneOtp } from '@/lib/firebase/auth'
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'

type FlowStep = 'role_select' | 'mobile_entry' | 'otp_verification' | 'new_owner_details' | 'owner_not_found' | 'new_details' | 'optional_aadhaar'
type AccountType = 'tenant' | 'owner'

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
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')

  // Account Type: tenant or owner
  const [accountType, setAccountType] = useState<AccountType>(roleParam === 'owner' ? 'owner' : 'tenant')

  // Steps state: defaults to 'role_select' unless a valid role is passed in URL
  const [step, setStep] = useState<FlowStep>(
    roleParam === 'owner' || roleParam === 'tenant' ? 'mobile_entry' : 'role_select'
  )

  // Form Fields
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [age, setAge] = useState('')
  const [profession, setProfession] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [aadhaarOtp, setAadhaarOtp] = useState('')
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false)
  const [aadhaarVerified, setAadhaarVerified] = useState(false)

  // Tenant Form Fields
  const [dob, setDob] = useState('')

  // Owner Personal Details Form Fields (personal details only, no PG created on signup)
  const [ownerName, setOwnerName] = useState('')
  const [ownerDob, setOwnerDob] = useState('')
  const [ownerGender, setOwnerGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [ownerCity, setOwnerCity] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')

  // Firebase Phone Auth Confirmation & ID Token
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const confirmationResultRef = useRef<ConfirmationResult | null>(null)
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
  const [idToken, setIdToken] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(0)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [existingUserInfo, setExistingUserInfo] = useState<any>(null)

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Recaptcha verifier helper
  const getOrCreateVerifier = () => {
    if (typeof window === 'undefined') return null
    try {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch {}
        recaptchaVerifierRef.current = null
      }
      const verifier = setupRecaptcha('recaptcha-container')
      recaptchaVerifierRef.current = verifier
      return verifier
    } catch (e) {
      console.warn('[Recaptcha Setup Warning]:', e)
      return null
    }
  }

  // Clean 10-digit mobile
  const cleanMobile = (m: string) => m.replace(/\D/g, '').slice(-10)

  // 1. Submit Mobile Number -> sends real SMS OTP via Firebase Phone Auth
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
      // Step A: Check mobile existence & role in PG-Setu DB (skip redundant Supabase SMS since Firebase will send SMS)
      const checkRes = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-mobile', mobile: cleaned, role: accountType, skipOtpDispatch: true }),
      })
      const checkData = await checkRes.json()

      if (!checkRes.ok) {
        throw new Error(checkData.error || 'Failed to verify mobile number.')
      }
      setExistingUserInfo(checkData)

      // Step B: Dispatch real SMS OTP via Firebase Phone Auth
      const verifier = getOrCreateVerifier()
      if (!verifier) {
        throw new Error('Security check (reCAPTCHA) initialization failed. Please refresh the page.')
      }

      const confirmation = await sendPhoneOtp(cleaned, verifier)
      setConfirmationResult(confirmation)
      confirmationResultRef.current = confirmation

      setOtp('')
      setCountdown(30)
      setInfoMessage(`Real OTP sent via SMS to +91 ${cleaned}`)
      // Advance to the OTP verification screen
      setStep('otp_verification')
    } catch (err: any) {
      console.error('[handleMobileSubmit error]:', err)
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear()
        } catch {}
        recaptchaVerifierRef.current = null
      }

      let msg = err.message || 'Something went wrong. Please try again.'
      if (err.code === 'auth/invalid-phone-number') {
        msg = 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.'
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many requests from this device. Please wait a few moments and try again.'
      } else if (err.code === 'auth/quota-exceeded') {
        msg = 'SMS quota limit reached. Please try again later.'
      } else if (err.code === 'auth/captcha-check-failed') {
        msg = 'Security verification failed. Please refresh the page and try again.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // 1B. Resend Real SMS OTP via Firebase Phone Auth
  const handleResendOtp = async () => {
    if (loading || countdown > 0) return
    setError('')
    setInfoMessage('')
    setLoading(true)

    const cleaned = cleanMobile(mobile)
    try {
      const verifier = getOrCreateVerifier()
      if (!verifier) {
        throw new Error('Could not re-initialize security verification. Please refresh.')
      }

      const confirmation = await sendPhoneOtp(cleaned, verifier)
      setConfirmationResult(confirmation)
      confirmationResultRef.current = confirmation
      setCountdown(30)
      setInfoMessage(`New OTP code sent via SMS to +91 ${cleaned}`)
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP code.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Fill OTP Here & Continue Next
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const userOtp = otp.trim()
    if (userOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP.')
      return
    }

    setLoading(true)
    const cleaned = cleanMobile(mobile)
    try {
      let firebaseToken: string | undefined = undefined

      // If Firebase Phone Auth confirmation is active, confirm the OTP with Firebase
      if (confirmationResultRef.current) {
        try {
          const userCredential = await confirmationResultRef.current.confirm(userOtp)
          if (userCredential?.user) {
            firebaseToken = await userCredential.user.getIdToken()
            setIdToken(firebaseToken)
          }
        } catch (fbErr: any) {
          console.error('[Firebase OTP Confirm Error]:', fbErr)
          if (fbErr.code === 'auth/invalid-verification-code') {
            throw new Error('Invalid OTP code. Please enter the correct code received on your phone.')
          } else if (fbErr.code === 'auth/code-expired') {
            throw new Error('The OTP code has expired. Please click "Resend OTP" to get a new code.')
          } else {
            throw new Error(fbErr.message || 'OTP verification failed.')
          }
        }
      }

      // Exchange with backend session (passes idToken for Third-Party Auth)
      const res = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp-login',
          mobile: cleaned,
          otp: userOtp,
          idToken: firebaseToken,
          role: accountType,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP. Please check the code and try again.')
      }

      // If user exists for this role -> immediately redirect!
      if (data.redirect && data.exists !== false) {
        window.location.href = data.redirect
        return
      }

      // Mobile is verified, but user is not registered in this role:
      setExistingUserInfo(data)
      setInfoMessage('')

      if (accountType === 'owner') {
        // PG Owner account not found -> immediately ask basic information and details!
        setStep('new_owner_details')
      } else {
        // Tenant profile does not exist yet -> show profile setup details
        setStep('new_details')
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the OTP.')
    } finally {
      setLoading(false)
    }
  }

  // 2B. Switch to alternate Tenant account if registered as tenant
  const handleSwitchToTenant = async () => {
    setLoading(true)
    setError('')
    const cleaned = cleanMobile(mobile)
    try {
      const res = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp-login',
          mobile: cleaned,
          otp: otp.trim(),
          role: 'tenant',
        }),
      })
      const data = await res.json()
      if (data.redirect) {
        window.location.href = data.redirect
      } else {
        window.location.href = '/my-profile'
      }
    } catch {
      window.location.href = '/my-profile'
    } finally {
      setLoading(false)
    }
  }

  // Helper to handle Tenant DOB changes and auto-calculate age
  const handleTenantDobChange = (val: string) => {
    setDob(val)
    if (val) {
      const birthDate = new Date(val)
      const today = new Date()
      let calculatedAge = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--
      }
      if (calculatedAge > 0 && calculatedAge < 120) {
        setAge(String(calculatedAge))
      }
    }
  }

  // 2C. Submit New PG Owner Personal Details & Register (No PG created on signup)
  const handleNewOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!ownerName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!ownerDob) {
      setError('Please enter your date of birth.')
      return
    }
    if (!ownerGender) {
      setError('Please select your gender.')
      return
    }
    if (!ownerCity.trim()) {
      setError('Please enter your city of residence.')
      return
    }

    setLoading(true)
    const cleaned = cleanMobile(mobile)

    try {
      const res = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-new-owner',
          mobile: cleaned,
          owner_name: ownerName.trim(),
          dob: ownerDob,
          gender: ownerGender,
          city: ownerCity.trim(),
          email: ownerEmail.trim() || undefined,
          idToken: idToken || undefined,
          pre_verified: true,
          otp: otp.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register owner account.')
      }

      window.location.href = data.redirect || '/my-profile'
    } catch (err: any) {
      setError(err.message || 'Failed to register owner account. Please try again.')
      setLoading(false)
    }
  }

  // 3. Submit New Tenant Details & Advance to Optional Aadhaar Step
  const handleNewDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!dob) {
      setError('Date of Birth is mandatory. Please enter your DOB.')
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

    if (!dob) {
      setError('Date of Birth is mandatory.')
      return
    }

    setLoading(true)

    const cleaned = cleanMobile(mobile)
    try {
      const res = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-new-user',
          mobile: cleaned,
          otp: otp.trim(),
          idToken: idToken || undefined,
          pre_verified: true,
          full_name: fullName,
          dob,
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
          {step === 'role_select' && 'Welcome to PGSetu'}
          {step === 'mobile_entry' && (accountType === 'owner' ? 'PG Owner Sign In' : 'Tenant & Resident Sign In')}
          {step === 'otp_verification' && 'Verify Mobile OTP'}
          {step === 'new_owner_details' && 'Set Up Your PG Account'}
          {step === 'owner_not_found' && 'Owner Account Not Found'}
          {step === 'new_details' && 'Set Up Your Profile'}
          {step === 'optional_aadhaar' && 'Identity Verification'}
        </h1>
        <p className="mt-1 text-xs text-gray-600">
          {step === 'role_select' && 'Please select whether you are a Tenant or a PG Owner to continue.'}
          {step === 'mobile_entry' && (accountType === 'owner' ? 'Enter your registered mobile number to access your PG Owner ERP dashboard.' : 'Enter your mobile number for passbooks, rent receipts, and bookings.')}
          {step === 'otp_verification' && `Enter the 6-digit OTP code sent to +91 ${cleanMobile(mobile)}`}
          {step === 'new_owner_details' && 'No PG account found. Enter basic details below to create your owner account and launch your dashboard.'}
          {step === 'owner_not_found' && 'Mobile verified, but no registered PG owner profile was found.'}
          {step === 'new_details' && 'Enter required details to create your verified PGSetu profile.'}
          {step === 'optional_aadhaar' && 'Optional government KYC for instant verified badge.'}
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



      {/* Hidden Firebase Phone Auth ReCAPTCHA Container */}
      <div id="recaptcha-container"></div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 0. ROLE SELECTION STEP (FIRST QUESTION) */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'role_select' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Tenant / Resident Card */}
            <button
              type="button"
              onClick={() => {
                setAccountType('tenant')
                setStep('mobile_entry')
                setError('')
                setInfoMessage('')
              }}
              className="group relative flex items-start gap-3.5 rounded-2xl border-2 border-emerald-200 bg-white p-4 text-left shadow-xs transition-all hover:border-[#16A34A] hover:bg-emerald-50/40 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-xs group-hover:scale-105 transition">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-gray-900 group-hover:text-[#14532D]">
                    Tenant / Resident
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Renter / Student
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 leading-snug">
                  I am renting or looking for a PG. Access digital passbook, rent receipts, gate passes, and verified tenant ID.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                    ✓ Digital Passbook
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                    ✓ Rent Receipts
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                    ✓ Gate Passes
                  </span>
                </div>
              </div>
              <div className="self-center pl-1 text-gray-400 group-hover:text-[#16A34A] transition">
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>

            {/* PG Owner / Manager Card */}
            <button
              type="button"
              onClick={() => {
                setAccountType('owner')
                setStep('mobile_entry')
                setError('')
                setInfoMessage('')
              }}
              className="group relative flex items-start gap-3.5 rounded-2xl border-2 border-gray-200 bg-white p-4 text-left shadow-xs transition-all hover:border-[#14532D] hover:bg-emerald-50/40 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-950 text-white shadow-xs group-hover:scale-105 transition">
                <Building2 className="h-6 w-6 text-[#DCFCE7]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-gray-900 group-hover:text-[#14532D]">
                    PG Owner / Manager
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-800">
                    Property Host
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600 leading-snug">
                  I operate or manage a PG or hostel. Manage rooms, beds, automated rent collection, staff, and operations ERP.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                    ✓ Room & Bed Allocations
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                    ✓ Auto Rent ERP
                  </span>
                </div>
              </div>
              <div className="self-center pl-1 text-gray-400 group-hover:text-[#14532D] transition">
                <ArrowRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. MOBILE NUMBER ENTRY */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'mobile_entry' && (
        <form onSubmit={handleMobileSubmit} className="space-y-4">
          {/* Active Role Selector Pill */}
          <div className="flex items-center justify-between rounded-xl bg-gray-100 p-2.5 border border-gray-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-800">
              {accountType === 'owner' ? (
                <Building2 className="h-4 w-4 text-[#14532D]" />
              ) : (
                <User className="h-4 w-4 text-[#16A34A]" />
              )}
              <span>
                Role: <span className="text-[#14532D]">{accountType === 'owner' ? 'PG Owner / Host' : 'Tenant / Resident'}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('role_select')
                setError('')
                setInfoMessage('')
              }}
              className="text-[11px] font-bold text-[#14532D] hover:underline"
            >
              Change Role
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {accountType === 'owner' ? 'Registered PG Owner Mobile' : 'Tenant Mobile Number'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-gray-300 bg-white shadow-xs focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/20">
              <span className="pl-3.5 pr-2 text-xs font-bold text-gray-500 select-none">+91</span>
              <input
                type="tel"
                maxLength={10}
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={accountType === 'owner' ? 'Enter 10-digit registered mobile' : 'Enter 10-digit mobile'}
                className="w-full py-2.5 pr-3 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                autoFocus
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              We will send a 6-digit OTP code to verify your mobile number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || cleanMobile(mobile).length < 10}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Get OTP & Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('role_select')
                setError('')
              }}
              className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Role Selection</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-400 leading-snug pt-1">
            By continuing, you agree to PGSetu&apos;s{' '}
            <a href="/terms" target="_blank" className="text-[#14532D] font-semibold hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy-policy" target="_blank" className="text-[#14532D] font-semibold hover:underline">Privacy Policy</a>.
          </p>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. FILL OTP HERE TO CONTINUE NEXT */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'otp_verification' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="rounded-xl bg-[#F7FAF7] p-3 border border-gray-200 text-xs text-gray-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-900 block">
                {accountType === 'owner' ? '🏢 PG Owner Account' : '👤 Tenant Account'}
              </span>
              <span className="text-gray-500 font-mono text-xs">+91 {cleanMobile(mobile)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('mobile_entry')
                setOtp('')
                setError('')
              }}
              className="text-[11px] font-bold text-[#14532D] hover:underline"
            >
              Change
            </button>
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
              placeholder="------"
              className="w-full px-4 py-3 text-center tracking-[0.3em] font-mono text-xl font-bold rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-gray-500 text-center font-medium">
              Fill OTP here to continue next
            </p>
          </div>

          {/* Prominent Continue Button */}
          <button
            type="submit"
            disabled={loading || otp.trim().length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Verify OTP & Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Resend Real SMS OTP with Countdown */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <span className="text-gray-500">Didn&apos;t receive SMS?</span>
            <button
              type="button"
              disabled={loading || countdown > 0}
              onClick={handleResendOtp}
              className="font-bold text-[#14532D] hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend Real OTP'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('mobile_entry')
                setOtp('')
                setError('')
              }}
              className="text-gray-500 hover:text-gray-900"
            >
              ← Change Mobile Number
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('role_select')
                setOtp('')
                setError('')
              }}
              className="font-bold text-[#14532D] hover:underline"
            >
              Switch Role
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2B. NEW PG OWNER REGISTRATION (PERSONAL DETAILS ONLY) */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'new_owner_details' && (
        <form onSubmit={handleNewOwnerSubmit} className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Mobile +91 {cleanMobile(mobile)} Verified!</span>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-950">
            <span className="font-bold block text-blue-900">Owner Profile Registration</span>
            <span className="text-gray-600">
              Enter your personal details to register as a PG Owner. The ERP platform and property listing remain securely locked until our Verification Team reviews and finishes your onboarding.
            </span>
          </div>

          {/* Alternate Tenant Account if found */}
          {existingUserInfo?.hasAlternateAccount === 'tenant' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-950 block">Registered Tenant Profile Found!</span>
                  <span className="text-amber-800 text-[11px]">{existingUserInfo.alternateName || 'Resident'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToTenant}
                  disabled={loading}
                  className="rounded-lg bg-[#14532D] text-white px-2.5 py-1 text-[11px] font-bold hover:bg-[#166534] transition flex items-center gap-1"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Open Tenant Profile →</span>}
                </button>
              </div>
            </div>
          )}

          {/* Owner Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Vikram Sharma"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
              autoFocus
            />
          </div>

          {/* DOB & Gender Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={ownerDob}
                onChange={(e) => setOwnerDob(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'male', label: 'Male' },
                  { id: 'female', label: 'Female' },
                  { id: 'other', label: 'Other' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setOwnerGender(g.id as any)}
                    className={`py-2 rounded-xl text-xs font-bold border transition text-center ${
                      ownerGender === g.id
                        ? 'border-[#14532D] bg-[#14532D] text-white shadow-xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* City of Residence */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              City of Residence <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              list="owner-residence-cities"
              value={ownerCity}
              onChange={(e) => setOwnerCity(e.target.value)}
              placeholder="e.g. Bangalore, Delhi, Jaipur..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
            />
            <datalist id="owner-residence-cities">
              <option value="Bangalore" />
              <option value="Delhi" />
              <option value="Gurgaon" />
              <option value="Noida" />
              <option value="Kota" />
              <option value="Pune" />
              <option value="Hyderabad" />
              <option value="Mumbai" />
              <option value="Jaipur" />
              <option value="Dehradun" />
              <option value="Indore" />
              <option value="Chennai" />
              <option value="Ahmedabad" />
              <option value="Chandigarh" />
            </datalist>
          </div>

          {/* Owner Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Email Address
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Optional</span>
            </div>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="e.g. owner@gmail.com"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !ownerName.trim() || !ownerDob || !ownerGender || !ownerCity.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <User className="h-4 w-4" />
                <span>Register as PG Owner</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Navigation */}
          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('mobile_entry')
                setOtp('')
                setError('')
              }}
              className="text-gray-500 hover:text-gray-900"
            >
              ← Change Mobile Number
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('role_select')
                setOtp('')
                setError('')
              }}
              className="font-bold text-[#14532D] hover:underline"
            >
              Switch Role
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. OWNER ACCOUNT NOT FOUND NOTICE */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'owner_not_found' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Mobile +91 {cleanMobile(mobile)} Verified Successfully!</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  No PG Owner Account Found
                </h3>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  The mobile number <span className="font-mono font-bold">+91 {cleanMobile(mobile)}</span> is verified, but not currently registered to any PG property or owner profile on PGSetu.
                </p>
              </div>
            </div>

            {/* If registered as tenant instead */}
            {existingUserInfo?.hasAlternateAccount === 'tenant' && (
              <div className="mt-3 rounded-xl bg-white border border-amber-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">
                      Registered Tenant Profile Found!
                    </span>
                    <span className="text-[11px] text-gray-600">
                      {existingUserInfo.alternateName || 'Resident'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchToTenant}
                    disabled={loading}
                    className="rounded-lg bg-[#14532D] text-white px-3 py-1.5 text-[11px] font-bold hover:bg-[#166534] transition flex items-center gap-1"
                  >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span>Open Profile →</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setStep('new_owner_details')
                setError('')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
            >
              <User className="h-4 w-4" />
              <span>Register as PG Owner</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('mobile_entry')
                setMobile('')
                setOtp('')
                setError('')
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              <span>Try Another Mobile Number</span>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('role_select')
                setOtp('')
                setError('')
              }}
              className="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Choose Different Role</span>
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. NEW TENANT PROFILE DETAILS */}
      {/* ────────────────────────────────────────────────────────── */}
      {step === 'new_details' && (
        <form onSubmit={handleNewDetailsSubmit} className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Mobile +91 {cleanMobile(mobile)} Verified!</span>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-[#14532D] pb-1 border-b border-gray-200">
            <span>Step 1 of 2: Required Details</span>
            <span className="text-[10px] text-gray-500 font-normal">Next: Identity Verification</span>
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
              autoFocus
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

          {/* Date of Birth & Age Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={dob}
                onChange={(e) => handleTenantDobChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-none font-medium bg-white"
              />
            </div>
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
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Email Address
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

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleFinalizeRegistration(true)}
              disabled={loading || !fullName.trim() || !dob || !gender || !age || !profession}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Complete & Create Profile</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={loading || !fullName.trim() || !dob || !gender || !age || !profession}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-bold text-[#14532D] hover:bg-gray-50 transition"
            >
              <span>Optional: Verify Aadhaar ID (Instant Badge)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

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
      {/* 5. OPTIONAL AADHAAR KYC VERIFICATION */}
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
                  <span>Aadhaar Verified Successfully via UIDAI e-KYC!</span>
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
          href="/search"
          className="text-xs font-bold bg-[#DCFCE7] text-[#14532D] px-3 py-1.5 rounded-full hover:bg-white transition flex items-center gap-1"
        >
          <span>Search PG</span>
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
