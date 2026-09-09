'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  UserPlus, ArrowLeft, ArrowRight, CheckCircle2,
  Building2, BedDouble, Shield, FileText, Loader2, DollarSign
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'
import { FirebaseFileUploader } from '@/components/ui/firebase-file-uploader'

export default function CheckInResidentPage() {
  const router = useRouter()

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

  // Form State
  const [form, setForm] = useState({
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

  const nextStep = () => {
    setError('')
    if (currentStep === 1) {
      if (!form.full_name || !form.phone) {
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

  if (successData) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Resident Checked In Successfully!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Permanent registration number generated:
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl inline-block">
              <span className="font-mono text-lg font-extrabold text-blue-700">
                {successData.registration_number}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/residents/${successData.resident_id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
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
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Check In New Resident</h1>
          <p className="text-xs text-gray-500 font-medium">Step {currentStep} of 5</p>
        </div>
      </div>

      {/* Responsive Steps Indicator */}
      {/* 1. Mobile Step Bar */}
      <div className="block sm:hidden bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-blue-600 uppercase text-[11px]">Step {currentStep} of 5</span>
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
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
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
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isActive
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                  : isDone
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider">Step {stepNum}</p>
              <p className="text-xs font-semibold truncate mt-0.5">{title}</p>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Step Form Box */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b border-gray-100 pb-2">1. Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alternate Phone</label>
                <input
                  type="tel"
                  placeholder="Optional secondary phone"
                  value={form.alternate_phone}
                  onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address & Emergency */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b border-gray-100 pb-2">2. Permanent Address & Emergency Contact</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Permanent Home Address</label>
                <textarea
                  rows={2}
                  placeholder="House / Street / Locality"
                  value={form.permanent_address}
                  onChange={(e) => setForm({ ...form, permanent_address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Jaipur"
                    value={form.permanent_city}
                    onChange={(e) => setForm({ ...form, permanent_city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajasthan"
                    value={form.permanent_state}
                    onChange={(e) => setForm({ ...form, permanent_state: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">Emergency Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Sharma"
                      value={form.emergency_name}
                      onChange={(e) => setForm({ ...form, emergency_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Emergency Phone</label>
                    <input
                      type="tel"
                      placeholder="Parent/Guardian Phone"
                      value={form.emergency_phone}
                      onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      placeholder="e.g. Father"
                      value={form.emergency_relation}
                      onChange={(e) => setForm({ ...form, emergency_relation: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b border-gray-100 pb-2">3. Identity Proof Document</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ID Proof Type</label>
                <select
                  value={form.id_type}
                  onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">ID Document Number</label>
                <input
                  type="text"
                  placeholder="e.g. XXXX XXXX 4821"
                  value={form.id_number}
                  onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Internal Owner / Manager Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any special remarks, college/company name, food preferences..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Room & Rent Assignment */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b border-gray-100 pb-2">4. Room & Bed Assignment</h3>
            
            {dataLoading ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-gray-500 font-semibold">Loading available rooms & beds for your property...</p>
              </div>
            ) : availableBuildings.length === 0 && availableRooms.length === 0 ? (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-3">
                <Building2 className="w-8 h-8 text-blue-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-900">No Rooms Configured Yet</h4>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    Before adding residents, you need to add at least one room and bed in your property.
                  </p>
                </div>
                <Link
                  href="/dashboard/rooms/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  + Create First Room & Beds →
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
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
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
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
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
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
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
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
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
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
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
                        + Create Room & Beds →
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
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Check-in Date *</label>
                <input
                  type="date"
                  value={form.check_in_date}
                  onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Billing Cycle Day</label>
                <select
                  value={form.billing_cycle_day}
                  onChange={(e) => setForm({ ...form, billing_cycle_day: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
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
            <h3 className="text-sm sm:text-base font-bold text-gray-900 border-b border-gray-100 pb-2">5. Security Deposit & Final Confirmation</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Security Deposit Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.deposit_amount_rupees}
                  onChange={(e) => setForm({ ...form, deposit_amount_rupees: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-purple-700"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Tracked separately from normal revenue.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Payment Method</label>
                <select
                  value={form.deposit_payment_method}
                  onChange={(e) => setForm({ ...form, deposit_payment_method: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>

            {/* Review Summary */}
            <div className="p-3.5 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 mb-1">Check-in Summary:</h4>
              <div className="flex justify-between">
                <span className="text-gray-500">Resident:</span>
                <span className="font-bold text-gray-900">{form.full_name} ({form.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Check-in Date:</span>
                <span className="font-semibold text-gray-900">{form.check_in_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Rent:</span>
                <span className="font-bold text-blue-600">₹{form.monthly_rent_rupees.toLocaleString('en-IN')}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Security Deposit:</span>
                <span className="font-bold text-purple-700">₹{form.deposit_amount_rupees.toLocaleString('en-IN')}</span>
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
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 active:scale-95 disabled:bg-green-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Registering...' : 'Confirm & Complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
