'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, MapPin, User, ShieldCheck, Zap, CreditCard,
  Users, CheckCircle2, ArrowRight, ArrowLeft, Loader2,
  Sparkles, Layers, Home, Phone, Mail, FileText, QrCode,
  DollarSign, Plus, Trash2, AlertCircle, Info, Landmark,
  Clock, Award, Lock, ChevronRight, Copy, Check, ExternalLink
} from 'lucide-react'

interface StaffMember {
  name: string
  role: 'manager' | 'warden' | 'caretaker' | 'accountant' | 'security'
  phone: string
  email: string
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/dashboard'
  const isFromAdmin = returnTo.includes('/superman') || returnTo.includes('/admin')

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [onboardingSuccessData, setOnboardingSuccessData] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Form State
  const [form, setForm] = useState({
    // Step 1: PG Identity & Location
    org_name: '',
    property_name: '',
    pg_type: 'coliving', // 'boys' | 'girls' | 'coliving'
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    map_link: '',

    // Step 2: Owner & Dashboard Access
    owner_name: '',
    phone: '',
    email: '',
    emergency_phone: '',
    gst_enabled: false,
    gstin: '',

    // Step 3: Room Inventory & Floor Architecture
    num_buildings: 1,
    num_floors: 2,
    rooms_per_floor: 4,
    default_beds_per_room: 2,
    single_rent_rupees: 9000,
    double_rent_rupees: 6500,
    triple_rent_rupees: 5000,
    four_rent_rupees: 4000,
    deposit_policy: 'one_month', // 'one_month' | 'two_month' | 'fixed' | 'none'
    deposit_fixed_rupees: 5000,
    billing_cycle_day: 1,
    notice_period_days: 30,

    // Step 4: Electricity & Utilities
    electricity_billing_type: 'sub_meter', // 'sub_meter' | 'included' | 'fixed'
    rate_per_unit_rupees: 9,
    maintenance_fee_rupees: 0,

    // Step 5: Bank & UPI Autopay Settlement
    upi_id: '',
    bank_account_no: '',
    bank_ifsc: '',
    bank_account_holder: '',
    bank_name: '',
    late_fee_daily_rupees: 50,
  })

  // Step 6: Staff Members
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [newStaff, setNewStaff] = useState<StaffMember>({
    name: '',
    role: 'manager',
    phone: '',
    email: '',
  })

  const addStaffMember = () => {
    if (!newStaff.name || (!newStaff.phone && !newStaff.email)) {
      alert('Please enter staff name and at least a phone number or email.')
      return
    }
    setStaffMembers([...staffMembers, newStaff])
    setNewStaff({ name: '', role: 'warden', phone: '', email: '' })
  }

  const removeStaffMember = (index: number) => {
    setStaffMembers(staffMembers.filter((_, i) => i !== index))
  }

  // Calculations
  const calculatedRooms = (Number(form.num_floors) || 1) * (Number(form.rooms_per_floor) || 1) * (Number(form.num_buildings) || 1)
  const calculatedBeds = calculatedRooms * (Number(form.default_beds_per_room) || 1)
  const estimatedRentPerBed =
    form.default_beds_per_room === 1
      ? form.single_rent_rupees
      : form.default_beds_per_room === 2
      ? form.double_rent_rupees
      : form.default_beds_per_room === 3
      ? form.triple_rent_rupees
      : form.four_rent_rupees
  const projectedMonthlyRevenue = calculatedBeds * Number(estimatedRentPerBed)

  const steps = [
    { id: 1, title: 'PG & Address', icon: MapPin, desc: 'Location & Campus' },
    { id: 2, title: 'Owner & Login', icon: User, desc: 'Contact & Access' },
    { id: 3, title: 'Rooms & Beds', icon: Layers, desc: 'Inventory & Rent' },
    { id: 4, title: 'Electricity & Utilities', icon: Zap, desc: 'Sub-Meters & Units' },
    { id: 5, title: 'UPI & Bank Settlement', icon: CreditCard, desc: 'Direct Rent Inflow' },
    { id: 6, title: 'Staff & Wardens', icon: Users, desc: 'Roles & Access' },
    { id: 7, title: 'Review & Launch', icon: Sparkles, desc: '1-Click Go Live' },
  ]

  const validateStep = (step: number) => {
    setError('')
    if (step === 1) {
      if (!form.org_name.trim()) return 'Please enter your PG Brand / Business Name.'
      if (!form.property_name.trim()) return 'Please enter your Property Campus Name.'
      if (!form.city.trim()) return 'Please enter the City.'
      if (!form.address_line1.trim()) return 'Please enter the Street Address.'
    }
    if (step === 2) {
      if (!form.owner_name.trim()) return 'Please enter the Owner Full Name.'
      if (!form.phone.trim()) return 'Please enter the Owner Mobile Number.'
    }
    if (step === 3) {
      if (form.num_floors < 1) return 'Floors must be at least 1.'
      if (form.rooms_per_floor < 1) return 'Rooms per floor must be at least 1.'
    }
    return null
  }

  const nextStep = () => {
    const err = validateStep(currentStep)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setCurrentStep((prev) => Math.min(prev + 1, 7))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setError('')
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...form,
        staff_members: staffMembers,
      }

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to onboard PG profile.')
      }

      // Successful onboarding - show credentials modal
      setOnboardingSuccessData(data)
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(err.message || 'Onboarding error. Please check your inputs.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Background Decor */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm tracking-tight text-white flex items-center gap-1.5">
                PG-SETU <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Enterprise Onboarding</span>
              </span>
              <p className="text-[11px] text-slate-400">Complete Live Campus Provisioning Wizard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isFromAdmin && (
              <Link
                href={returnTo}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
              >
                ← Back to Command Center
              </Link>
            )}

            <div className="hidden sm:flex items-center gap-3 text-xs">
              <span className="text-slate-400">Step <strong className="text-white">{currentStep}</strong> of 7</span>
              <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 7) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full relative z-10 flex-1">
        
        {/* Super Admin Notice if launched from Admin panel */}
        {isFromAdmin && (
          <div className="mb-6 p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-2xl flex items-center justify-between text-xs text-blue-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span><strong>Super Admin Mode:</strong> Onboarding a new PG property into the central platform fleet. Once completed, you will be redirected back to the Command Center.</span>
            </div>
          </div>
        )}

        {/* Step Progress Pills */}
        <div className="hidden md:grid grid-cols-7 gap-2 mb-8">
          {steps.map((s) => {
            const Icon = s.icon
            const isCompleted = currentStep > s.id
            const isCurrent = currentStep === s.id
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (s.id < currentStep) setCurrentStep(s.id)
                }}
                disabled={s.id > currentStep}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : isCompleted
                    ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-slate-900/30 border-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-blue-500 text-white' : isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">0{s.id}</span>
                </div>
                <span className="text-xs font-bold truncate w-full">{s.title}</span>
                <span className="text-[10px] text-slate-500 truncate w-full">{s.desc}</span>
              </button>
            )
          })}
        </div>

        {/* Mobile Step Header */}
        <div className="md:hidden flex items-center justify-between bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              {(() => {
                const Icon = steps[currentStep - 1].icon
                return <Icon className="w-4 h-4" />
              })()}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Step {currentStep} of 7</span>
              <h2 className="text-sm font-black text-white">{steps[currentStep - 1].title}</h2>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">{Math.round((currentStep / 7) * 100)}%</span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-xs text-rose-300 font-semibold flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Form Step Box */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">

              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: PG IDENTITY & COMPLETE LOCATION ADDRESS
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-400" /> PG Brand & Full Address
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your PG brand identity and exact geographic location for tenant search and digital invoicing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        PG Brand / Business Name *
                      </label>
                      <input
                        required
                        value={form.org_name}
                        onChange={(e) => setForm({ ...form, org_name: e.target.value })}
                        placeholder="e.g. Sai Executive Luxury Living"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Property Campus Name *
                      </label>
                      <input
                        required
                        value={form.property_name}
                        onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                        placeholder="e.g. Hinjawadi Phase 1 Campus"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      PG Type / Category
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'coliving', label: 'Unisex / Co-Living' },
                        { id: 'boys', label: 'Boys Only PG' },
                        { id: 'girls', label: 'Girls Only PG' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm({ ...form, pg_type: t.id })}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-center ${
                            form.pg_type === t.id
                              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                      Geographic Location & Street Address
                    </span>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Street Address Line 1 *
                      </label>
                      <input
                        required
                        value={form.address_line1}
                        onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                        placeholder="Building No, Plot No, Street Name, Cross Road"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Address Line 2 (Area / Locality)
                        </label>
                        <input
                          value={form.address_line2}
                          onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                          placeholder="Sector, Colony, Phase"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Prominent Landmark
                        </label>
                        <input
                          value={form.landmark}
                          onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                          placeholder="e.g. Near Wipro Circle / Behind Metro Station"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">City *</label>
                        <input
                          required
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="e.g. Pune / Bengaluru"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">State</label>
                        <input
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          placeholder="e.g. Maharashtra"
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Pincode</label>
                        <input
                          value={form.pincode}
                          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                          placeholder="6-digit PIN"
                          maxLength={6}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Google Maps Location Link (Optional)
                      </label>
                      <input
                        value={form.map_link}
                        onChange={(e) => setForm({ ...form, map_link: e.target.value })}
                        placeholder="https://maps.google.com/?q=..."
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: OWNER & DASHBOARD LOGIN DETAILS
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-400" /> Owner Contact & Dashboard Access
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter the primary proprietor/director details. This email and phone will receive executive reports and owner access.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Owner / Proprietor Full Name *
                      </label>
                      <input
                        required
                        value={form.owner_name}
                        onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                        placeholder="e.g. Vikram Tomar"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none transition font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Owner WhatsApp Mobile Number *
                      </label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none transition font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Owner Primary Email (Dashboard Login)
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="owner@example.com"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none transition font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Emergency / Alternate Phone
                      </label>
                      <input
                        type="tel"
                        value={form.emergency_phone}
                        onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                        placeholder="Manager / Security number"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-indigo-500 outline-none transition font-medium"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200">GST Registration & Tax Invoicing</span>
                        <p className="text-[11px] text-slate-500">Enable if your PG business is GST registered</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.gst_enabled}
                        onChange={(e) => setForm({ ...form, gst_enabled: e.target.checked })}
                        className="w-5 h-5 rounded-md text-blue-600 bg-slate-900 border-slate-700"
                      />
                    </div>

                    {form.gst_enabled && (
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          15-Digit GSTIN Number *
                        </label>
                        <input
                          value={form.gstin}
                          onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          maxLength={15}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:border-blue-500 outline-none uppercase"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: ROOM INVENTORY & FLOOR ARCHITECTURE
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-400" /> Building Floors & Bed Pricing Matrix
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Generate your initial room layout automatically. You can always customize individual rooms later.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">Buildings</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={form.num_buildings}
                        onChange={(e) => setForm({ ...form, num_buildings: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">Floors / Bldg</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.num_floors}
                        onChange={(e) => setForm({ ...form, num_floors: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">Rooms / Floor</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={form.rooms_per_floor}
                        onChange={(e) => setForm({ ...form, rooms_per_floor: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-sm outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      <label className="block text-slate-400 text-[11px] font-bold uppercase mb-1">Beds / Room</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={form.default_beds_per_room}
                        onChange={(e) => setForm({ ...form, default_beds_per_room: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black text-sm outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      Standard Monthly Rent per Sharing Type (₹)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">1-Sharing (Single)</label>
                        <input
                          type="number"
                          step={500}
                          value={form.single_rent_rupees}
                          onChange={(e) => setForm({ ...form, single_rent_rupees: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">2-Sharing (Double)</label>
                        <input
                          type="number"
                          step={500}
                          value={form.double_rent_rupees}
                          onChange={(e) => setForm({ ...form, double_rent_rupees: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">3-Sharing (Triple)</label>
                        <input
                          type="number"
                          step={500}
                          value={form.triple_rent_rupees}
                          onChange={(e) => setForm({ ...form, triple_rent_rupees: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">4-Sharing (Four)</label>
                        <input
                          type="number"
                          step={500}
                          value={form.four_rent_rupees}
                          onChange={(e) => setForm({ ...form, four_rent_rupees: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Security Deposit Rule</label>
                      <select
                        value={form.deposit_policy}
                        onChange={(e) => setForm({ ...form, deposit_policy: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="one_month">1 Month Rent Equivalent</option>
                        <option value="two_month">2 Months Rent Equivalent</option>
                        <option value="fixed">Fixed Deposit Amount (₹)</option>
                        <option value="none">No Security Deposit</option>
                      </select>
                    </div>

                    {form.deposit_policy === 'fixed' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Fixed Deposit (₹)</label>
                        <input
                          type="number"
                          step={500}
                          value={form.deposit_fixed_rupees}
                          onChange={(e) => setForm({ ...form, deposit_fixed_rupees: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Rent Billing Cycle Day</label>
                      <select
                        value={form.billing_cycle_day}
                        onChange={(e) => setForm({ ...form, billing_cycle_day: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value={1}>1st of Every Month</option>
                        <option value={5}>5th of Every Month</option>
                        <option value={10}>10th of Every Month</option>
                        <option value={15}>15th of Every Month</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4: ELECTRICITY & UTILITIES SETUP
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" /> Utility & Sub-Meter Electricity
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure how electricity sub-meters and maintenance fees are calculated and charged to residents.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Electricity Billing Model
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'sub_meter', title: 'Room Sub-Meter', desc: 'Auto-split unit readings among room roommates' },
                        { id: 'included', title: 'Included in Rent', desc: 'No separate meter charge (Zero friction)' },
                        { id: 'fixed', title: 'Fixed Utility Surcharge', desc: 'Flat monthly utility fee per bed' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setForm({ ...form, electricity_billing_type: m.id })}
                          className={`p-4 rounded-2xl border text-left transition ${
                            form.electricity_billing_type === m.id
                              ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-black block text-white mb-1">{m.title}</span>
                          <span className="text-[11px] text-slate-400 leading-tight block">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.electricity_billing_type === 'sub_meter' && (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Electricity Rate per Unit (₹ / kWh) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step={0.5}
                            min={1}
                            value={form.rate_per_unit_rupees}
                            onChange={(e) => setForm({ ...form, rate_per_unit_rupees: Number(e.target.value) })}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-500 outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">₹/unit</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Sub-Meter Allocation Logic
                        </label>
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Equal division among active room residents</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Monthly Maintenance / Cleaning Fee (₹)
                      </label>
                      <input
                        type="number"
                        step={100}
                        value={form.maintenance_fee_rupees}
                        onChange={(e) => setForm({ ...form, maintenance_fee_rupees: Number(e.target.value) })}
                        placeholder="0 (if included in rent)"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Checkout Notice Period (Days)
                      </label>
                      <select
                        value={form.notice_period_days}
                        onChange={(e) => setForm({ ...form, notice_period_days: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
                      >
                        <option value={15}>15 Days Notice</option>
                        <option value={30}>30 Days (Standard 1 Month)</option>
                        <option value={60}>60 Days (2 Months)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 5: UPI AUTOPAY & BANK SETTLEMENT
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-400" /> Direct UPI & Bank Settlement Setup
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your direct UPI ID and bank account. Tenants will see your QR code in their digital passbook (`/portal`) to pay rent directly to your bank account.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-950/30 border border-purple-800/50 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                      <QrCode className="w-4 h-4" /> 0% Platform Fee · Direct PG Inflow
                    </div>
                    <p className="text-[11px] text-slate-400">
                      PG-SETU does NOT hold your funds. 100% of tenant rent goes directly to your bank account via your UPI VPA.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Direct PG Owner UPI ID (VPA) *
                    </label>
                    <div className="relative">
                      <input
                        value={form.upi_id}
                        onChange={(e) => setForm({ ...form, upi_id: e.target.value.toLowerCase().trim() })}
                        placeholder="e.g. saipg@okhdfcbank or 9876543210@paytm"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:border-purple-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Bank Account Holder Name
                      </label>
                      <input
                        value={form.bank_account_holder}
                        onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })}
                        placeholder="e.g. Sai Executive Living Pvt Ltd"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Bank Account Number
                      </label>
                      <input
                        value={form.bank_account_no}
                        onChange={(e) => setForm({ ...form, bank_account_no: e.target.value })}
                        placeholder="Account No"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Bank IFSC Code
                      </label>
                      <input
                        value={form.bank_ifsc}
                        onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value.toUpperCase() })}
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono uppercase text-white focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Late Payment Penalty (₹ / day overdue)
                      </label>
                      <input
                        type="number"
                        value={form.late_fee_daily_rupees}
                        onChange={(e) => setForm({ ...form, late_fee_daily_rupees: Number(e.target.value) })}
                        placeholder="50"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 6: STAFF & WARDEN SETUP
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 6 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-400" /> Initial Staff & Warden Provisioning
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Add your property managers, wardens, or caretakers so they can log in and manage day-to-day check-ins and payments.
                    </p>
                  </div>

                  {/* Add New Staff Form */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                      + Add Staff Member (Optional)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Staff Full Name</label>
                        <input
                          value={newStaff.name}
                          onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                          placeholder="e.g. Ramesh Sharma"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Role / Designation</label>
                        <select
                          value={newStaff.role}
                          onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                        >
                          <option value="manager">Property Manager (Check-in, Billing, Full Control)</option>
                          <option value="warden">Hostel Warden (Attendance, Room KYC, Complaints)</option>
                          <option value="caretaker">Caretaker / Maintenance Staff</option>
                          <option value="accountant">Accountant / Cashier</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mobile Phone (WhatsApp)</label>
                        <input
                          type="tel"
                          value={newStaff.phone}
                          onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                          placeholder="10-digit mobile"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                          placeholder="staff@example.com"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addStaffMember}
                      className="py-2 px-4 bg-teal-600/20 border border-teal-500/40 text-teal-300 font-bold text-xs rounded-xl hover:bg-teal-600/30 transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Staff to Roster
                    </button>
                  </div>

                  {/* List of Added Staff */}
                  {staffMembers.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">
                        Assigned Staff ({staffMembers.length})
                      </span>
                      <div className="space-y-2">
                        {staffMembers.map((staff, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                                {staff.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{staff.name}</span>
                                <span className="text-[11px] text-slate-400 capitalize">
                                  {staff.role} · {staff.phone || staff.email}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeStaffMember(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 7: FINAL REVIEW & LIVE 1-CLICK LAUNCH
              ───────────────────────────────────────────────────────────── */}
              {currentStep === 7 && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" /> Review & Launch PG Platform
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify your PG configuration below. Clicking launch will generate all rooms, sub-meters, and billing rules in real time.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <span className="text-slate-500 text-[11px] block">PG Brand & Campus</span>
                        <strong className="text-white text-sm">{form.org_name || 'My PG Brand'}</strong>
                        <p className="text-slate-400 text-[11px]">{form.property_name}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px] block">Full Address</span>
                        <p className="text-slate-300 text-[11px]">
                          {form.address_line1}, {form.city} {form.state && `(${form.state})`} - {form.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Capacity</span>
                        <strong className="text-blue-400 text-sm">{calculatedBeds} Beds</strong>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Rooms</span>
                        <strong className="text-emerald-400 text-sm">{calculatedRooms} Rooms</strong>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Avg. Rent</span>
                        <strong className="text-white text-sm">₹{estimatedRentPerBed}/mo</strong>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Direct UPI</span>
                        <strong className="text-purple-400 text-[11px] font-mono truncate block">{form.upi_id || 'saipg@upi'}</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                      <div className="text-[11px] text-blue-200">
                        <strong>Ready for live distribution.</strong> All tenant receipts, WhatsApp reminders, and ledger entries will be activated immediately.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={loading}
                    className="py-3 px-5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {currentStep < 7 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="py-3 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center gap-2"
                  >
                    Continue to Step {currentStep + 1} <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="py-3.5 px-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{loading ? 'Provisioning Live PG Platform...' : 'Launch Live PG Management Dashboard →'}</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Right Sticky Metric & Live Capacity Simulator Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Campus Scope</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  ₹10 / Bed / Mo
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Managed Capacity</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-black text-white">{calculatedBeds}</span>
                    <span className="text-xs text-slate-400 font-semibold">Active Beds</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Across {calculatedRooms} rooms · {form.num_floors} floors
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Projected 100% Monthly GTV
                  </span>
                  <div className="text-xl font-black text-emerald-400">
                    ₹{projectedMonthlyRevenue.toLocaleString('en-IN')}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">/ month</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-full rounded-full" />
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">PG Type</span>
                    <span className="font-bold capitalize text-white">{form.pg_type}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Sub-Meters</span>
                    <span className="font-bold text-amber-400">
                      {form.electricity_billing_type === 'sub_meter' ? `${calculatedRooms} Sub-Meters` : 'Fixed Utility'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Staff Assigned</span>
                    <span className="font-bold text-teal-400">{staffMembers.length} Accounts</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Direct UPI Inflow</span>
                    <span className="font-bold text-purple-400 font-mono text-[11px] truncate max-w-[120px]">
                      {form.upi_id || 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>Instant Scale:</strong> Once launched, you can immediately check in tenants, split electricity units, and send WhatsApp rent links.
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* ─────────────────────────────────────────────────────────────
          ONBOARDING SUCCESS & 8-DIGIT CREDENTIALS REVEAL MODAL
      ───────────────────────────────────────────────────────────── */}
      {onboardingSuccessData && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            
            {/* Header Badge */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                PG Setup Completed Successfully!
              </h2>
              <p className="text-xs text-slate-300">
                <strong>{onboardingSuccessData.summary?.organization_name}</strong> is live in Supabase with{' '}
                <strong className="text-emerald-400">{onboardingSuccessData.summary?.total_rooms} Rooms</strong> and{' '}
                <strong className="text-emerald-400">{onboardingSuccessData.summary?.total_beds} Beds</strong>.
              </p>
            </div>

            {/* Owner Credentials Card */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> PG Owner Dashboard Login
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  Saved in Supabase
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between py-1.5 px-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Login Email:</span>
                  <strong className="text-white font-mono">{onboardingSuccessData.credentials?.email}</strong>
                </div>

                <div className="flex items-center justify-between py-2 px-3 bg-blue-950/40 rounded-xl border border-blue-800/50">
                  <div>
                    <span className="text-blue-300 font-bold block text-[11px]">8-Digit Temporary Password:</span>
                    <span className="text-[10px] text-slate-400">Owner can change anytime from Settings</span>
                  </div>
                  <strong className="text-xl font-mono font-black text-amber-300 tracking-widest px-2 py-0.5 bg-slate-900 rounded-lg border border-amber-500/30">
                    {onboardingSuccessData.credentials?.temporary_password}
                  </strong>
                </div>
              </div>

              {/* 1-Click Copy Button */}
              <button
                type="button"
                onClick={() => {
                  const credsText = `🏢 PG-SETU Login Credentials for ${onboardingSuccessData.summary?.organization_name}\n\n📧 Email: ${onboardingSuccessData.credentials?.email}\n🔑 8-Digit Password: ${onboardingSuccessData.credentials?.temporary_password}\n🌐 Login URL: https://staysetu-ruby.vercel.app/login`
                  navigator.clipboard.writeText(credsText)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2500)
                }}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Credentials Copied to Clipboard!' : 'Copy Login Credentials (Email & Password)'}</span>
              </button>
            </div>

            {/* Staff Accounts (if any) */}
            {onboardingSuccessData.staff_credentials?.length > 0 && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5 text-teal-400" /> Staff & Warden Accounts ({onboardingSuccessData.staff_credentials.length})
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {onboardingSuccessData.staff_credentials.map((st: any, idx: number) => (
                    <div key={idx} className="p-2 bg-slate-900 rounded-lg flex items-center justify-between text-[11px]">
                      <div>
                        <strong className="text-white block">{st.name} ({st.role})</strong>
                        <span className="text-slate-400">{st.email}</span>
                      </div>
                      <span className="font-mono text-amber-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {st.temporary_password}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  router.push(returnTo)
                  router.refresh()
                }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-xl shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>{isFromAdmin ? 'Return to Command Center (/superman) →' : 'Enter PG Dashboard Now →'}</span>
              </button>

              {onboardingSuccessData.credentials?.phone && (
                <a
                  href={`https://wa.me/91${onboardingSuccessData.credentials.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${onboardingSuccessData.credentials.full_name},\nWelcome to PG-SETU! Your PG property "${onboardingSuccessData.summary?.organization_name}" has been provisioned.\n\n*Your Dashboard Login Details:*\n📧 Email: ${onboardingSuccessData.credentials.email}\n🔑 8-Digit Password: ${onboardingSuccessData.credentials.temporary_password}\n🌐 Login Link: https://staysetu-ruby.vercel.app/login`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" /> Send Login Details to Owner on WhatsApp
                </a>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
        PG-SETU Platform Enterprise · Built for large-scale PG & Hostel operations across India
      </footer>
    </div>
  )
}

export default function EnterpriseOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
