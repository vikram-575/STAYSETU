'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, User, Phone, Mail, Home, Users, Calendar,
  Star, Search, Loader2, ArrowLeft, ArrowRight, RefreshCw, Edit, LogOut,
  CheckCircle2, Clock, Tag, Bed, ShieldCheck, Copy, Check,
  KeyRound, PlusCircle, ExternalLink, ShieldAlert, AlertCircle, X
} from 'lucide-react'

function MyProfileContent() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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

  // Fetch session and user profile on mount
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

            // Attempt to load profile data from local storage or lookup
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
        aadhaar_last4: aadhaarInput.slice(-4),
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
          <span className="text-xs text-gray-500 font-medium">Loading your profile dashboard...</span>
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
            Log in with your 10-digit mobile number to manage your personal details, government KYC, bookings, and rent passbook.
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
  const isAadhaarVerified = Boolean(profileData?.aadhaar_verified)

  return (
    <div className="min-h-screen bg-[#F7FAF7] pb-16">
      {/* Top Navbar */}
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
              href="/"
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
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DCFCE7] px-3.5 py-1.5 text-xs font-bold text-[#14532D] shadow-xs hover:bg-emerald-100"
              >
                <KeyRound className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>My Stay</span>
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
        {/* Profile Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-2xl font-black text-white shadow-md ring-4 ring-[#DCFCE7]">
                {(currentUser.full_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                    {currentUser.full_name || 'PG-Setu Member'}
                  </h1>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-bold text-[#14532D] capitalize">
                    {currentUser.role === 'owner' ? 'PG Owner' : currentUser.role === 'superadmin' ? 'Super Admin' : 'Verified Tenant'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>+91 {currentUser.phone || profileData?.mobile || 'Verified'}</span>
                  </span>
                  {currentUser.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span>{currentUser.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Universal ID Badge */}
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
        </div>

        {/* 2-Column Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Personal Information & KYC (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Identity Verification Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
                  <h3 className="text-sm font-bold text-gray-900">Government Identity Verification (KYC)</h3>
                </div>
                {isAadhaarVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    <Check className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    Optional
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">
                    {isAadhaarVerified ? 'DigiLocker Aadhaar Verification Complete' : 'Aadhaar Verification (Optional)'}
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {isAadhaarVerified
                      ? `Linked to Aadhaar ending in •••• ${profileData?.aadhaar_last4 || 'XXXX'}`
                      : 'Verify Aadhaar to unlock instant booking approvals and zero-deposit stay perks.'}
                  </p>
                </div>

                {!isAadhaarVerified && (
                  <button
                    onClick={() => setIsAadhaarModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-[#14532D] hover:bg-emerald-100 transition whitespace-nowrap"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Verify Aadhaar Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Details Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A] hover:underline"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 font-medium">Full Name</span>
                  <p className="font-bold text-gray-800 mt-0.5">{currentUser.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Mobile (Verified)</span>
                  <p className="font-bold text-gray-800 mt-0.5">+91 {currentUser.phone || profileData?.mobile || 'Verified'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Gender</span>
                  <p className="font-bold text-gray-800 mt-0.5 capitalize">{profileData?.gender || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Age</span>
                  <p className="font-bold text-gray-800 mt-0.5">{profileData?.age ? `${profileData.age} Years` : 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Profession / Occupation</span>
                  <p className="font-bold text-gray-800 mt-0.5">{profileData?.profession || 'Corporate Professional'}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Email Address</span>
                  <p className="font-bold text-gray-800 mt-0.5 truncate">{currentUser.email || 'Optional'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Actions & Stays (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Portals Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-gray-100">Quick Access</h3>
              <div className="mt-4 space-y-3">
                <Link
                  href="/#featured-properties"
                  className="flex items-center justify-between rounded-xl bg-[#F7FAF7] p-3 border border-gray-200 hover:border-[#16A34A] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#14532D]">
                      <Home className="h-4 w-4 text-[#16A34A]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Explore Verified Spaces</h4>
                      <p className="text-[10px] text-gray-500">Search PGs with interactive Google Map</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/portal"
                  className="flex items-center justify-between rounded-xl bg-[#F7FAF7] p-3 border border-gray-200 hover:border-[#16A34A] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#14532D]">
                      <KeyRound className="h-4 w-4 text-[#16A34A]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Tenant Digital Passbook</h4>
                      <p className="text-[10px] text-gray-500">Rent receipts, sub-meter units & dues</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>

                {currentUser.role === 'owner' || currentUser.role === 'superadmin' ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between rounded-xl bg-[#14532D] p-3 text-white shadow-xs hover:bg-[#166534] transition"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5" />
                      <div>
                        <h4 className="text-xs font-bold">Owner ERP Dashboard</h4>
                        <p className="text-[10px] text-emerald-200">Manage rooms, checkins & payments</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-emerald-300" />
                  </Link>
                ) : (
                  <Link
                    href="/#popular-cities"
                    className="flex items-center justify-between rounded-xl bg-[#F7FAF7] p-3 border border-gray-200 hover:border-[#16A34A] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#14532D]">
                        <Building2 className="h-4 w-4 text-[#16A34A]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Popular IT Hubs</h4>
                        <p className="text-[10px] text-gray-500">Bangalore, Gurgaon, Noida, Pune & more</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* EDIT DETAILS MODAL */}
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 outline-none"
                  >
                    <option value="">Select...</option>
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
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 outline-none"
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
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 outline-none"
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
                <p className="text-xs text-gray-500">DigiLocker sandbox instant verification</p>
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
                  Send Aadhaar OTP
                </button>
              )}

              {aadhaarOtpSent && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800">
                    Simulated OTP sent to linked UIDAI mobile. Enter <strong>123456</strong> to verify.
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" /></div>}>
      <MyProfileContent />
    </Suspense>
  )
}