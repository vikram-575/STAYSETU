'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resident, setResident] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Inventory State
  const [inventory, setInventory] = useState<{ buildings: any[]; floors: any[]; rooms: any[]; beds: any[] }>({
    buildings: [],
    floors: [],
    rooms: [],
    beds: [],
  })

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
    async function loadData() {
      try {
        const [resRes, invRes] = await Promise.all([
          fetch(`/api/residents/${residentId}`),
          fetch('/api/residents/checkin'),
        ])

        if (resRes.ok) {
          const resData = await resRes.json()
          if (resData.resident) {
            setResident(resData.resident)
            setNewRentRupees(resData.resident.monthly_rent_paise ? resData.resident.monthly_rent_paise / 100 : 6000)
          }
        }

        if (invRes.ok) {
          const invData = await invRes.json()
          const bldgs = invData.buildings || []
          const fls = invData.floors || []
          const rms = invData.rooms || []
          const bds = invData.beds || []

          setInventory({ buildings: bldgs, floors: fls, rooms: rms, beds: bds })

          if (bldgs.length > 0) {
            const firstBldg = bldgs[0]
            setSelectedBuilding(firstBldg.id)

            const bldgFloors = fls.filter((f: any) => f.building_id === firstBldg.id)
            const firstFloor = bldgFloors[0] || null
            setSelectedFloor(firstFloor?.id || '')

            const floorRooms = firstFloor ? rms.filter((r: any) => r.floor_id === firstFloor.id) : []
            const firstRoom = floorRooms[0] || null
            setSelectedRoom(firstRoom?.id || '')

            const roomBeds = firstRoom ? bds.filter((b: any) => b.room_id === firstRoom.id && b.status === 'available') : []
            const firstBed = roomBeds[0] || null
            setSelectedBed(firstBed?.id || '')

            if (firstBed?.base_rent_paise) {
              setNewRentRupees(firstBed.base_rent_paise / 100)
            }
          }
        }
      } catch (err: any) {
        console.error('Error loading transfer data:', err)
        setError('Failed to load resident or room inventory.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [residentId])

  const handleBuildingChange = (bldgId: string) => {
    setSelectedBuilding(bldgId)
    const bldgFloors = inventory.floors.filter((f) => f.building_id === bldgId)
    const firstFloor = bldgFloors[0] || null
    setSelectedFloor(firstFloor?.id || '')

    const floorRooms = firstFloor ? inventory.rooms.filter((r) => r.floor_id === firstFloor.id) : []
    const firstRoom = floorRooms[0] || null
    setSelectedRoom(firstRoom?.id || '')

    const roomBeds = firstRoom ? inventory.beds.filter((b) => b.room_id === firstRoom.id && b.status === 'available') : []
    const firstBed = roomBeds[0] || null
    setSelectedBed(firstBed?.id || '')
    if (firstBed?.base_rent_paise) setNewRentRupees(firstBed.base_rent_paise / 100)
  }

  const handleFloorChange = (floorId: string) => {
    setSelectedFloor(floorId)
    const floorRooms = inventory.rooms.filter((r) => r.floor_id === floorId)
    const firstRoom = floorRooms[0] || null
    setSelectedRoom(firstRoom?.id || '')

    const roomBeds = firstRoom ? inventory.beds.filter((b) => b.room_id === firstRoom.id && b.status === 'available') : []
    const firstBed = roomBeds[0] || null
    setSelectedBed(firstBed?.id || '')
    if (firstBed?.base_rent_paise) setNewRentRupees(firstBed.base_rent_paise / 100)
  }

  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId)
    const roomBeds = inventory.beds.filter((b) => b.room_id === roomId && b.status === 'available')
    const firstBed = roomBeds[0] || null
    setSelectedBed(firstBed?.id || '')
    if (firstBed?.base_rent_paise) setNewRentRupees(firstBed.base_rent_paise / 100)
  }

  const handleBedSelect = (bedId: string) => {
    setSelectedBed(bedId)
    const bd = inventory.beds.find((b) => b.id === bedId)
    if (bd?.base_rent_paise) setNewRentRupees(bd.base_rent_paise / 100)
  }

  const availableBuildings = inventory.buildings
  const availableFloors = inventory.floors.filter((fl) => !selectedBuilding || fl.building_id === selectedBuilding)
  const availableRooms = inventory.rooms.filter((rm) => !selectedFloor || rm.floor_id === selectedFloor)
  const availableBeds = inventory.beds.filter((bd) => (!selectedRoom || bd.room_id === selectedRoom) && bd.status === 'available')

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
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <Link
          href={`/dashboard/residents/${residentId}`}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return to Profile
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Room / Bed Transfer</h1>
        <p className="text-xs text-gray-500 font-medium">
          Move resident to a new room or bed without erasing historical occupancy or financial records.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Current Assignment Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-600">Current Assignment</span>
          <p className="font-black text-gray-900 text-sm mt-0.5">{resident.full_name} ({resident.registration_number})</p>
          <p className="text-gray-600 font-medium mt-0.5">
            {resident.building_name} · Room {resident.room_number} · Bed {resident.bed_label}
          </p>
        </div>
        <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-100">
          <span className="text-[10px] uppercase font-bold text-gray-500">Current Rent</span>
          <p className="font-black text-gray-900 text-sm mt-0.5">
            {resident.monthly_rent_paise ? formatCurrency(resident.monthly_rent_paise) : '—'}
          </p>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Select New Room & Bed</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Building</label>
            <select
              value={selectedBuilding}
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
              value={selectedFloor}
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
              value={selectedRoom}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
            >
              {availableRooms.map((rm) => (
                <option key={rm.id} value={rm.id}>Room {rm.room_number}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Beds */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">Select New Available Bed *</label>
          {availableBeds.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {availableBeds.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => handleBedSelect(b.id)}
                  className={`p-3 rounded-2xl border text-center transition active:scale-95 ${
                    selectedBed === b.id
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
            <p className="text-xs text-red-500 p-3 bg-red-50 border border-red-200 rounded-xl">
              No beds available in this room. Please select another room.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Effective Transfer Date *</label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
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
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Transfer</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
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
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={handleTransfer}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            {submitting ? 'Transferring...' : 'Execute Bed Transfer'}
          </button>
        </div>
      </div>
    </div>
  )
}
