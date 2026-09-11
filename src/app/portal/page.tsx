'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2, Phone, Calendar, ArrowRight, CheckCircle2,
  AlertCircle, DollarSign, Zap, FileText, CreditCard,
  BookOpen, Sparkles, Loader2, LogOut, ArrowLeft,
  ExternalLink, Download, Printer, User, Shield, MessageSquare,
  QrCode, X, Copy, Check
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

export default function ResidentPortalPage() {
  // Login State
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Dashboard Data State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [portalData, setPortalData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'ledger' | 'electricity' | 'stay'>('invoices')

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)

  // UPI QR Modal State
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrAmountRupees, setQrAmountRupees] = useState<number>(0)
  const [qrNote, setQrNote] = useState<string>('')
  const [copiedUpi, setCopiedUpi] = useState(false)

  // 1. Check existing session on mount or via token/resident query param
  useEffect(() => {
    async function loadPortalData() {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const tab = urlParams.get('tab')
        const residentId = urlParams.get('resident_id') || urlParams.get('id')

        if (tab && ['invoices', 'payments', 'ledger', 'electricity', 'stay'].includes(tab)) {
          setActiveTab(tab as any)
        }

        const queryParts: string[] = []
        if (token) queryParts.push(`token=${encodeURIComponent(token)}`)
        if (residentId) queryParts.push(`resident_id=${encodeURIComponent(residentId)}`)
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''

        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await fetch(`/api/portal/data${queryString}`, { headers })
        if (res.ok) {
          const data = await res.json()
          setPortalData(data)
          setIsAuthenticated(true)
        }
      } catch {
        // Not logged in
      } finally {
        setLoadingData(false)
      }
    }
    loadPortalData()
  }, [])

  // 2. Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          date_of_birth: dob,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your details.')
      }

      // Re-fetch portal data using authenticated session/token
      setLoadingData(true)
      const token = data.token
      const headers: HeadersInit = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const endpoint = token ? `/api/portal/data?token=${encodeURIComponent(token)}` : '/api/portal/data'

      const dataRes = await fetch(endpoint, { headers })
      if (dataRes.ok) {
        const fullData = await dataRes.json()
        setPortalData(fullData)
        setIsAuthenticated(true)
      }
    } catch (err: any) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
      setLoadingData(false)
    }
  }

  // 3. Handle Logout
  const handleLogout = async () => {
    await fetch('/api/portal/logout', { method: 'POST' })
    setIsAuthenticated(false)
    setPortalData(null)
    setPhone('')
    setDob('')
  }

  // Loading Screen
  if (loadingData && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#16A34A] to-[#14532D] rounded-2xl flex items-center justify-center shadow-lg shadow-[#16A34A]/20 animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-bold text-[#647067]">Loading your stay passbook...</p>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // VIEW A: UNAUTHENTICATED RESIDENT LOGIN FORM
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] text-[#17211B] flex flex-col justify-between p-4 sm:p-6 selection:bg-[#DCFCE7] selection:text-[#14532D] relative overflow-hidden">
        {/* Subtle Ambient Glows & Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(22,163,74,0.12),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(245,158,11,0.06),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#16A34A_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        {/* Top Header */}
        <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20 pt-2 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#16A34A] to-[#DCFCE7] flex items-center justify-center text-[#14532D] shadow-sm font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-[#17211B] block leading-none">PGSetu</span>
              <span className="text-[10px] font-bold text-[#16A34A] tracking-wider uppercase mt-0.5 block">Resident Self-Service</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-[#647067] hover:text-[#14532D] transition px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-sm flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Marketplace</span>
          </Link>
        </header>

        <div className="w-full max-w-md mx-auto my-auto relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#14532D] via-[#0F3E22] to-[#16A34A] rounded-2xl shadow-xl shadow-[#16A34A]/20 text-white mb-1 border border-[#16A34A]/30">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#17211B] tracking-tight">Resident Stay Passbook</h1>
            <p className="text-xs sm:text-sm text-[#647067] font-medium max-w-sm mx-auto">
              View your monthly rent bills, verified UPI receipts, electricity sub-meter readings & stay history in 1 tap.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-200/70 space-y-5 border border-[#E5E7EB]">
            <div className="border-b border-[#E5E7EB] pb-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#16A34A] block">Secure Passbook Access</span>
                <p className="text-[11px] text-[#647067] mt-0.5">Enter your registered mobile number & date of birth</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold">Verified</span>
            </div>

            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17211B] mb-1.5 uppercase tracking-wider">Registered Mobile Number or Unique Tenant ID *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="10-digit mobile number or TN... ID"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium placeholder-[#647067]/60 focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                  />
                </div>
                <p className="text-[10px] text-[#647067] mt-1">Enter the mobile number given at check-in or your PG-Setu Unique Tenant ID (e.g. TN4827K3M).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211B] mb-1.5 uppercase tracking-wider">Date of Birth (DOB) *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#F7FAF7] border border-[#E5E7EB] rounded-xl text-xs sm:text-sm text-[#17211B] font-medium focus:bg-white focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10 outline-none transition"
                />
                <p className="text-[10px] text-[#647067] mt-1">Used to verify your stay records securely.</p>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#16A34A] to-[#14532D] hover:from-[#15803D] hover:to-[#0F3E22] active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#16A34A]/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loginLoading ? 'Verifying Stay Records...' : 'View My Passbook & Rent Bills →'}
              </button>
            </form>

            {/* New Resident Auto-Login Guidance */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/70 rounded-xl text-[11px] text-emerald-800 leading-relaxed">
              <span className="font-extrabold block mb-0.5">🌟 New Resident or Not Checked In Yet?</span>
              Enter your mobile number and date of birth above to automatically log in as a <strong>New Tenant</strong> and get your permanent <strong>PG-Setu Unique Tenant ID (TN...)</strong>.
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
              <Link
                href="/create-profile"
                className="text-xs font-bold text-[#16A34A] hover:text-[#14532D] transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create New Profile Free →</span>
              </Link>
              <Link
                href="/login"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#647067] hover:text-[#14532D] transition"
              >
                Owner & Staff Login →
              </Link>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-[#647067]">
            <span className="flex items-center gap-1 font-medium">
              <Shield className="w-3.5 h-3.5 text-[#16A34A]" />
              256-Bit Encrypted
            </span>
            <span>•</span>
            <span className="font-medium">Instant UPI Receipts</span>
            <span>•</span>
            <span className="font-medium">Direct Bank Verification</span>
          </div>

          <p className="text-center text-[10px] text-[#647067]/70 font-medium">
            © 2026 PGSetu Platform Enterprise · Resident Self-Service Portal
          </p>
        </div>

        <div />
      </div>
    )
  }

  // -------------------------------------------------------------
  // VIEW B: AUTHENTICATED RESIDENT PASSBOOK DASHBOARD
  // -------------------------------------------------------------
  const resident = portalData?.resident || {}
  const pgInfo = portalData?.pg_info || {}
  const invoices = portalData?.invoices || []
  const payments = portalData?.payments || []
  const ledger = portalData?.ledger || []
  const electricityReadings = portalData?.electricity_readings || []

  const totalOutstandingPaise = resident.total_outstanding_paise || 0
  const totalPaidPaise = resident.total_paid_paise || 0
  const depositHeldPaise = resident.deposit_held_paise || 0
  const monthlyRentPaise = resident.monthly_rent_paise || 0
  const hasOutstandingDue = totalOutstandingPaise > 0

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-tight truncate max-w-[180px] sm:max-w-xs">
                {pgInfo.name || 'PG-SETU'}
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tenant Passbook</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Resident Summary Pill */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
              {resident.full_name?.charAt(0) || 'R'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900">{resident.full_name}</h2>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                  (portalData?.is_new_user || resident.status === 'new_user')
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                )}>
                  {(portalData?.is_new_user || resident.status === 'new_user') ? 'New Tenant' : (resident.status || 'Active')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unique Tenant ID:</span>
                <span className="text-xs text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {resident.registration_number}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 text-xs">
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200/60 shadow-2xs">
              {(portalData?.is_new_user || resident.status === 'new_user')
                ? 'Pending PG Check-In'
                : `Room ${resident.room_number || '—'} · Bed ${resident.bed_label || '—'}`}
            </span>
            {resident.floor_name && (
              <span className="px-3 py-1.5 bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200">
                {resident.floor_name}
              </span>
            )}
          </div>
        </div>

        {/* Hero Due / Welcome Banner */}
        {(portalData?.is_new_user || resident.status === 'new_user') ? (
          <div className="bg-gradient-to-br from-[#14532D] via-[#0F3E22] to-[#16A34A] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xl shadow-[#16A34A]/20 space-y-4 border border-[#16A34A]/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7]/20 text-[#DCFCE7] text-xs font-bold border border-[#DCFCE7]/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Verified PG-Setu Tenant Account
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                  Welcome to Your Stay Passbook!
                </h3>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center sm:text-right">
                <p className="text-[10px] uppercase font-bold text-[#DCFCE7] tracking-wider">Your Permanent Tenant ID</p>
                <div className="flex items-center justify-center sm:justify-end gap-2 mt-0.5">
                  <span className="text-xl font-mono font-black text-amber-300">{resident.registration_number}</span>
                  <button
                    onClick={() => {
                      if (resident.registration_number) {
                        navigator.clipboard.writeText(resident.registration_number)
                        alert('Unique Tenant ID copied to clipboard!')
                      }
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="Copy Tenant ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              You are signed in as a <strong>Verified PG-Setu Tenant</strong>. You are not currently checked into an active PG property.
              Provide your <strong>Unique Tenant ID ({resident.registration_number})</strong> or registered mobile number to your PG owner or manager. Once checked in, your room allocation, rent bills, payment receipts, and electricity meter readings will automatically show up here.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hi, I am registered on PG-Setu with Unique Tenant ID: ${resident.registration_number} (Mobile: ${resident.phone}). Please use this ID to check me into the PG!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#14532D] hover:bg-slate-100 rounded-xl text-xs font-black transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4 text-[#16A34A]" /> Share Tenant ID via WhatsApp
              </a>
              <Link
                href={`/my-profile?mobile=${resident.phone || ''}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition border border-white/20"
              >
                <User className="w-4 h-4" /> View / Edit Profile
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/15"
              >
                <Building2 className="w-4 h-4" /> Explore Available PGs
              </Link>
            </div>
          </div>
        ) : hasOutstandingDue ? (
          <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-red-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-red-200">Total Outstanding Dues</span>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight mt-0.5">
                  {formatCurrency(totalOutstandingPaise)}
                </h3>
              </div>
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold w-max">
                Due Date: {resident.billing_cycle_day || 1}st of Month
              </span>
            </div>

            <p className="text-xs text-red-100 font-medium">
              Please clear pending dues on time to avoid late fees and keep room services active.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setQrAmountRupees(totalOutstandingPaise / 100)
                  setQrNote(`Rent ${resident.full_name || ''} ${resident.registration_number || ''}`)
                  setShowQrModal(true)
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 text-red-700 rounded-xl text-xs font-black transition shadow-sm active:scale-95 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-red-600" /> Pay ₹{(totalOutstandingPaise / 100).toLocaleString('en-IN')} via UPI QR
              </button>
              {pgInfo.upi_pay_link && (
                <a
                  href={pgInfo.upi_pay_link}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 backdrop-blur-md"
                >
                  <CreditCard className="w-4 h-4" /> Open UPI App
                </a>
              )}
              {pgInfo.manager_whatsapp_link && (
                <a
                  href={pgInfo.manager_whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-red-800/80 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" /> Manager
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-200" />
              <h3 className="text-lg sm:text-xl font-black">All Caught Up! No Pending Dues</h3>
            </div>
            <p className="text-xs text-emerald-100 font-medium">
              Your account has zero outstanding balance. All current bills are fully paid.
            </p>
          </div>
        )}

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-gray-400 truncate">Total Due</p>
            <p className={cn('text-base sm:text-lg font-black mt-0.5 truncate', hasOutstandingDue ? 'text-red-600' : 'text-green-600')}>
              {formatCurrency(totalOutstandingPaise)}
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-green-600 truncate">Total Paid to Date</p>
            <p className="text-base sm:text-lg font-black text-green-700 mt-0.5 truncate">
              {formatCurrency(totalPaidPaise)}
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-purple-600 truncate">Deposit in Trust</p>
            <p className="text-base sm:text-lg font-black text-purple-700 mt-0.5 truncate">
              {formatCurrency(depositHeldPaise)}
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
            <p className="text-[10px] uppercase font-bold text-blue-600 truncate">Monthly Bed Rent</p>
            <p className="text-base sm:text-lg font-black text-blue-700 mt-0.5 truncate">
              {formatCurrency(monthlyRentPaise)}/mo
            </p>
          </div>
        </div>

        {/* Scrollable Navigation Pill Tabs */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 w-max bg-gray-200/70 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95',
                activeTab === 'invoices' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Bills & Invoices ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95',
                activeTab === 'payments' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Payment Receipts ({payments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95',
                activeTab === 'ledger' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Digital Passbook
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('electricity')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95',
                activeTab === 'electricity' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Sub-Meter Electricity
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stay')}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95',
                activeTab === 'stay' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Stay & Contact
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* TAB 1: INVOICES & BILLS */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'invoices' && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900 px-1">Monthly Billing Statements</h3>
            {invoices.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                No invoices generated yet.
              </div>
            ) : (
              invoices.map((inv: any) => (
                <div
                  key={inv.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-blue-700">{inv.invoice_number}</span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Period: {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase',
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      )}
                    >
                      {inv.status}
                    </span>
                  </div>

                  {/* Line item breakdown */}
                  {inv.invoice_items && inv.invoice_items.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs">
                      {inv.invoice_items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-gray-700">
                          <span className="font-medium text-[11px]">
                            {item.description} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                          </span>
                          <span className="font-bold text-gray-900">{formatCurrency(item.total_paise)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Financial summary footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-gray-500 text-[11px]">
                        Total: <strong className="text-gray-900">{formatCurrency(inv.total_paise)}</strong> · Paid:{' '}
                        <strong className="text-green-700">{formatCurrency(inv.paid_paise)}</strong>
                      </p>
                      {inv.balance_paise > 0 && (
                        <p className="text-red-600 font-bold text-xs">
                          Balance Due: {formatCurrency(inv.balance_paise)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {inv.balance_paise > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setQrAmountRupees(inv.balance_paise / 100)
                            setQrNote(`Bill ${inv.invoice_number} ${resident.full_name || ''}`)
                            setShowQrModal(true)
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pay ₹{(inv.balance_paise / 100).toLocaleString('en-IN')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> View Bill
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 2: PAYMENT RECEIPTS */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900 px-1">Payment History & Official Receipts</h3>
            {payments.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                No payment transactions recorded yet.
              </div>
            ) : (
              payments.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-gray-900">{p.payment_number || 'RECEIPT'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-800">
                        {p.payment_method}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Date: {formatDate(p.payment_date)}
                    </p>
                    {p.transaction_id && (
                      <p className="text-[11px] text-gray-400 font-mono">
                        Ref/UPI: {p.transaction_id}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className="text-base sm:text-lg font-black text-green-700">
                      +{formatCurrency(p.amount_paise)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(p)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Printable Slip
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 3: DIGITAL PASSBOOK (LEDGER) */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900">Official Resident Passbook</h3>
                <p className="text-[11px] text-gray-500">Live itemized audit ledger of all rents, deposits, charges & payments.</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" /> Print Statement
              </button>
            </div>

            {/* Passbook Balance Header Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Billed</span>
                <span className="text-sm sm:text-base font-black text-red-600 block mt-0.5">
                  {formatCurrency(ledger.reduce((acc: number, cur: any) => acc + (cur.debit_paise || 0), 0))}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Paid</span>
                <span className="text-sm sm:text-base font-black text-green-600 block mt-0.5">
                  {formatCurrency(ledger.reduce((acc: number, cur: any) => acc + (cur.credit_paise || 0), 0))}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Deposit in Trust</span>
                <span className="text-sm sm:text-base font-black text-purple-700 block mt-0.5">
                  {formatCurrency(depositHeldPaise)}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Net Balance</span>
                <span className={cn('text-sm sm:text-base font-black block mt-0.5', hasOutstandingDue ? 'text-red-600' : 'text-green-700')}>
                  {formatCurrency(totalOutstandingPaise)}
                </span>
              </div>
            </div>

            {ledger.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                No ledger transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {ledger.map((entry: any) => {
                  const isDebit = Boolean(entry.is_debit ?? (entry.debit_paise > 0 || entry.entry_type === 'charge' || entry.entry_type === 'debit'))
                  const amount = entry.amount_paise ?? (entry.debit_paise > 0 ? entry.debit_paise : (entry.credit_paise > 0 ? entry.credit_paise : 0))
                  const balance = entry.running_balance_paise !== undefined ? entry.running_balance_paise : (entry.balance_after_paise || 0)

                  return (
                    <div
                      key={entry.id}
                      className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-xs sm:text-sm">{entry.description}</p>
                          <span className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                            isDebit ? 'bg-red-50 text-red-700 border border-red-200/60' : 'bg-green-50 text-green-700 border border-green-200/60'
                          )}>
                            {isDebit ? 'Charge' : 'Credit'}
                          </span>
                          {entry.category && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold capitalize">
                              {entry.category.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Date: {formatDate(entry.entry_date)} {entry.entry_time ? `· ${formatDateTime(entry.entry_time).split(',')[1] || ''}` : ''}
                          {entry.reference_no && ` · Ref: ${entry.reference_no}`}
                        </p>
                      </div>

                      <div className="text-left sm:text-right space-y-0.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex sm:block items-center justify-between">
                        <span
                          className={cn(
                            'font-black text-xs sm:text-base block',
                            isDebit ? 'text-red-600' : 'text-green-600'
                          )}
                        >
                          {isDebit ? '+' : '-'}{formatCurrency(amount)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold block">
                          Running Balance: {formatCurrency(balance)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 4: ELECTRICITY READINGS */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'electricity' && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-gray-900 px-1">Room Sub-Meter Electricity Consumption</h3>
            {electricityReadings.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-400">
                No sub-meter electricity readings recorded for your room yet.
              </div>
            ) : (
              electricityReadings.map((r: any) => (
                <div
                  key={r.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
                      <span className="text-xs font-bold text-gray-900">
                        Reading on {formatDate(r.reading_date)}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-900">
                      {r.units_consumed} kWh
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl text-[11px]">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Prev Reading:</span>
                      <strong className="text-gray-800">{r.previous_reading}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Current Reading:</span>
                      <strong className="text-gray-800">{r.current_reading}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Rate / Unit:</span>
                      <strong className="text-gray-800">{formatCurrency(r.rate_per_unit_paise)}/kWh</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Your Equal Share:</span>
                      <strong className="text-blue-700 font-bold">{formatCurrency(r.per_resident_paise || r.total_paise)}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 5: STAY & CONTACT DETAILS */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'stay' && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">
              Stay & Property Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Resident Name</span>
                <p className="font-bold text-gray-900 mt-0.5">{resident.full_name}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Registration Number</span>
                <p className="font-mono font-bold text-blue-700 mt-0.5">{resident.registration_number}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Check-in Date</span>
                <p className="font-bold text-gray-900 mt-0.5">{formatDate(resident.check_in_date)}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Assigned Bed</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  Room {resident.room_number || '—'} · Bed {resident.bed_label || '—'} ({resident.floor_name || ''})
                </p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[10px] block">PG Property Name</span>
                <p className="font-bold text-gray-900 mt-0.5">{pgInfo.name}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold text-[10px] block">Manager Contact Phone</span>
                <p className="font-bold text-gray-900 mt-0.5">{pgInfo.manager_phone || 'Contact PG Office'}</p>
              </div>
            </div>

            {pgInfo.manager_whatsapp_link && (
              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <a
                  href={pgInfo.manager_whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" /> Message Manager on WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --------------------------------------------------------- */}
      {/* MODAL 1: OFFICIAL PAYMENT RECEIPT SLIP */}
      {/* --------------------------------------------------------- */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 border-b pb-4">
              <h3 className="font-black text-base text-gray-900">{pgInfo.name || 'PG-SETU'}</h3>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Official Payment Receipt</p>
              <span className="inline-block mt-1 font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                {selectedReceipt.payment_number || 'RECEIPT'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Resident:</span>
                <span className="font-bold text-gray-900">{resident.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reg No:</span>
                <span className="font-mono text-gray-900">{resident.registration_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Date:</span>
                <span className="font-semibold text-gray-900">{formatDate(selectedReceipt.payment_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Method:</span>
                <span className="font-bold text-gray-900 uppercase">{selectedReceipt.payment_method}</span>
              </div>
              {selectedReceipt.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction/Ref:</span>
                  <span className="font-mono text-gray-900">{selectedReceipt.transaction_id}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t text-sm">
                <span className="font-bold text-gray-900">Amount Paid:</span>
                <span className="font-black text-green-700 text-base">{formatCurrency(selectedReceipt.amount_paise)}</span>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-center text-xs text-green-800 font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Verified & Credited to Digital Ledger</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 2: INVOICE STATEMENT SLIP */}
      {/* --------------------------------------------------------- */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 border-b pb-4">
              <h3 className="font-black text-base text-gray-900">{pgInfo.name || 'PG-SETU'}</h3>
              <p className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Invoice Statement</p>
              <span className="inline-block mt-1 font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                {selectedInvoice.invoice_number}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Resident:</span>
                <span className="font-bold text-gray-900">{resident.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Billing Period:</span>
                <span className="font-semibold text-gray-900">
                  {formatDate(selectedInvoice.period_start)} – {formatDate(selectedInvoice.period_end)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date:</span>
                <span className="font-bold text-red-600">{formatDate(selectedInvoice.due_date)}</span>
              </div>

              {/* Items */}
              {selectedInvoice.invoice_items && (
                <div className="bg-gray-50 p-3 rounded-xl space-y-1 mt-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Itemized Breakdown</span>
                  {selectedInvoice.invoice_items.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-[11px]">
                      <span>{it.description}</span>
                      <span className="font-bold">{formatCurrency(it.total_paise)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-bold text-gray-900">Total Invoice:</span>
                <span className="font-black text-gray-900">{formatCurrency(selectedInvoice.total_paise)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-bold">Amount Paid:</span>
                <span className="font-black text-green-700">-{formatCurrency(selectedInvoice.paid_paise)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t text-sm font-black">
                <span className="text-red-700">Balance Due:</span>
                <span className="text-red-700">{formatCurrency(selectedInvoice.balance_paise)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Bill
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* MODAL 3: INSTANT UPI PAYMENT QR MODAL */}
      {/* --------------------------------------------------------- */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative border border-gray-100 text-center">
            <button
              type="button"
              onClick={() => {
                setShowQrModal(false)
                setCopiedUpi(false)
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                Instant UPI Payment
              </span>
              <h3 className="font-black text-base text-gray-900">{pgInfo.name || 'PG-SETU Accommodation'}</h3>
              <p className="text-2xl font-black text-emerald-700">
                ₹{qrAmountRupees.toLocaleString('en-IN')}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-2xl border-2 border-emerald-100 shadow-inner inline-block mx-auto">
              {(() => {
                const upiString = `upi://pay?pa=${encodeURIComponent(pgInfo.upi_id || 'pgsetu@upi')}&pn=${encodeURIComponent(pgInfo.name || 'PG Accommodation')}&am=${qrAmountRupees.toFixed(2)}&tn=${encodeURIComponent(qrNote || 'Rent')}&cu=INR`
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(upiString)}`

                return (
                  <div className="space-y-2">
                    <img
                      src={qrUrl}
                      alt="UPI QR Code"
                      className="w-48 h-48 mx-auto rounded-lg"
                      loading="eager"
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Scan with GPay · PhonePe · Paytm · BHIM
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* Copy UPI ID */}
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
              <div className="text-left min-w-0">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">UPI ID</span>
                <span className="font-mono font-bold text-gray-800 text-[11px] truncate block">
                  {pgInfo.upi_id || 'pgsetu@upi'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pgInfo.upi_id || 'pgsetu@upi')
                  setCopiedUpi(true)
                  setTimeout(() => setCopiedUpi(false), 2000)
                }}
                className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Direct App Link for mobile */}
            {(() => {
              const upiString = `upi://pay?pa=${encodeURIComponent(pgInfo.upi_id || 'pgsetu@upi')}&pn=${encodeURIComponent(pgInfo.name || 'PG Accommodation')}&am=${qrAmountRupees.toFixed(2)}&tn=${encodeURIComponent(qrNote || 'Rent')}&cu=INR`
              return (
                <a
                  href={upiString}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="w-4 h-4" /> Open Installed UPI App
                </a>
              )
            })()}

            <p className="text-[10px] text-gray-400">
              After paying, share a payment screenshot with your PG manager on WhatsApp for immediate receipt confirmation.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
