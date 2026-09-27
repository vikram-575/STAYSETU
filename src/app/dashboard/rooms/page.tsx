import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn } from '@/lib/utils'
import {
  BedDouble, Plus, Building2, Layers, CheckCircle2,
  AlertCircle, Wrench, ShieldAlert, ArrowRight, User
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    building?: string
    floor?: string
    status?: string
  }>
}

import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'

export default async function RoomsPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedBuilding = params.building || ''
  const selectedFloor = params.floor || ''
  const selectedStatus = params.status || 'all'

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const orgId = await resolveEffectiveOrgId(user)

  let buildings: any[] = []
  let rooms: any[] = []

  if (orgId && isValidUUID(orgId)) {
    try {
      const [{ data: bData }, { data: rData }] = await Promise.all([
        supabase.from('buildings').select('*, floors(*)').eq('organization_id', orgId).order('name'),
        (selectedFloor
          ? supabase.from('rooms').select('*, floors(*, buildings(*)), beds(*, resident_assignments(*, residents(*)))').eq('organization_id', orgId).eq('floor_id', selectedFloor).order('room_number')
          : supabase.from('rooms').select('*, floors(*, buildings(*)), beds(*, resident_assignments(*, residents(*)))').eq('organization_id', orgId).order('room_number')
        ),
      ])
      buildings = bData ?? []
      rooms = rData ?? []
    } catch (err) {
      console.error('Failed fetching rooms:', err)
    }
  }

  // Total summary calculation
  let totalRooms = rooms?.length || 0
  let totalBeds = 0
  let occupiedBeds = 0
  let availableBeds = 0
  let maintenanceBeds = 0

  rooms?.forEach((rm) => {
    rm.beds?.forEach((b: any) => {
      totalBeds++
      if (b.status === 'occupied') occupiedBeds++
      else if (b.status === 'available') availableBeds++
      else if (b.status === 'maintenance') maintenanceBeds++
    })
  })

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Rooms & Beds Matrix</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Visual room map · Real-time occupancy · Bed assignments
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/rooms/new"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Room & Beds
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <Link
          href="/dashboard/rooms"
          className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs hover:border-gray-400 hover:shadow-xs transition block group active:scale-[0.99]"
          title="All configured rooms"
        >
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate group-hover:text-gray-900 transition-colors">Total Rooms</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">{totalRooms}</p>
          <p className="text-[10px] text-gray-400">Configured spaces</p>
        </Link>
        <Link
          href="/dashboard/rooms"
          className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition block group active:scale-[0.99]"
          title="Total bed capacity"
        >
          <p className="text-[10px] uppercase font-bold text-blue-600 truncate group-hover:text-blue-700 transition-colors">Total Beds</p>
          <p className="text-lg sm:text-xl font-black text-blue-700 mt-0.5">{totalBeds}</p>
          <p className="text-[10px] text-blue-400">Total capacity</p>
        </Link>
        <Link
          href="/dashboard/residents"
          className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs hover:border-green-300 hover:shadow-xs transition block group active:scale-[0.99]"
          title="View all occupied residents in CRM"
        >
          <p className="text-[10px] uppercase font-bold text-green-600 truncate group-hover:text-green-700 transition-colors">Occupied Beds</p>
          <p className="text-lg sm:text-xl font-black text-green-700 mt-0.5">{occupiedBeds}</p>
          <p className="text-[10px] text-green-500 font-bold">{occupancyRate}% Occupancy</p>
        </Link>
        <Link
          href="/dashboard/residents/new"
          className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs hover:border-teal-300 hover:shadow-xs transition block group active:scale-[0.99]"
          title="Ready for check-in — Click to assign"
        >
          <p className="text-[10px] uppercase font-bold text-teal-600 truncate group-hover:text-teal-700 transition-colors">Available Vacant</p>
          <p className="text-lg sm:text-xl font-black text-teal-700 mt-0.5">{availableBeds}</p>
          <p className="text-[10px] text-teal-500 font-medium">Ready for check-in</p>
        </Link>
        <Link
          href="/dashboard/rooms"
          className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs col-span-2 sm:col-span-1 hover:border-orange-300 hover:shadow-xs transition block group active:scale-[0.99]"
          title="Beds temporarily blocked"
        >
          <p className="text-[10px] uppercase font-bold text-orange-600 truncate group-hover:text-orange-700 transition-colors">Maintenance</p>
          <p className="text-lg sm:text-xl font-black text-orange-700 mt-0.5">{maintenanceBeds}</p>
          <p className="text-[10px] text-orange-500">Temporarily blocked</p>
        </Link>
      </div>

      {/* Visual Status Legend */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl sm:rounded-2xl border border-gray-200 text-xs text-gray-600 shadow-2xs">
        <span className="font-bold text-gray-900 text-xs">Status:</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-200 border border-blue-400 inline-block" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
          <span>Maintenance</span>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {rooms && rooms.length > 0 ? (
          rooms.map((room) => {
            const bedsList = room.beds || []
            const occupiedCount = bedsList.filter((b: any) => b.status === 'occupied').length
            const isFull = occupiedCount === bedsList.length && bedsList.length > 0

            return (
              <div
                key={room.id}
                className={cn(
                  'bg-white rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-md flex flex-col justify-between shadow-2xs group/card',
                  isFull ? 'border-gray-200 hover:border-gray-300' : 'border-blue-200 hover:border-blue-400 shadow-sm shadow-blue-50/50'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/rooms/${room.id}`}
                      className="group/title block flex-1 min-w-0"
                      title={`View details & meter for Room ${room.room_number}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-base text-gray-900 group-hover/title:text-blue-600 transition-colors">
                          Room {room.room_number}
                        </h3>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover/title:text-blue-600 group-hover/title:translate-x-0.5 transition-all opacity-0 group-hover/title:opacity-100" />
                      </div>
                      <p className="text-xs text-gray-500 truncate group-hover/title:text-gray-700">
                        {room.floors?.buildings?.name} · {room.floors?.name}
                      </p>
                    </Link>

                    <Link
                      href={`/dashboard/rooms/${room.id}`}
                      title={isFull ? 'Room is full' : `${bedsList.length - occupiedCount} beds available — click to manage`}
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer',
                        isFull
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                      )}
                    >
                      {isFull ? 'Full' : `${bedsList.length - occupiedCount} Vacant`}
                    </Link>
                  </div>

                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="inline-block text-xs font-bold text-blue-600 hover:text-blue-700 mt-1.5 transition-colors"
                    title="Click to view room details & rent breakdown"
                  >
                    Rent: {room.base_rent_paise ? formatCurrency(room.base_rent_paise) : '—'} / bed
                  </Link>

                  {/* Beds Display */}
                  <div className="mt-3.5 space-y-1.5 border-t border-gray-100 pt-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Beds ({occupiedCount}/{bedsList.length})
                      </p>
                      <span className="text-[9px] text-gray-400 font-medium">Click bed to view / assign</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {bedsList.map((bed: any) => {
                        const activeAssign = bed.resident_assignments?.find((a: any) => !a.check_out_date)
                        const residentName = activeAssign?.residents?.full_name
                        const residentId = activeAssign?.residents?.id || activeAssign?.resident_id

                        if (bed.status === 'occupied') {
                          const targetUrl = residentId ? `/dashboard/residents/${residentId}` : `/dashboard/rooms/${room.id}`
                          return (
                            <Link
                              key={bed.id}
                              href={targetUrl}
                              title={residentName ? `Occupied by ${residentName} — Click to view resident profile` : 'Occupied bed — Click to view'}
                              className="p-2 rounded-xl border text-xs flex flex-col justify-between transition-all bg-green-50/70 border-green-200 text-green-900 hover:bg-green-100 hover:border-green-400 hover:shadow-xs cursor-pointer active:scale-[0.98] group/bed"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[11px] group-hover/bed:text-green-800">Bed {bed.bed_label}</span>
                                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 ring-2 ring-green-200" />
                              </div>
                              <div className="flex items-center gap-1 mt-1 min-w-0">
                                <User className="w-2.5 h-2.5 text-green-700 shrink-0" />
                                <p className="text-[10px] font-bold truncate text-green-950 group-hover/bed:underline">
                                  {residentName || 'Occupied'}
                                </p>
                              </div>
                            </Link>
                          )
                        }

                        if (bed.status === 'available') {
                          return (
                            <Link
                              key={bed.id}
                              href={`/dashboard/residents/new?room_id=${room.id}&bed_id=${bed.id}`}
                              title={`Bed ${bed.bed_label} is vacant — Click to check in resident`}
                              className="p-2 rounded-xl border text-xs flex flex-col justify-between transition-all bg-blue-50/50 border-blue-200 text-blue-900 border-dashed hover:bg-blue-100/90 hover:border-blue-400 hover:shadow-xs cursor-pointer active:scale-[0.98] group/bed"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[11px] group-hover/bed:text-blue-800">Bed {bed.bed_label}</span>
                                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 ring-2 ring-blue-100" />
                              </div>
                              <p className="text-[10px] font-bold truncate mt-1 text-blue-600 group-hover/bed:text-blue-800 flex items-center gap-0.5">
                                <Plus className="w-2.5 h-2.5" /> Vacant
                              </p>
                            </Link>
                          )
                        }

                        // Maintenance or other status
                        return (
                          <Link
                            key={bed.id}
                            href={`/dashboard/rooms/${room.id}`}
                            title={`Bed ${bed.bed_label} is under ${bed.status} — Click to manage`}
                            className="p-2 rounded-xl border text-xs flex flex-col justify-between transition-all bg-orange-50/60 border-orange-200 text-orange-900 hover:bg-orange-100 hover:border-orange-300 cursor-pointer active:scale-[0.98]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[11px]">Bed {bed.bed_label}</span>
                              <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 ring-2 ring-orange-200" />
                            </div>
                            <p className="text-[10px] font-semibold truncate mt-1 text-orange-800 capitalize">
                              {bed.status}
                            </p>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 group/manage"
                  >
                    <span>Manage Room</span>
                    <ArrowRight className="w-3 h-3 group-hover/manage:translate-x-0.5 transition-transform" />
                  </Link>
                  {!isFull && (
                    <Link
                      href={`/dashboard/residents/new?room_id=${room.id}`}
                      className="text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg transition active:scale-95 flex items-center gap-1"
                      title="Assign a new resident to this room"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign</span>
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
            <BedDouble className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-sm">No rooms configured yet.</p>
            <Link
              href="/dashboard/rooms/new"
              className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl active:scale-95"
            >
              + Create First Room
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
