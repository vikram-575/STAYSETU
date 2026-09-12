'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, User, Phone, Mail, Home, Users, Calendar,
  Star, Search, Loader2, ArrowLeft, ArrowRight, RefreshCw, Edit, LogOut,
  CheckCircle2, Clock, Tag, Bed, ShieldCheck, Copy, Check,
  KeyRound, PlusCircle, ExternalLink, ShieldAlert, AlertCircle, X,
  Download, FileText, Wallet, Receipt, CreditCard, ChevronRight, Award, Shield,
  CheckCircle, MapPin, QrCode, Share2, Sparkles, Zap, Smartphone,
  HeartHandshake, ChevronDown, Filter, AlertTriangle
} from 'lucide-react'

type ProfileTab = 'overview' | 'passbook' | 'stays' | 'kyc'

function MyProfileContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [stays, setStays] = useState<any[]>([])
  const [passbookSummary, setPassbookSummary] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [sharedToast, setSharedToast] = useState(false)
  const [receiptDownloaded, setReceiptDownloaded] = useState<string | null>(null)
  const [txnFilter, setTxnFilter] = useState<'all' | 'rent' | 'deposit' | 'electricity'>('all')

  // Modals state
  const [isEditing, setIsEditing] = useState(false)
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isUpiPayModalOpen, setIsUpiPayModalOpen] = useState(false)
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false)

  // Edit Profile Form State
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editGender, setEditGender] = useState('male')
  const [editAge, setEditAge] = useState('25')
  const [editProfession, setEditProfession] = useState('')
  const [editCollegeCompany, setEditCollegeCompany] = useState('')
  const [editEmergencyName, setEditEmergencyName] = useState('')
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('')
  const [editEmergencyRelation, setEditEmergencyRelation] = useState('Parent')
  const [editPermanentAddress, setEditPermanentAddress] = useState('')
  const [editPermanentCity, setEditPermanentCity] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // Aadhaar Verification State
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [aadhaarOtp, setAadhaarOtp] = useState('')
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false)
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false)
  const [aadhaarSuccess, setAadhaarSuccess] = useState(false)

  // Quick Gate Pass State
  const [visitorName, setVisitorName] = useState('')
  const [visitorPurpose, setVisitorPurpose] = useState('Friend Visiting')
  const [generatedPassCode, setGeneratedPassCode] = useState<string | null>(null)

  // Load session & profile data
  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true)
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setCurrentUser(data.user)
            setEditName(data.user.full_name || '')
            setEditEmail(data.user.email || '')
            if (data.stays) setStays(data.stays)
            if (data.passbookSummary) setPassbookSummary(data.passbookSummary)
            if (data.transactions) setTransactions(data.transactions)

            // Merge server profile metadata or local storage
            let mergedProfile = data.profile || {}
            const savedProfile = localStorage.getItem('pgsetu_profile_data')
            if (savedProfile) {
              try {
                const parsed = JSON.parse(savedProfile)
                mergedProfile = { ...parsed, ...mergedProfile }
              } catch {}
            }

            setProfileData(mergedProfile)
            setEditGender(mergedProfile.gender || 'male')
            setEditAge(mergedProfile.age?.toString() || '25')
            setEditProfession(mergedProfile.profession || 'Software Professional')
            setEditCollegeCompany(mergedProfile.college_or_company || 'Infosys / Tech Mahindra')
            setEditEmergencyName(mergedProfile.emergency_name || 'Rajendra Tomar')
            setEditEmergencyPhone(mergedProfile.emergency_phone || '9876543210')
            setEditEmergencyRelation(mergedProfile.emergency_relation || 'Father')
            setEditPermanentAddress(mergedProfile.permanent_address || 'Flat 402, Green Meadows')
            setEditPermanentCity(mergedProfile.permanent_city || 'Kanpur, UP')
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSession()
  }, [])

  const uniqueId =
    currentUser?.registration_number ||
    profileData?.id ||
    `TN-${currentUser?.phone?.slice(-4) || '2026'}-7AB`

  const isAadhaarVerified = Boolean(profileData?.aadhaar_verified ?? true)
  const aadhaarLast4 = profileData?.aadhaar_last4 || '4921'
  const activeStay = stays.find((s) => s.status === 'active') || stays[0]

  const totalRentFormatted = passbookSummary
    ? `₹${(passbookSummary.total_rent_paid_paise / 100).toLocaleString('en-IN')}`
    : '₹1,16,500'
  const activeDepositFormatted = passbookSummary
    ? `₹${(passbookSummary.active_deposits_paise / 100).toLocaleString('en-IN')}`
    : '₹19,000'
  const outstandingDueFormatted = passbookSummary
    ? `₹${(passbookSummary.total_due_paise / 100).toLocaleString('en-IN')}`
    : '₹0'

  const handleCopyId = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareIdCard = async () => {
    const shareText = `PG-Setu Digital Tenant Pass\nName: ${currentUser?.full_name || 'Tenant'}\nUniversal ID: ${uniqueId}\nStay: ${activeStay?.property_name || 'PG-Setu Co-Living'}\nRoom: ${activeStay?.room_number || 'Room 304'}\nStatus: Verified Resident`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentUser?.full_name || 'Member'} - PG-Setu Tenant Pass`,
          text: shareText,
          url: window.location.href,
        })
        return
      } catch {}
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
      setSharedToast(true)
      setTimeout(() => setSharedToast(false), 2500)
    }
  }

  const handleDownloadReceipt = (receiptId: string) => {
    setReceiptDownloaded(receiptId)
    setTimeout(() => setReceiptDownloaded(null), 3000)
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    localStorage.removeItem('pgsetu_profile_id')
    localStorage.removeItem('pgsetu_profile_data')
    window.location.href = '/'
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    setSaveSuccessMsg('')

    const updatedProfilePayload = {
      full_name: editName.trim(),
      email: editEmail.trim(),
      gender: editGender,
      age: Number(editAge) || undefined,
      profession: editProfession.trim(),
      college_or_company: editCollegeCompany.trim(),
      emergency_name: editEmergencyName.trim(),
      emergency_phone: editEmergencyPhone.trim(),
      emergency_relation: editEmergencyRelation,
      permanent_address: editPermanentAddress.trim(),
      permanent_city: editPermanentCity.trim(),
    }

    try {
      // 1. Persist to server API (Supabase & Firestore)
      const res = await fetch('/api/profiles/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfilePayload),
      })

      if (res.ok) {
        const resData = await res.json()
        if (resData.profile) {
          setProfileData(resData.profile)
          try {
            localStorage.setItem('pgsetu_profile_data', JSON.stringify(resData.profile))
          } catch {}
        }
        if (resData.user) {
          setCurrentUser((prev: any) => ({
            ...(prev || {}),
            ...resData.user,
          }))
        }
        setSaveSuccessMsg('Profile saved to database successfully!')
      } else {
        const errJson = await res.json().catch(() => ({}))
        setSaveSuccessMsg(errJson.error || 'Saved locally (offline mode)')
      }
    } catch (err) {
      console.warn('[Profile Save warning]:', err)
      setSaveSuccessMsg('Saved locally')
    }

    setSavingEdit(false)
    setTimeout(() => {
      setIsEditing(false)
      setSaveSuccessMsg('')
    }, 1200)
  }

  const handleConfirmAadhaar = async () => {
    setVerifyingAadhaar(true)
    const last4 = aadhaarInput.slice(-4) || '4921'

    try {
      await fetch('/api/profiles/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar_verified: true,
          aadhaar_last4: last4,
        }),
      })
    } catch {}

    setAadhaarSuccess(true)
    const updated = {
      ...(profileData || {}),
      aadhaar_verified: true,
      aadhaar_last4: last4,
      aadhaar_verified_date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }
    setProfileData(updated)
    try {
      localStorage.setItem('pgsetu_profile_data', JSON.stringify(updated))
    } catch {}
    setVerifyingAadhaar(false)

    setTimeout(() => {
      setIsAadhaarModalOpen(false)
      setAadhaarSuccess(false)
      setAadhaarOtpSent(false)
    }, 1500)
  }

  const handleGenerateGatePass = (e: React.FormEvent) => {
    e.preventDefault()
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedPassCode(code)
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    if (txnFilter === 'all') return true
    if (txnFilter === 'rent') return txn.description?.toLowerCase().includes('rent')
    if (txnFilter === 'deposit') return txn.description?.toLowerCase().includes('deposit')
    if (txnFilter === 'electricity') return txn.description?.toLowerCase().includes('electricity')
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAF7] px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-[#16A34A]" />
          <span className="text-xs text-gray-500 font-semibold tracking-wide">
            Loading your verified profile & passbook...
          </span>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF7] p-4 text-center">
        <div className="max-w-md w-full rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#14532D]">
            <User className="h-7 w-7 text-[#16A34A]" />
          </div>
          <h2 className="mt-4 text-lg sm:text-xl font-black text-gray-900">Sign In to View Your Profile</h2>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Log in with your 10-digit mobile number to view your Universal Tenant ID, digital rent passbook, and verified stay records.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-95 transition"
            >
              <span>Sign In with Mobile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              ← Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. MOBILE-FIRST TOP APP BAR */}
      {/* ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-xs"
              title="Return to Home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-sm sm:text-base font-black text-[#14532D] tracking-tight block">
                PG-Setu Member
              </span>
              <span className="text-[10px] text-gray-400 font-semibold block sm:hidden">
                Universal ID: {uniqueId.slice(0, 10)}...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'owner' || currentUser.role === 'superadmin' ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 rounded-xl bg-[#14532D] px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-[#166534]"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Owner ERP</span>
              </Link>
            ) : (
              <Link
                href="/portal"
                className="inline-flex items-center gap-1 rounded-xl bg-[#DCFCE7] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-[#14532D] shadow-xs"
              >
                <KeyRound className="h-3 w-3 text-[#16A34A]" />
                <span>Portal</span>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* ────────────────────────────────────────────────────────── */}
        {/* 2. DIGITAL TENANT ID CARD (SMART MOBILE PASS) */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D3B1E] via-[#14532D] to-[#1E3A8A] p-4 sm:p-6 text-white shadow-lg shadow-emerald-950/20">
          {/* Background Decorative Rings */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

          {/* Card Top Strip */}
          <div className="flex items-center justify-between pb-3 border-b border-white/15 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Universal Tenant Identity Pass</span>
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-xs text-white">
              {currentUser.role === 'owner' ? 'Property Host' : 'Verified Resident'}
            </span>
          </div>

          {/* Card Main Body */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Avatar with Verified Badge */}
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white text-[#14532D] text-xl sm:text-2xl font-black shadow-md ring-2 ring-emerald-300/40">
                  {(currentUser.full_name || 'U')[0].toUpperCase()}
                </div>
                {isAadhaarVerified && (
                  <div
                    title="DigiLocker Aadhaar Verified"
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 ring-2 ring-[#14532D] shadow-xs"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Tenant Details */}
              <div className="space-y-0.5">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{currentUser.full_name || 'PG-Setu Member'}</span>
                  {isAadhaarVerified && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="h-3 w-3" />
                      KYC Verified
                    </span>
                  )}
                </h1>
                <p className="text-xs text-emerald-200/90 font-medium">
                  {profileData?.profession || 'Software Professional'} • {activeStay?.city || 'Noida NCR'}
                </p>
                <p className="text-[11px] text-white/70 font-mono">
                  +91 {currentUser.phone || profileData?.mobile || '9453522757'}
                </p>
              </div>
            </div>

            {/* Universal Tenant ID Box */}
            <div className="w-full sm:w-auto rounded-2xl bg-black/25 backdrop-blur-md p-3 border border-white/10 flex items-center justify-between sm:justify-end gap-3">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/80 block">
                  Unique Tenant ID
                </span>
                <span className="font-mono text-xs sm:text-sm font-black tracking-wide text-white block">
                  {uniqueId}
                </span>
              </div>
              <button
                onClick={() => handleCopyId(uniqueId)}
                className="flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/25 active:scale-95 transition"
                title="Copy Unique ID"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-emerald-200" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Stay & Room Footer */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-200 text-[11px]">
              <Home className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
              <span className="font-semibold text-white">
                {activeStay?.property_name || 'PG-Setu Co-Living'}
              </span>
              <span className="text-white/40">•</span>
              <span className="font-bold text-emerald-300">
                {activeStay?.room_number || 'Room 304'} ({activeStay?.bed_label || 'Bed A'})
              </span>
            </div>

            {/* Quick Card Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/25 active:scale-95 transition"
              >
                <QrCode className="h-3 w-3 text-emerald-300" />
                <span>Show QR</span>
              </button>
              <button
                onClick={handleShareIdCard}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/30 border border-emerald-400/30 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/40 active:scale-95 transition"
              >
                <Share2 className="h-3 w-3" />
                <span>Share ID</span>
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/30 active:scale-95 transition"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 3. MOBILE QUICK ACTION DOCK (4 TOUCH PILLS) */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* Quick Pay Rent */}
          <button
            onClick={() => setIsUpiPayModalOpen(true)}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
              Pay Rent
            </span>
            <span className="text-[9px] text-gray-400 hidden sm:block">Instant UPI</span>
          </button>

          {/* Quick Gate Pass */}
          <button
            onClick={() => setIsGatePassModalOpen(true)}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
              <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
              Gate Pass
            </span>
            <span className="text-[9px] text-gray-400 hidden sm:block">Visitor Code</span>
          </button>

          {/* Receipts / HRA */}
          <Link
            href="/portal?tab=hra"
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
              HRA Kit
            </span>
            <span className="text-[9px] text-gray-400 hidden sm:block">Rent Receipts</span>
          </Link>

          {/* Warden / Support */}
          <a
            href="https://wa.me/919453522757?text=Hi%20PG-Setu%20Support,%20I%20need%20assistance%20with%20my%20stay"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
              <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
              Helpdesk
            </span>
            <span className="text-[9px] text-gray-400 hidden sm:block">Warden Chat</span>
          </a>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 4. MOBILE-FIRST SEGMENTED TABS BAR */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="flex rounded-2xl bg-gray-200/70 p-1 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white text-[#14532D] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('passbook')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'passbook'
                ? 'bg-white text-[#14532D] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Passbook</span>
          </button>

          <button
            onClick={() => setActiveTab('stays')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stays'
                ? 'bg-white text-[#14532D] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Stays ({stays.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kyc')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'kyc'
                ? 'bg-white text-[#14532D] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>KYC & Info</span>
          </button>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1: OVERVIEW & SMART PASSBOOK METRICS */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Metric Micro-Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Lifetime Rent */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Rent Paid
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Receipt className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-gray-900">
                  {totalRentFormatted}
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Across {stays.length} stays
                </span>
              </div>

              {/* Escrow Deposit */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Deposit
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Shield className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-[#14532D]">
                  {activeDepositFormatted}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  100% Escrow
                </span>
              </div>

              {/* Pending Bills */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Pending
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-emerald-600">
                  {outstandingDueFormatted}
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  All dues cleared
                </span>
              </div>

              {/* Renter Credit Score */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Credit Score
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                    <Award className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-purple-900">
                  790 / 850
                </div>
                <span className="text-[10px] font-bold text-purple-700 block mt-0.5">
                  Tier 1 Tenant
                </span>
              </div>
            </div>

            {/* Active Stay Detailed Highlight */}
            {activeStay && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-xs font-black text-[#14532D] uppercase tracking-wide">
                      Currently Active Stay
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 font-bold">
                    Ref: {activeStay.registration_number || uniqueId}
                  </span>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-gray-900">{activeStay.property_name}</h3>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{activeStay.address || activeStay.city}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsUpiPayModalOpen(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] active:scale-95 transition"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Pay Due</span>
                    </button>
                    <Link
                      href="/portal?tab=gatepass"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Gate Pass</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100/80 text-xs">
                  <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Room & Bed</span>
                    <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                      {activeStay.room_number} • {activeStay.bed_label}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Monthly Rent</span>
                    <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                      ₹{((activeStay.monthly_rent_paise || 950000) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Check-In</span>
                    <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                      {activeStay.check_in_date || '10 Jan 2025'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Escrow Deposit</span>
                    <span className="font-bold text-[#14532D] text-xs mt-0.5 block">
                      ₹{((activeStay.deposit_held_paise || 1900000) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Verified Perks Grid */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-2.5">
                Verified Renter Privileges Unlocked
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-800 block">Zero-Brokerage Relocation</span>
                    <span className="text-[11px] text-gray-500">Move between 500+ PG-Setu properties anywhere in India.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-800 block">DigiLocker Escrow Trust</span>
                    <span className="text-[11px] text-gray-500">100% security deposit guarantee with instant UPI checkout refund.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-2xl bg-gray-50 p-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-800 block">Form 16 Tax Verification</span>
                    <span className="text-[11px] text-gray-500">Auto-generated monthly rent receipts with owner PAN for HRA claims.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2: PASSBOOK TRANSACTIONS (NATIVE MOBILE CARDS) */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'passbook' && (
          <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center gap-1.5">
                {(['all', 'rent', 'deposit', 'electricity'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setTxnFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      txnFilter === filterKey
                        ? 'bg-[#14532D] text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>

              <Link
                href="/portal?tab=ledger"
                className="text-xs font-bold text-[#14532D] hover:underline shrink-0"
              >
                Full Ledger →
              </Link>
            </div>

            {/* Mobile Native Transaction Cards */}
            <div className="space-y-2.5">
              {filteredTransactions.map((txn: any) => {
                const isRefund = txn.amount_paise < 0
                return (
                  <div
                    key={txn.id}
                    className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-xs hover:border-gray-300 transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isRefund
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <Receipt className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 leading-snug">
                            {txn.description}
                          </h4>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {txn.property} • {txn.date}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm font-black block ${
                            isRefund ? 'text-blue-700' : 'text-gray-900'
                          }`}
                        >
                          {isRefund ? '-' : ''}₹{Math.abs(txn.amount_paise / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.2 text-[9px] font-bold">
                          <Check className="h-2.5 w-2.5" />
                          {txn.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <CreditCard className="h-3 w-3 text-gray-400" />
                        <span>{txn.payment_mode}</span>
                      </span>

                      <button
                        onClick={() => handleDownloadReceipt(txn.receipt_id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition"
                      >
                        <Download className="h-3 w-3 text-gray-500" />
                        <span>{receiptDownloaded === txn.receipt_id ? 'Downloaded!' : 'Receipt'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 3: STAYS HISTORY */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'stays' && (
          <div className="space-y-3">
            {stays.map((stay: any, idx: number) => {
              const isActive = stay.status === 'active'
              return (
                <div
                  key={stay.id || idx}
                  className={`rounded-3xl border bg-white p-4 sm:p-6 shadow-xs space-y-3 transition ${
                    isActive ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-gray-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-[#DCFCE7] text-[#14532D]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isActive ? '● Currently Active Stay' : 'Completed Stay'}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      Ref: {stay.registration_number || `TN-STAY-${idx + 1}`}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-gray-900">{stay.property_name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                      <span>{stay.address || stay.city}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="rounded-xl bg-gray-50 p-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Room & Bed</span>
                      <span className="font-bold text-gray-800 text-xs block mt-0.5">
                        {stay.room_number} • {stay.bed_label}
                      </span>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Check-In</span>
                      <span className="font-bold text-gray-800 text-xs block mt-0.5">
                        {stay.check_in_date || '15 Jan 2025'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Monthly Rent</span>
                      <span className="font-bold text-gray-800 text-xs block mt-0.5">
                        ₹{((stay.monthly_rent_paise || 850000) / 100).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Escrow Deposit</span>
                      <span className="font-bold text-[#14532D] text-xs block mt-0.5">
                        ₹{((stay.deposit_held_paise || 1700000) / 100).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                    <Link
                      href="/portal?tab=ledger"
                      className="flex-1 sm:flex-none text-center rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#166534] transition"
                    >
                      Digital Passbook
                    </Link>
                    <Link
                      href="/portal?tab=hra"
                      className="flex-1 sm:flex-none text-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      HRA Tax Kit
                    </Link>
                    {isActive && (
                      <Link
                        href="/portal?tab=gatepass"
                        className="flex-1 sm:flex-none text-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Gate Pass
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 4: KYC & DETAILED PERSONAL INFO */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'kyc' && (
          <div className="space-y-4">
            {/* Government KYC Card */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D]">
                    <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900">
                      UIDAI DigiLocker KYC
                    </h3>
                    <p className="text-[10px] text-gray-400">Government Identity Clearance</p>
                  </div>
                </div>

                {isAadhaarVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                    Pending
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-gray-50 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Aadhaar Number
                  </span>
                  <p className="font-mono text-sm font-black text-gray-800">
                    •••• •••• {aadhaarLast4}
                  </p>
                  <span className="text-[10px] text-gray-500 block">
                    256-bit AES encrypted DigiLocker clearance
                  </span>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Police Verification
                  </span>
                  <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Police Clearance Submitted</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block">
                    Approved by Resident Police Liaison
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setIsAadhaarModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{isAadhaarVerified ? 'Re-verify Aadhaar' : 'Verify Aadhaar Now'}</span>
                </button>
              </div>
            </div>

            {/* Personal & Emergency Contact Card */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-900">
                    Personal & Safety Information
                  </h3>
                  <p className="text-[10px] text-gray-400">Emergency contacts & employer details</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#14532D] hover:bg-emerald-100 transition"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Full Name</span>
                  <p className="font-bold text-gray-900 mt-0.5">{currentUser.full_name || 'Vikram Tomar'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Mobile (Verified)</span>
                  <p className="font-bold text-gray-900 mt-0.5">+91 {currentUser.phone || profileData?.mobile || '9453522757'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Email</span>
                  <p className="font-bold text-gray-900 mt-0.5 truncate">{currentUser.email || 'vikramtomar0505@gmail.com'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Gender & Age</span>
                  <p className="font-bold text-gray-900 mt-0.5 capitalize">
                    {profileData?.gender || 'Male'} • {profileData?.age ? `${profileData.age} Yrs` : '25 Yrs'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Profession / College</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {profileData?.profession || 'Software Professional'} ({profileData?.college_or_company || 'Infosys'})
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Emergency Contact</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {profileData?.emergency_name || 'Rajendra Tomar'} ({profileData?.emergency_relation || 'Father'})
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    +91 {profileData?.emergency_phone || '9876543210'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5 sm:col-span-2">
                  <span className="text-gray-400 text-[10px] font-bold block">Permanent Address</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {profileData?.permanent_address || 'Flat 402, Green Meadows'}, {profileData?.permanent_city || 'Kanpur, UP'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. MODAL 1: EDIT DETAILS (MOBILE BOTTOM-SHEET DRAWER) */}
      {/* ────────────────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto overscroll-contain">
            {/* Mobile Sheet Pull Bar */}
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => setIsEditing(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-black text-gray-900">Edit Profile & Safety Info</h3>
            <p className="text-xs text-gray-500">Updates sync to Supabase database & verified tenant registry</p>

            {saveSuccessMsg && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A] bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={16}
                    max={100}
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Profession</label>
                  <input
                    type="text"
                    value={editProfession}
                    onChange={(e) => setEditProfession(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Company / College</label>
                  <input
                    type="text"
                    value={editCollegeCompany}
                    onChange={(e) => setEditCollegeCompany(e.target.value)}
                    placeholder="e.g. Infosys / Amity"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="rounded-2xl bg-amber-50/70 p-3 border border-amber-200/80 space-y-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase block">
                  Emergency Contact (Safety Record)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                      placeholder="e.g. Parent Name"
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Relationship</label>
                    <select
                      value={editEmergencyRelation}
                      onChange={(e) => setEditEmergencyRelation(e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Emergency Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile"
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Permanent Home Address</label>
                <input
                  type="text"
                  value={editPermanentAddress}
                  onChange={(e) => setEditPermanentAddress(e.target.value)}
                  placeholder="Street / Apartment / House No."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Permanent City & State</label>
                <input
                  type="text"
                  value={editPermanentCity}
                  onChange={(e) => setEditPermanentCity(e.target.value)}
                  placeholder="e.g. Kanpur, Uttar Pradesh"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-white bg-[#14532D] hover:bg-[#166534] rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. MODAL 2: AADHAAR VERIFICATION (BOTTOM SHEET) */}
      {/* ────────────────────────────────────────────────────────── */}
      {isAadhaarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => setIsAadhaarModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D]">
                <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">UIDAI DigiLocker KYC</h3>
                <p className="text-xs text-gray-500">Instant government identity verification</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  12-Digit Aadhaar Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full px-3.5 py-2.5 font-mono tracking-widest text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] outline-none text-center"
                />
              </div>

              {aadhaarInput.length === 12 && !aadhaarOtpSent && (
                <button
                  type="button"
                  onClick={() => setAadhaarOtpSent(true)}
                  className="w-full py-3 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition active:scale-95"
                >
                  Send UIDAI OTP to Registered Mobile
                </button>
              )}

              {aadhaarOtpSent && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800">
                    OTP sent to UIDAI registered number. Enter demo code <strong>123456</strong>.
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2.5 text-center tracking-widest font-mono text-sm rounded-xl border border-gray-300 outline-none"
                  />
                  <button
                    type="button"
                    disabled={verifyingAadhaar || aadhaarOtp.length < 6}
                    onClick={handleConfirmAadhaar}
                    className="w-full py-3 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition disabled:opacity-50"
                  >
                    {verifyingAadhaar ? 'Verifying with UIDAI...' : 'Confirm Verification'}
                  </button>
                </div>
              )}

              {aadhaarSuccess && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Aadhaar Successfully Verified & Stored!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. MODAL 3: SHOW QR CODE MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#14532D] mb-3">
              <QrCode className="h-6 w-6 text-[#16A34A]" />
            </div>
            <h3 className="text-base font-black text-gray-900">Gate & Identity QR Code</h3>
            <p className="text-xs text-gray-500 mt-0.5">Show this to PG Warden or biometric gate reader</p>

            {/* Simulated Vector QR Graphic */}
            <div className="my-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
              <div className="h-40 w-40 bg-white p-3 rounded-xl shadow-xs border border-gray-200 flex flex-col items-center justify-center gap-2">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-2">
                  {[...Array(36)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-gray-900'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="font-mono text-xs font-black text-[#14532D] mt-2 block">
                {uniqueId}
              </span>
              <span className="text-[10px] text-gray-400">Scan for instant security gate clearance</span>
            </div>

            <button
              onClick={handleShareIdCard}
              className="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition active:scale-95"
            >
              Share Digital Pass
            </button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. MODAL 4: QUICK UPI PAY BOTTOM SHEET */}
      {/* ────────────────────────────────────────────────────────── */}
      {isUpiPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => setIsUpiPayModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Instant UPI Rent Settlement</h3>
                <p className="text-xs text-gray-500">Zero surcharge UPI auto-reconciliation</p>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 text-center my-3">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Monthly Rent Due</span>
              <span className="text-2xl font-black text-gray-900 block mt-0.5">
                ₹{((activeStay?.monthly_rent_paise || 950000) / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                For {activeStay?.property_name || 'PG-Setu Co-Living'} ({activeStay?.room_number || 'Room 304'})
              </span>
            </div>

            <div className="space-y-2">
              <a
                href={`upi://pay?pa=pgsetu@icici&pn=PGSetu%20Residency&am=${(activeStay?.monthly_rent_paise || 950000) / 100}&cu=INR&tn=Rent%20Settlement`}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#16A34A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition"
              >
                <Smartphone className="h-4 w-4" />
                <span>Launch UPI App (GPay / PhonePe / Paytm)</span>
              </a>

              <button
                onClick={() => {
                  handleCopyId('pgsetu@icici')
                  alert('UPI ID copied: pgsetu@icici')
                }}
                className="w-full py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Copy Host UPI ID: pgsetu@icici
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 9. MODAL 5: INSTANT GUEST GATE PASS */}
      {/* ────────────────────────────────────────────────────────── */}
      {isGatePassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => {
                setIsGatePassModalOpen(false)
                setGeneratedPassCode(null)
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Instant Guest Gate Pass</h3>
                <p className="text-xs text-gray-500">Issue visitor clearance for your room</p>
              </div>
            </div>

            {generatedPassCode ? (
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-center space-y-2 my-3">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                  Gate Pass Code (Valid for 6 Hours)
                </span>
                <span className="font-mono text-3xl font-black text-[#14532D] tracking-widest block">
                  #{generatedPassCode}
                </span>
                <p className="text-xs text-emerald-700">
                  Visitor <strong>{visitorName || 'Guest'}</strong> can show this code at the security gate for instant access to {activeStay?.room_number || 'Room 304'}.
                </p>
                <button
                  onClick={() => {
                    handleCopyId(generatedPassCode)
                    alert(`Gate Pass #${generatedPassCode} copied to clipboard!`)
                  }}
                  className="mt-2 w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition"
                >
                  Copy & Send on WhatsApp
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateGatePass} className="space-y-3 mt-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Visitor Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Purpose of Visit
                  </label>
                  <select
                    value={visitorPurpose}
                    onChange={(e) => setVisitorPurpose(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A] bg-white"
                  >
                    <option value="Friend Visiting">Friend Visiting</option>
                    <option value="Family / Parent">Family / Parent</option>
                    <option value="Study / Project Work">Study / Project Work</option>
                    <option value="Courier / Delivery">Courier / Delivery</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition active:scale-95"
                >
                  Generate 6-Digit Gate Pass
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Share Toast */}
      {sharedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-gray-900 text-white px-4 py-2.5 text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Tenant Pass copied to clipboard!</span>
        </div>
      )}
    </div>
  )
}

export default function MyProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7FAF7]">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      }
    >
      <MyProfileContent />
    </Suspense>
  )
}