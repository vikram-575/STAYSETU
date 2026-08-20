'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRightLeft, ArrowLeft, BedDouble, CheckCircle2,
  Building2, Loader2, AlertCircle
} from 'lucide-react'
import { formatCurrency, rupeesToPaise } from '@/lib/money'

interface Props {
  params: Promise<{ id: string }>
}

export default function TransferResidentPage({ params }: Props) {
  const { id: residentId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resident, setResident] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Cascading location states
  const [buildings, setBuildings] = useState<any[]>([])
  const [floors, setFloors] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [beds, setBeds] = useState<any[]>([])

  // Form State
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedBed, setSelectedBed] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])
  const [newRentRupees, setNewRentRupees] = useState(6000)
  const [reason, setReason] = useState('resident_request')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadResident() {
      const { data } = await supabase
        .from('v_resident_current')
        .select('*')
        .eq('resident_id', residentId)
        .single()

      if (data) {
        setResident(data)
        setNewRentRupees(data.monthly_rent_paise ? data.monthly_rent_paise / 100 : 6000)
      }

      // Load buildings
      const { data: bldgs } = await supabase.from('buildings').select('*').eq('is_active', true)
      if (bldgs && bldgs.length > 0) {
        setBuildings(bldgs)
        setSelectedBuilding(bldgs[0].id)
      }
      setLoading(false)
    }
    loadResident()
  }, [residentId, supabase])

  // Load floors when building changes
  useEffect(() => {
    if (!selectedBuilding) return
    async function loadFloors() {
      const { data } = await supabase.from('floors').select('*').eq('building_id', selectedBuilding).order('floor_number')
      setFloors(data || [])
      if (data && data.length > 0) setSelectedFloor(data[0].id)
      else setSelectedFloor('')
    }
    loadFloors()
  }, [selectedBuilding, supabase])

  // Load rooms when floor changes
  useEffect(() => {
    if (!selectedFloor) return
    async function loadRooms() {
      const { data } = await supabase.from('rooms').select('*').eq('floor_id', selectedFloor).eq('is_active', true)
      setRooms(data || [])
      if (data && data.length > 0) setSelectedRoom(data[0].id)
      else setSelectedRoom('')
    }
    loadRooms()
  }, [selectedFloor, supabase])

  // Load beds when room changes
  useEffect(() => {
    if (!selectedRoom) return
    async function loadBeds() {
      const { data } = await supabase.from('beds').select('*').eq('room_id', selectedRoom).eq('status', 'available')
      setBeds(data || [])
      if (data && data.length > 0) {
        setSelectedBed(data[0].id)
        if (data[0].base_rent_paise) setNewRentRupees(data[0].base_rent_paise / 100)
      } else {
        setSelectedBed('')
      }
    }
    loadBeds()
  }, [selectedRoom, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading details...
      </div>
    )
  }

  if (!resident) return <div className="p-8 text-center text-red-500">Resident not found.</div>

  const handleTransfer = async () => {
    if (!selectedBed) {
      setError('Please select an available bed.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/residents/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resident_id: residentId,
          new_bed_id: selectedBed,
          transfer_date: transferDate,
          new_rent_paise: rupeesToPaise(newRentRupees),
          reason,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete transfer')

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bed Transfer Completed!</h2>
            <p className="text-xs text-gray-500 mt-1">
              Previous room assignment archived. New bed marked occupied. Full history preserved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/residents/${residentId}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
            >
              View Updated Profile →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/residents/${residentId}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return to Profile
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Room / Bed Transfer</h1>
        <p className="text-xs text-gray-500">
          Move resident to a new room or bed without erasing historical occupancy or financial records.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Current Assignment Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-600">Current Assignment</span>
          <p className="font-bold text-gray-900 text-sm mt-0.5">{resident.full_name} ({resident.registration_number})</p>
          <p className="text-gray-600">
            {resident.building_name} · Room {resident.room_number} · Bed {resident.bed_label}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-gray-500">Current Rent</span>
          <p className="font-bold text-gray-900 text-sm mt-0.5">
            {resident.monthly_rent_paise ? formatCurrency(resident.monthly_rent_paise) : '—'}
          </p>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Select New Room & Bed</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Building</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>{fl.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Room</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {rooms.map((rm) => (
                <option key={rm.id} value={rm.id}>Room {rm.room_number}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Beds */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Select New Available Bed *</label>
          {beds.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {beds.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => setSelectedBed(b.id)}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedBed === b.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <BedDouble className="w-5 h-5 mx-auto mb-1" />
                  <span className="font-bold text-xs">Bed {b.bed_label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-red-500 p-3 bg-red-50 rounded-lg">
              No beds available in this room. Please select another room.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Effective Transfer Date *</label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">New Monthly Rent (₹) *</label>
            <input
              type="number"
              min={0}
              required
              value={newRentRupees}
              onChange={(e) => setNewRentRupees(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Transfer</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="resident_request">Resident Request</option>
              <option value="room_upgrade">Room Upgrade</option>
              <option value="room_downgrade">Room Downgrade</option>
              <option value="maintenance">Room Maintenance</option>
              <option value="management_decision">Management Decision</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Transfer Notes</label>
            <input
              type="text"
              placeholder="e.g. Switched to single room on 2nd floor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t flex justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={handleTransfer}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            {submitting ? 'Transferring...' : 'Execute Bed Transfer'}
          </button>
        </div>
      </div>
    </div>
  )
}
