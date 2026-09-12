'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UserPlus, ArrowLeft, ArrowRight, CheckCircle2,
  Building2, BedDouble, Shield, FileText, Loader2, DollarSign,
  Phone, Lock, Sparkles, RefreshCw, KeyRound, AlertCircle, Check,
  UserCheck, ShieldCheck, MapPin, Contact
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'
import { FirebaseFileUploader } from '@/components/ui/firebase-file-uploader'

export default function CheckInResidentPage() {
  const router = useRouter()

  // OTP Verification State (Mandatory Gate before check-in details)
  const [isMobileVerified, setIsMobileVerified] = useState(false)
  const [verifyMobile, setVerifyMobile] = useState('')
  const [verifyOtp, setVerifyOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState('')

  // Form & Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<{ registration_number: string; resident_id: string } | null>(null)

  // Isolated PG Inventory state
  const [inventory, setInventory] = useState<{
    properties: any[]
    buildings: any[]
    floors: any[]
    rooms: any[]
    beds: any[]
  }>({ properties: [], buildings: [], floors: [], rooms: [], beds: [] })

  // Lookup & Auto-fill State
  const [existingTenant, setExistingTenant] = useState<any | null>(null)
  const [suggestedTenantId, setSuggestedTenantId] = useState<string | null>(null)
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    tenant_id: '',
    // Step 1: Personal
    full_name: '',
    phone: '',
    alternate_phone: '',
    email: '',
    date_of_birth: '',
    gender: 'male',
    // Step 2: Address & Emergency
    permanent_address: '',
    permanent_city: '',
    permanent_state: '',
    permanent_pincode: '',
    emergency_name: '',
    emergency_phone: '',
    emergency_relation: 'Parent',
    // Step 3: ID Proof
    id_type: 'aadhaar',
    id_number: '',
    kyc_doc_url: '',
    notes: '',
    // Step 4: Assignment
    property_id: '',
    building_id: '',
    floor_id: '',
    room_id: '',
    bed_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    monthly_rent_rupees: 6000,
    billing_cycle_day: 1,
    proration_policy: 'daily',
    // Step 5: Security Deposit
    deposit_amount_rupees: 10000,
    deposit_payment_method: 'upi',
  })

  // Clean 10-digit mobile
  const cleanPhoneDigits = (m: string) => m.replace(/\D/g, '').slice(-10)

  // Load isolated PG inventory from server API on mount
  useEffect(() => {
    async function loadInventory() {
      setDataLoading(true)
      try {
        const res = await fetch('/api/residents/checkin')
        if (!res.ok) throw new Error('Failed to load PG inventory')
        const data = await res.json()
        setInventory(data)

        if (data.properties && data.properties.length > 0) {
          const firstProp = data.properties[0]
          const propBldgs = (data.buildings || []).filter((b: any) => b.property_id === firstProp.id)
          const firstBldg = propBldgs[0] || (data.buildings || [])[0]
          const bldgFloors = firstBldg ? (data.floors || []).filter((fl: any) => fl.building_id === firstBldg.id) : []
          const firstFloor = bldgFloors[0] || (data.floors || [])[0]
          const floorRooms = firstFloor ? (data.rooms || []).filter((r: any) => r.floor_id === firstFloor.id) : []
          const firstRoom = floorRooms[0] || (data.rooms || [])[0]
          const roomBeds = firstRoom ? (data.beds || []).filter((bd: any) => bd.room_id === firstRoom.id && bd.status === 'available') : []
          const firstBed = roomBeds[0] || null

          setForm((prev) => ({
            ...prev,
            property_id: firstProp.id,
            building_id: firstBldg?.id || '',
            floor_id: firstFloor?.id || '',
            room_id: firstRoom?.id || '',
            bed_id: firstBed?.id || '',
            monthly_rent_rupees: firstRoom?.base_rent_paise ? firstRoom.base_rent_paise / 100 : prev.monthly_rent_rupees,
          }))
        }
      } catch (err: any) {
        console.error('Inventory load error:', err)
      } finally {
        setDataLoading(false)
      }
    }
    loadInventory()
  }, [])

  // Dynamic filter helpers for cascading dropdowns
  const availableBuildings = inventory.buildings.filter(
    (b) => !form.property_id || b.property_id === form.property_id
  )

  const availableFloors = inventory.floors.filter(
    (fl) => !form.building_id || fl.building_id === form.building_id
  )

  const availableRooms = inventory.rooms.filter(
    (rm) => !form.floor_id || rm.floor_id === form.floor_id
  )

  const availableBeds = inventory.beds.filter(
    (bd) => (!form.room_id || bd.room_id === form.room_id) && bd.status === 'available'
  )

  const handleBuildingChange = (bldgId: string) => {
    const bldgFloors = inventory.floors.filter((fl) => fl.building_id === bldgId)
    const firstFloor = bldgFloors[0] || null
    const floorRooms = firstFloor ? inventory.rooms.filter((rm) => rm.floor_id === firstFloor.id) : []
    const firstRoom = floorRooms[0] || null
    const roomBeds = firstRoom ? inventory.beds.filter((bd) => bd.room_id === firstRoom.id && bd.status === 'available') : []
    const firstBed = roomBeds[0] || null

    setForm((prev) => ({
      ...prev,
      building_id: bldgId,
      floor_id: firstFloor?.id || '',
      room_id: firstRoom?.id || '',
      bed_id: firstBed?.id || '',
      monthly_rent_rupees: firstRoom?.base_rent_paise ? firstRoom.base_rent_paise / 100 : prev.monthly_rent_rupees,
    }))
  }

  const handleFloorChange = (floorId: string) => {
    const floorRooms = inventory.rooms.filter((rm) => rm.floor_id === floorId)
    const firstRoom = floorRooms[0] || null
    const roomBeds = firstRoom ? inventory.beds.filter((bd) => bd.room_id === firstRoom.id && bd.status === 'available') : []
    const firstBed = roomBeds[0] || null

    setForm((prev) => ({
      ...prev,
      floor_id: floorId,
      room_id: firstRoom?.id || '',
      bed_id: firstBed?.id || '',
      monthly_rent_rupees: firstRoom?.base_rent_paise ? firstRoom.base_rent_paise / 100 : prev.monthly_rent_rupees,
    }))
  }

  const handleRoomChange = (roomId: string) => {
    const roomObj = inventory.rooms.find((rm) => rm.id === roomId)
    const roomBeds = inventory.beds.filter((bd) => bd.room_id === roomId && bd.status === 'available')
    const firstBed = roomBeds[0] || null

    setForm((prev) => ({
      ...prev,
      room_id: roomId,
      bed_id: firstBed?.id || '',
      monthly_rent_rupees: roomObj?.base_rent_paise ? roomObj.base_rent_paise / 100 : prev.monthly_rent_rupees,
    }))
  }

  // ─────────────────────────────────────────────────────────────
  // 1. SEND OTP TO RESIDENT MOBILE
  // ─────────────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setOtpError('')

    const clean = cleanPhoneDigits(verifyMobile)
    if (clean.length < 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    setSendingOtp(true)
    try {
      const res = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', mobile: clean }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP to resident.')
      }

      setOtpSent(true)
      if (data.devOtp) {
        setDevOtp(data.devOtp)
      }
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP.')
    } finally {
      setSendingOtp(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VERIFY RESIDENT OTP & AUTO-FILL FROM DATABASE
  // ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setOtpError('')

    const clean = cleanPhoneDigits(verifyMobile)
    const code = verifyOtp.trim()

    if (!code) {
      setOtpError('Please enter the 6-digit OTP sent to the resident.')
      return
    }

    setVerifyingOtp(true)
    try {
      // Step A: Verify OTP with server
      const verifyRes = await fetch('/api/auth/mobile-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-resident-otp',
          mobile: clean,
          otp: code,
        }),
      })
      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Invalid or expired OTP. Please enter the correct code.')
      }

      // Step B: Query database for this resident's pre-existing profile
      const lookupRes = await fetch(`/api/tenants/lookup?phone=${clean}`)
      let lookupData: any = null
      if (lookupRes.ok) {
        lookupData = await lookupRes.json()
      }

      const filled = new Set<string>()

      if (lookupData?.found) {
        setExistingTenant(lookupData)
        setSuggestedTenantId(lookupData.tenant_id)

        // Automatically fill all available fields from database
        const newFormValues = {
          ...form,
          phone: clean,
          tenant_id: lookupData.tenant_id || form.tenant_id,
          full_name: lookupData.full_name || form.full_name,
          alternate_phone: lookupData.alternate_phone || form.alternate_phone,
          email: lookupData.email || form.email,
          date_of_birth: lookupData.date_of_birth || form.date_of_birth,
          gender: lookupData.gender || form.gender || 'male',
          permanent_address: lookupData.permanent_address || form.permanent_address,
          permanent_city: lookupData.permanent_city || form.permanent_city,
          permanent_state: lookupData.permanent_state || form.permanent_state,
          permanent_pincode: lookupData.permanent_pincode || form.permanent_pincode,
          emergency_name: lookupData.emergency_name || form.emergency_name,
          emergency_phone: lookupData.emergency_phone || form.emergency_phone,
          emergency_relation: lookupData.emergency_relation || form.emergency_relation || 'Parent',
          id_type: lookupData.id_type || form.id_type || 'aadhaar',
          id_number: lookupData.id_number || form.id_number,
          notes: lookupData.profession ? `Profession: ${lookupData.profession}` : form.notes,
        }

        // Track which fields were auto-filled
        if (lookupData.full_name) filled.add('full_name')
        if (lookupData.email) filled.add('email')
        if (lookupData.alternate_phone) filled.add('alternate_phone')
        if (lookupData.date_of_birth) filled.add('date_of_birth')
        if (lookupData.gender) filled.add('gender')
        if (lookupData.permanent_address) filled.add('permanent_address')
        if (lookupData.permanent_city) filled.add('permanent_city')
        if (lookupData.permanent_state) filled.add('permanent_state')
        if (lookupData.emergency_name) filled.add('emergency_name')
        if (lookupData.emergency_phone) filled.add('emergency_phone')
        if (lookupData.emergency_relation) filled.add('emergency_relation')
        if (lookupData.id_number) filled.add('id_number')
        filled.add('phone')
        filled.add('tenant_id')

        setForm(newFormValues)
        setAutoFilledFields(filled)
      } else {
        // New resident (Not yet available in database)
        setExistingTenant(null)
        const genId = lookupData?.tenant_id || `TN-${clean.slice(-4)}-${new Date().getFullYear()}`
        setSuggestedTenantId(genId)
        setForm((prev) => ({
          ...prev,
          phone: clean,
          tenant_id: genId,
        }))
        filled.add('phone')
        filled.add('tenant_id')
        setAutoFilledFields(filled)
      }

      setIsMobileVerified(true)
      setCurrentStep(1)
    } catch (err: any) {
      setOtpError(err.message || 'OTP verification failed.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResetVerification = () => {
    setIsMobileVerified(false)
    setOtpSent(false)
    setVerifyOtp('')
    setDevOtp('')
    setOtpError('')
    setExistingTenant(null)
    setAutoFilledFields(new Set())
  }

  const nextStep = () => {
    setError('')
    if (currentStep === 1) {
      if (!form.full_name.trim() || !form.phone.trim()) {
        setError('Full Name and Phone Number are required.')
        return
      }
    } else if (currentStep === 4) {
      if (!form.bed_id) {
        setError('Please select an available bed.')
        return
      }
    }
    setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setError('')
    setCurrentStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/residents/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monthly_rent_paise: rupeesToPaise(form.monthly_rent_rupees),
          deposit_amount_paise: rupeesToPaise(form.deposit_amount_rupees),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check in resident')
      }

      setSuccessData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper to render "Auto-filled" vs "Missing / Please Fill" badges
  const renderFieldBadge = (fieldKey: string, isRequired = false) => {
    const isFilled = autoFilledFields.has(fieldKey) && Boolean((form as any)[fieldKey])
    if (isFilled) {
      return (
        <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
          <Check className="h-3 w-3 text-emerald-700" />
          <span>Auto-filled</span>
        </span>
      )
    }
    if (isRequired && !Boolean((form as any)[fieldKey])) {
      return (
        <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
          <span>Required — Please fill</span>
        </span>
      )
    }
    if (!Boolean((form as any)[fieldKey])) {
      return (
        <span className="ml-2 inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
          <span>Optional</span>
        </span>
      )
    }
    return null
  }

  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Resident Checked In Successfully!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Permanent Universal Unique Tenant ID registered:
            </p>
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl inline-block">
              <span className="font-mono text-lg font-extrabold text-[#14532D]">
                {successData.registration_number}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/residents/${successData.resident_id}`}
              className="px-4 py-2 bg-[#14532D] hover:bg-[#166534] text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              View Resident Profile →
            </Link>
            <Link
              href="/dashboard/residents"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
            >
              Back to Residents List
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/residents"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel & Return
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Check In Resident</h1>
          <p className="text-xs text-gray-500 font-medium">
            {!isMobileVerified
              ? 'Step 0: Mobile Number & OTP Identity Verification'
              : `Step ${currentStep} of 5 — Review details & assign room`}
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* GATEKEEPER: RESIDENT MOBILE & OTP VERIFICATION */}
      {/* ────────────────────────────────────────────────────────── */}
      {!isMobileVerified && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-md ring-4 ring-[#DCFCE7]">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Mandatory Identity Check
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Verify Resident Mobile Number with OTP
              </h2>
              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                Enter the resident&apos;s 10-digit mobile number. Once verified via OTP, if their profile already exists
                in our database, <strong>all personal details, KYC, and address will be auto-filled automatically</strong>.
                You will only need to fill what is missing (such as room and bed assignment).
              </p>
            </div>
          </div>

          {otpError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {/* Development OTP helper box */}
          {devOtp && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono font-bold">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Simulated Resident OTP:</span>
                <span className="bg-amber-200 px-2 py-0.5 rounded text-amber-950 tracking-widest">{devOtp}</span>
              </div>
              <button
                type="button"
                onClick={() => setVerifyOtp(devOtp)}
                className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
              >
                Auto-fill Code
              </button>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Resident Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center rounded-xl border border-gray-300 bg-white shadow-xs focus-within:border-[#16A34A] focus-within:ring-2 focus-within:ring-[#16A34A]/20">
                  <span className="pl-3.5 pr-2 text-xs font-bold text-gray-500 select-none">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={verifyMobile}
                    onChange={(e) => setVerifyMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit mobile"
                    className="w-full py-3 pr-3 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  A 6-digit verification code will be sent to the resident to authenticate their check-in.
                </p>
              </div>

              <button
                type="submit"
                disabled={sendingOtp || cleanPhoneDigits(verifyMobile).length < 10}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-2xl bg-[#F7FAF7] p-4 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500 block">OTP sent to resident mobile:</span>
                  <span className="font-mono font-bold text-sm text-gray-900">+91 {cleanPhoneDigits(verifyMobile)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false)
                    setVerifyOtp('')
                  }}
                  className="text-xs font-bold text-[#14532D] underline hover:text-[#166534]"
                >
                  Change Mobile
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Enter 6-Digit Verification OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code or 123456"
                  className="w-full py-2.5 px-3.5 text-center font-mono tracking-widest text-lg font-bold rounded-xl border border-gray-300 outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Resend OTP
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || verifyOtp.trim().length < 6}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying &amp; Searching Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify OTP &amp; Auto-Fill Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* VERIFIED CHECK-IN FORM (STEPS 1 - 5) */}
      {/* ────────────────────────────────────────────────────────── */}
      {isMobileVerified && (
        <div className="space-y-4 sm:space-y-6">
          {/* Verification Status Banner */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Check className="h-5 w-5 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-emerald-950">
                      +91 {form.phone} • Mobile Verified via OTP
                    </span>
                    <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                      Identity Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {existingTenant ? (
                      <>
                        Found in PG-Setu Database:{' '}
                        <strong>{existingTenant.full_name || 'Registered Resident'}</strong> (Universal ID:{' '}
                        <span className="font-mono font-bold">{form.tenant_id}</span>). Details pre-filled automatically!
                      </>
                    ) : (
                      <>
                        New resident profile. Assigned Universal Unique ID:{' '}
                        <span className="font-mono font-bold">{form.tenant_id}</span>. Please fill in details below.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {existingTenant && currentStep < 4 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-3 py-1.5 bg-[#14532D] text-white rounded-xl text-xs font-bold hover:bg-[#166534] transition shadow-xs"
                  >
                    Jump to Room Allotment →
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetVerification}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 underline"
                >
                  Verify Different Number
                </button>
              </div>
            </div>
          </div>

          {/* Step Indicators */}
          {/* 1. Mobile Step Bar */}
          <div className="block sm:hidden bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#14532D] uppercase text-[11px]">Step {currentStep} of 5</span>
              <span className="font-bold text-gray-800">
                {[
                  'Personal Details',
                  'Address & Emergency',
                  'KYC & Notes',
                  'Room & Rent',
                  'Deposit & Confirm'
                ][currentStep - 1]}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#14532D] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* 2. Desktop Step Strip */}
          <div className="hidden sm:grid grid-cols-5 gap-2">
            {[
              'Personal Details',
              'Address & Emergency',
              'KYC & Notes',
              'Room & Rent',
              'Deposit & Confirm'
            ].map((title, idx) => {
              const stepNum = idx + 1
              const isActive = currentStep === stepNum
              const isDone = currentStep > stepNum
              return (
                <div
                  key={title}
                  onClick={() => setCurrentStep(stepNum)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 border-[#14532D] text-[#14532D] font-bold shadow-2xs'
                      : isDone
                      ? 'bg-gray-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider">Step {stepNum}</p>
                  <p className="text-xs truncate mt-0.5">{title}</p>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Step Form Card */}
          <div className="bg-white rounded-xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">1. Personal Information</h3>
                  <span className="text-xs text-gray-500 font-medium">
                    Review pre-filled fields &amp; fill missing details
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Full Name * {renderFieldBadge('full_name', true)}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Mobile Number * (Verified) {renderFieldBadge('phone', true)}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        disabled
                        value={form.phone}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-700 outline-none cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Email Address {renderFieldBadge('email')}
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Alternate Phone {renderFieldBadge('alternate_phone')}
                    </label>
                    <input
                      type="tel"
                      placeholder="Optional secondary phone"
                      value={form.alternate_phone}
                      onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Date of Birth {renderFieldBadge('date_of_birth')}
                    </label>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Gender {renderFieldBadge('gender')}
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-semibold"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {existingTenant?.stays && existingTenant.stays.length > 0 && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-gray-800 block">Previous Verified PG Stays:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {existingTenant.stays.map((s: any, i: number) => (
                        <span key={i} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
                          {s.organization_name} ({s.status})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Address & Emergency */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">2. Permanent Address &amp; Emergency Contact</h3>
                  <span className="text-xs text-gray-500 font-medium">Fill in missing address details</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Permanent Home Address {renderFieldBadge('permanent_address')}
                    </label>
                    <textarea
                      rows={2}
                      placeholder="House / Street / Locality"
                      value={form.permanent_address}
                      onChange={(e) => setForm({ ...form, permanent_address: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        City {renderFieldBadge('permanent_city')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Jaipur"
                        value={form.permanent_city}
                        onChange={(e) => setForm({ ...form, permanent_city: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        State {renderFieldBadge('permanent_state')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rajasthan"
                        value={form.permanent_state}
                        onChange={(e) => setForm({ ...form, permanent_state: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Pincode {renderFieldBadge('permanent_pincode')}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 302001"
                        value={form.permanent_pincode}
                        onChange={(e) => setForm({ ...form, permanent_pincode: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      Emergency Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Contact Name {renderFieldBadge('emergency_name')}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Suresh Sharma"
                          value={form.emergency_name}
                          onChange={(e) => setForm({ ...form, emergency_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Emergency Phone {renderFieldBadge('emergency_phone')}
                        </label>
                        <input
                          type="tel"
                          placeholder="Parent/Guardian Phone"
                          value={form.emergency_phone}
                          onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Relationship {renderFieldBadge('emergency_relation')}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Father"
                          value={form.emergency_relation}
                          onChange={(e) => setForm({ ...form, emergency_relation: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Identity Proof Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">3. Identity Proof Document &amp; Notes</h3>
                  <span className="text-xs text-gray-500 font-medium">Government identity details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ID Proof Type {renderFieldBadge('id_type')}
                    </label>
                    <select
                      value={form.id_type}
                      onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-semibold"
                    >
                      <option value="aadhaar">Aadhaar Card (e-KYC)</option>
                      <option value="pan">PAN Card</option>
                      <option value="passport">Passport</option>
                      <option value="driving_licence">Driving License</option>
                      <option value="student_id">College / Student ID</option>
                      <option value="company_id">Company / Employee ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ID Document Number {renderFieldBadge('id_number')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. XXXX XXXX 4821"
                      value={form.id_number}
                      onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FirebaseFileUploader
                      label="Upload KYC Identity Document / Agreement (Optional)"
                      storagePath={`kyc/${form.property_id || 'general'}/${form.phone || 'resident'}`}
                      currentUrl={form.kyc_doc_url}
                      onUploadSuccess={(url) => setForm((prev) => ({ ...prev, kyc_doc_url: url }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Internal Owner / Manager Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any special remarks, college/company name, food preferences..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Room & Rent Assignment */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">4. Room &amp; Bed Assignment</h3>
                  <span className="text-xs text-gray-500 font-medium">Select room and assign bed</span>
                </div>
                
                {dataLoading ? (
                  <div className="p-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-[#14532D] animate-spin mx-auto" />
                    <p className="text-xs text-gray-500 font-semibold">Loading available rooms &amp; beds for your property...</p>
                  </div>
                ) : availableBuildings.length === 0 && availableRooms.length === 0 ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                    <Building2 className="w-8 h-8 text-[#14532D] mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-gray-900">No Rooms Configured Yet</h4>
                      <p className="text-xs text-gray-600 max-w-sm mx-auto">
                        Before adding residents, you need to add at least one room and bed in your property.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/rooms/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#14532D] hover:bg-[#166534] text-white text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      + Create First Room &amp; Beds →
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Building</label>
                        <select
                          value={form.building_id}
                          onChange={(e) => handleBuildingChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-semibold"
                        >
                          {availableBuildings.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Floor</label>
                        <select
                          value={form.floor_id}
                          onChange={(e) => handleFloorChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-semibold"
                        >
                          {availableFloors.map((fl) => (
                            <option key={fl.id} value={fl.id}>{fl.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Room</label>
                        <select
                          value={form.room_id}
                          onChange={(e) => handleRoomChange(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-semibold"
                        >
                          {availableRooms.map((rm) => (
                            <option key={rm.id} value={rm.id}>Room {rm.room_number}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bed Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700">Select Available Bed *</label>
                        <Link
                          href="/dashboard/rooms/new"
                          className="text-[11px] font-bold text-[#14532D] hover:underline"
                        >
                          + Add Another Room
                        </Link>
                      </div>

                      {availableBeds.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                          {availableBeds.map((b) => (
                            <button
                              type="button"
                              key={b.id}
                              onClick={() => setForm({ ...form, bed_id: b.id })}
                              className={`p-3 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                                form.bed_id === b.id
                                  ? 'bg-[#14532D] text-white border-[#14532D] shadow-xs'
                                  : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                              }`}
                            >
                              <BedDouble className="w-5 h-5 mx-auto mb-1" />
                              <span className="font-bold text-xs">Bed {b.bed_label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-amber-800 font-bold">
                              No beds currently available in this room.
                            </p>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                              All beds in this room are occupied. Please select another room or create a new room.
                            </p>
                          </div>
                          <Link
                            href="/dashboard/rooms/new"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition shrink-0"
                          >
                            + Create Room &amp; Beds →
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Rent & Checkin Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Bed Rent (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      value={form.monthly_rent_rupees}
                      onChange={(e) => setForm({ ...form, monthly_rent_rupees: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Check-in Date *</label>
                    <input
                      type="date"
                      value={form.check_in_date}
                      onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Cycle Day</label>
                    <select
                      value={form.billing_cycle_day}
                      onChange={(e) => setForm({ ...form, billing_cycle_day: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-semibold"
                    >
                      <option value={1}>1st of Month</option>
                      <option value={5}>5th of Month</option>
                      <option value={10}>10th of Month</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Deposit & Confirm */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">5. Security Deposit &amp; Final Confirmation</h3>
                  <span className="text-xs text-gray-500 font-medium">Verify summary before completing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Security Deposit Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.deposit_amount_rupees}
                      onChange={(e) => setForm({ ...form, deposit_amount_rupees: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none font-bold text-emerald-800"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">Tracked in escrow trust separately from rent.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Payment Method</label>
                    <select
                      value={form.deposit_payment_method}
                      onChange={(e) => setForm({ ...form, deposit_payment_method: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#16A34A] outline-none uppercase font-bold"
                    >
                      <option value="upi">UPI</option>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                </div>

                {/* Review Summary */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2 text-xs">
                  <h4 className="font-bold text-gray-900 mb-2">Check-in Summary Overview:</h4>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-gray-500">Universal Unique Tenant ID:</span>
                    <span className="font-mono font-black text-[#14532D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {form.tenant_id || suggestedTenantId || 'Auto-generated'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Resident Name &amp; Phone:</span>
                    <span className="font-bold text-gray-900">{form.full_name} (+91 {form.phone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-in Date:</span>
                    <span className="font-semibold text-gray-900">{form.check_in_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Rent:</span>
                    <span className="font-bold text-[#14532D]">₹{form.monthly_rent_rupees.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Security Deposit:</span>
                    <span className="font-bold text-emerald-800">₹{form.deposit_amount_rupees.toLocaleString('en-IN')} ({form.deposit_payment_method.toUpperCase()})</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 rounded-xl text-xs font-bold transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              ) : <div />}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#14532D] hover:bg-[#166534] active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#14532D] hover:bg-[#166534] active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {loading ? 'Checking in...' : 'Confirm & Complete Check-In'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
