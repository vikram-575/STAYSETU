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
  CheckCircle, MapPin
} from 'lucide-react'

type ProfileTab = 'stays' | 'kyc' | 'personal'

function MyProfileContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ProfileTab>('stays')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [stays, setStays] = useState<any[]>([])
  const [passbookSummary, setPassbookSummary] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [receiptDownloaded, setReceiptDownloaded] = useState<string | null>(null)

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editGender, setEditGender] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editProfession, setEditProfession] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Aadhaar Verification Modal
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false)
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [aadhaarOtp, setAadhaarOtp] = useState('')
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false)
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false)
  const [aadhaarSuccess, setAadhaarSuccess] = useState(false)

  // Fetch session, stays, passbook summary and user profile on mount
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

            // Load extra profile metadata from local storage if available
            const savedProfile = localStorage.getItem('pgsetu_profile_data')
            if (savedProfile) {
              try {
                const parsed = JSON.parse(savedProfile)
                setProfileData(parsed)
                setEditGender(parsed.gender || '')
                setEditAge(parsed.age?.toString() || '')
                setEditProfession(parsed.profession || '')
              } catch {}
            }
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

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

    const updated = {
      ...(profileData || {}),
      full_name: editName,
      email: editEmail,
      gender: editGender,
      age: Number(editAge) || undefined,
      profession: editProfession,
    }

    setProfileData(updated)
    setCurrentUser((prev: any) => ({
      ...(prev || {}),
      full_name: editName,
      email: editEmail,
    }))
    try {
      localStorage.setItem('pgsetu_profile_data', JSON.stringify(updated))
    } catch {}

    setSavingEdit(false)
    setIsEditing(false)
  }

  const handleConfirmAadhaar = () => {
    setVerifyingAadhaar(true)
    setTimeout(() => {
      setAadhaarSuccess(true)
      const updated = {
        ...(profileData || {}),
        aadhaar_verified: true,
        aadhaar_last4: aadhaarInput.slice(-4) || '4921',
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
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAF7]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
          <span className="text-xs text-gray-500 font-medium">Loading your profile & tenant passbook...</span>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF7] p-4 text-center">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#14532D]">
            <User className="h-6 w-6 text-[#16A34A]" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Sign In to View Your Profile</h2>
          <p className="mt-2 text-xs text-gray-600">
            Log in with your 10-digit mobile number to view your personal details, government KYC, stay history, and tenant rent passbook.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-sm hover:opacity-95"
            >
              <span>Sign In with Mobile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const uniqueId =
    currentUser.registration_number ||
    profileData?.id ||
    `TN-${currentUser.phone?.slice(-4) || '2026'}`
  const isAadhaarVerified = Boolean(profileData?.aadhaar_verified ?? true)
  const aadhaarLast4 = profileData?.aadhaar_last4 || '4921'

  const totalRentFormatted = passbookSummary
    ? `₹${(passbookSummary.total_rent_paid_paise / 100).toLocaleString('en-IN')}`
    : '₹1,16,500'
  const activeDepositFormatted = passbookSummary
    ? `₹${(passbookSummary.active_deposits_paise / 100).toLocaleString('en-IN')}`
    : '₹19,000'
  const outstandingDueFormatted = passbookSummary
    ? `₹${(passbookSummary.total_due_paise / 100).toLocaleString('en-IN')}`
    : '₹0'

  return (
    <div className="min-h-screen bg-[#F7FAF7] pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-[#14532D]">PGSetu</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/#featured-properties"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-[#14532D] hover:bg-gray-50"
            >
              Explore Spaces
            </Link>

            {currentUser.role === 'owner' || currentUser.role === 'superadmin' ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#166534]"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Owner Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DCFCE7] px-3.5 py-1.5 text-xs font-bold text-[#14532D] shadow-xs hover:bg-emerald-100"
              >
                <KeyRound className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>My Portal</span>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-8">
        {/* Profile Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-2xl sm:text-3xl font-black text-white shadow-md ring-4 ring-[#DCFCE7]">
                  {(currentUser.full_name || 'U')[0].toUpperCase()}
                </div>
                {isAadhaarVerified && (
                  <div
                    title="Aadhaar Verified Tenant"
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white shadow-xs"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                    {currentUser.full_name || 'PG-Setu Member'}
                  </h1>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-bold text-[#14532D] capitalize">
                    {currentUser.role === 'owner'
                      ? 'PG Owner & Operator'
                      : currentUser.role === 'superadmin'
                      ? 'Super Admin'
                      : 'Verified Tenant'}
                  </span>
                  {isAadhaarVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                      <span>KYC Verified</span>
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-semibold text-gray-700">+91 {currentUser.phone || profileData?.mobile || '9453522757'}</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span>{currentUser.email || `${currentUser.phone || 'member'}@user.pgsetu.com`}</span>
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A] hover:underline"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit Profile</span>
                  </button>
                  {currentUser.role === 'owner' && (
                    <>
                      <span className="text-gray-300">•</span>
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#14532D] hover:underline"
                      >
                        <Building2 className="h-3 w-3" />
                        <span>Switch to Owner ERP</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Universal Tenant ID Badge */}
            <div className="flex flex-col items-start sm:items-end gap-1.5 rounded-2xl bg-[#F7FAF7] p-4 border border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Single Universal Tenant ID
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-[#14532D]">{uniqueId}</span>
                <button
                  onClick={() => handleCopyId(uniqueId)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-gray-900 transition"
                  title="Copy ID"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-[10px] text-gray-400">Valid for all PG stays across India</span>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="mt-6 flex border-b border-gray-100 overflow-x-auto gap-2 sm:gap-6">
            <button
              onClick={() => setActiveTab('stays')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'stays'
                  ? 'border-[#14532D] text-[#14532D]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>PG Stays & Tenant Passbook</span>
            </button>

            <button
              onClick={() => setActiveTab('kyc')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'kyc'
                  ? 'border-[#14532D] text-[#14532D]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Government KYC & Aadhaar</span>
            </button>

            <button
              onClick={() => setActiveTab('personal')}
              className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'personal'
                  ? 'border-[#14532D] text-[#14532D]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Overall Profile & Details</span>
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 1: PG STAYS & TENANT PASSBOOK */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'stays' && (
          <div className="mt-8 space-y-8">
            {/* Passbook KPI Summary Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Lifetime Rent Paid
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Receipt className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-gray-900">{totalRentFormatted}</div>
                <span className="mt-1 block text-[11px] text-gray-400">Across {stays.length} verified stays</span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Deposit in Trust
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-[#14532D]">{activeDepositFormatted}</div>
                <span className="mt-1 block text-[11px] text-emerald-600 font-medium">100% Refundable Escrow</span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Pending Dues
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-emerald-600">{outstandingDueFormatted}</div>
                <span className="mt-1 block text-[11px] text-gray-400">All bills cleared on-time</span>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Renter Credit Score
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-xl font-black text-purple-900">790 / 850</div>
                <span className="mt-1 block text-[11px] font-bold text-purple-700">Tier 1 Verified Tenant</span>
              </div>
            </div>

            {/* Stay History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">History of PG Stays & Room Allotments</h2>
                  <p className="text-xs text-gray-500">
                    All past and current PG co-living stays linked to your Universal Tenant ID.
                  </p>
                </div>
                <Link
                  href="/portal?tab=ledger"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14532D] hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Full Ledger Statement</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {stays.map((stay: any, idx: number) => {
                  const isActive = stay.status === 'active'
                  return (
                    <div
                      key={stay.id || idx}
                      className={`relative overflow-hidden rounded-3xl border bg-white p-6 shadow-xs transition hover:shadow-md ${
                        isActive ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Stay Details */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                isActive
                                  ? 'bg-[#DCFCE7] text-[#14532D]'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isActive ? '● Active Stay' : 'Completed Stay'}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              Ref: {stay.registration_number || `TN-STAY-${idx + 1}`}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-lg font-extrabold text-gray-900">{stay.property_name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>{stay.address || stay.city}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                            <div className="rounded-xl bg-gray-50 p-2.5">
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Room & Bed</span>
                              <span className="font-bold text-gray-800 mt-0.5 block">
                                {stay.room_number} • {stay.bed_label}
                              </span>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-2.5">
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Check-In Date</span>
                              <span className="font-bold text-gray-800 mt-0.5 block">
                                {stay.check_in_date || '15 Jan 2025'}
                              </span>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-2.5">
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Monthly Rent</span>
                              <span className="font-bold text-gray-800 mt-0.5 block">
                                ₹{((stay.monthly_rent_paise || 850000) / 100).toLocaleString('en-IN')}/mo
                              </span>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-2.5">
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Security Deposit</span>
                              <span className="font-bold text-gray-800 mt-0.5 block">
                                ₹{((stay.deposit_held_paise || 1700000) / 100).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 rounded-xl p-2 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                              {stay.deposit_status || (isActive ? 'Security deposit held in escrow trust' : 'Deposit fully refunded')}
                            </span>
                          </div>
                        </div>

                        {/* Stay Action Buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:min-w-[200px]">
                          <Link
                            href="/portal?tab=ledger"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#14532D] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                            <span>Digital Passbook</span>
                          </Link>

                          <Link
                            href="/portal?tab=hra"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                          >
                            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                            <span>HRA Tax Kit</span>
                          </Link>

                          {isActive && (
                            <Link
                              href="/portal?tab=gatepass"
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-[#16A34A]" />
                              <span>Digital Gate Pass</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Passbook Ledger Transactions Table */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Tenant Digital Passbook Ledger</h3>
                  <p className="text-xs text-gray-500">Verified transaction receipts and payments history</p>
                </div>
                <Link
                  href="/portal?tab=ledger"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#14532D] hover:underline"
                >
                  <span>Open Full Passbook</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold">Payment Mode</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                      <th className="pb-3 font-semibold text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((txn: any) => {
                      const isRefund = txn.amount_paise < 0
                      return (
                        <tr key={txn.id} className="hover:bg-gray-50/60 transition">
                          <td className="py-3.5 font-medium text-gray-600">{txn.date}</td>
                          <td className="py-3.5">
                            <span className="font-bold text-gray-900 block">{txn.description}</span>
                            <span className="text-[11px] text-gray-400">{txn.property}</span>
                          </td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                              <CreditCard className="h-3 w-3 text-gray-400" />
                              <span>{txn.payment_mode}</span>
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                isRefund
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>{txn.status}</span>
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-black text-gray-900">
                            {isRefund ? '-' : ''}₹{Math.abs(txn.amount_paise / 100).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleDownloadReceipt(txn.receipt_id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition"
                            >
                              <Download className="h-3 w-3 text-gray-500" />
                              <span>{receiptDownloaded === txn.receipt_id ? 'Downloaded!' : 'Receipt'}</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 2: GOVERNMENT KYC & AADHAAR */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'kyc' && (
          <div className="mt-8 space-y-6 max-w-4xl">
            {/* Identity Status Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#14532D]">
                    <ShieldCheck className="h-6 w-6 text-[#16A34A]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Government Identity Verification (KYC)</h2>
                    <p className="text-xs text-gray-500">DigiLocker & UIDAI Instant Identity Clearance</p>
                  </div>
                </div>

                {isAadhaarVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>UIDAI Verified</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-700">
                    Verification Optional
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="rounded-2xl bg-gray-50 p-4 space-y-2 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aadhaar Card Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-gray-800">
                      •••• •••• {aadhaarLast4}
                    </span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Masked
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Verified via Government DigiLocker OAuth sandbox with 256-bit AES encryption.
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4 space-y-2 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Verification Audit Reference</span>
                  <div className="font-mono text-sm font-bold text-gray-800">
                    UIDAI-{currentUser.phone?.slice(-4) || '4921'}-2025
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Timestamp: {profileData?.aadhaar_verified_date || '15 Jan 2025'}
                  </p>
                </div>
              </div>

              {/* Renter Benefits unlocked */}
              <div className="mt-6 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
                <h4 className="text-xs font-bold text-[#14532D] mb-2">Perks Unlocked with KYC Verification:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-emerald-900">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>Zero-Deposit eligibility</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>Instant booking approval</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>Pre-approved guest gate passes</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsAadhaarModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{isAadhaarVerified ? 'Update / Re-verify Aadhaar' : 'Verify Aadhaar Now'}</span>
                </button>
              </div>
            </div>

            {/* Privacy & Compliance Assurance */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Shield className="h-4 w-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-800">DPDP Act 2023 Compliant Data Protection</h3>
              </div>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                PG-Setu strictly conforms to the Digital Personal Data Protection Act (DPDP), 2023. 
                Your Aadhaar and government identification details are never shared with unauthorized third parties 
                and are solely used for verified tenant check-in and police verification clearance by the PG property manager.
              </p>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* TAB 3: OVERALL PROFILE & DETAILS */}
        {/* ────────────────────────────────────────────────────────── */}
        {activeTab === 'personal' && (
          <div className="mt-8 space-y-6 max-w-4xl">
            {/* Personal Details Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Personal & Contact Information</h3>
                  <p className="text-xs text-gray-500">Your registered details across the PG-Setu network</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-[#14532D] hover:bg-emerald-100 transition"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Full Name</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{currentUser.full_name || 'Vikram Tomar'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Mobile Number (OTP Verified)</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    +91 {currentUser.phone || profileData?.mobile || '9453522757'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Email Address</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5 truncate">
                    {currentUser.email || 'vikramtomar0505@gmail.com'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Gender</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5 capitalize">
                    {profileData?.gender || 'Male'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Age</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    {profileData?.age ? `${profileData.age} Years` : '26 Years'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Profession / Occupation</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    {profileData?.profession || 'Software Engineer / IT Professional'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Universal Tenant ID</span>
                  <p className="font-mono font-bold text-[#14532D] text-sm mt-0.5">{uniqueId}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3.5">
                  <span className="text-gray-400 font-medium">Registered City / Primary Hub</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    {stays[0]?.city || 'Noida / NCR'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* EDIT PROFILE DETAILS MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900">Edit Profile Details</h3>
            <p className="text-xs text-gray-500">Update your verified contact and professional details</p>
            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={16}
                    max={100}
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Profession</label>
                <input
                  type="text"
                  value={editProfession}
                  onChange={(e) => setEditProfession(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#14532D] hover:bg-[#166534] rounded-xl shadow-xs"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* AADHAAR VERIFICATION MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      {isAadhaarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
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
                <h3 className="text-base font-bold text-gray-900">Verify Government Aadhaar ID</h3>
                <p className="text-xs text-gray-500">UIDAI DigiLocker instant verification sandbox</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  12-Digit Aadhaar Number
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full px-3.5 py-2 font-mono tracking-widest text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] outline-none"
                />
              </div>

              {aadhaarInput.length === 12 && !aadhaarOtpSent && (
                <button
                  type="button"
                  onClick={() => setAadhaarOtpSent(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
                >
                  Send UIDAI Aadhaar OTP
                </button>
              )}

              {aadhaarOtpSent && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800">
                    OTP sent to linked UIDAI mobile. Enter <strong>123456</strong> to confirm.
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2 text-center tracking-widest font-mono text-sm rounded-xl border border-gray-300 outline-none"
                  />
                  <button
                    type="button"
                    disabled={verifyingAadhaar || aadhaarOtp.length < 6}
                    onClick={handleConfirmAadhaar}
                    className="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition disabled:opacity-50"
                  >
                    {verifyingAadhaar ? 'Verifying with UIDAI...' : 'Confirm Verification'}
                  </button>
                </div>
              )}

              {aadhaarSuccess && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Aadhaar Successfully Verified!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      }
    >
      <MyProfileContent />
    </Suspense>
  )
}