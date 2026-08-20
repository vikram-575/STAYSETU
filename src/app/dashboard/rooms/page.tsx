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

export default async function RoomsPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedBuilding = params.building || ''
  const selectedFloor = params.floor || ''
  const selectedStatus = params.status || 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  const orgId = profile.organization_id

  // Buildings list
  const { data: buildings } = await supabase
    .from('buildings')
    .select('*, floors(*)')
    .eq('organization_id', orgId)
    .order('name')

  // Rooms with beds and active residents
  let roomsQuery = supabase
    .from('rooms')
    .select('*, floors(*, buildings(*)), beds(*, resident_assignments(*, residents(*)))')
    .eq('organization_id', orgId)
    .order('room_number')

  if (selectedFloor) {
    roomsQuery = roomsQuery.eq('floor_id', selectedFloor)
  }

  const { data: rooms } = await roomsQuery

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
    <div className="space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms & Beds Matrix</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visual room map · Real-time occupancy · Bed assignments
          </p>
        </div>
        <Link
          href="/dashboard/rooms/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Room & Beds
        </Link>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-gray-500">Total Rooms</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{totalRooms}</p>
          <p className="text-[10px] text-gray-400">Configured spaces</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-blue-600">Total Beds</p>
          <p className="text-xl font-bold text-blue-700 mt-0.5">{totalBeds}</p>
          <p className="text-[10px] text-blue-400">Total capacity</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-green-600">Occupied Beds</p>
          <p className="text-xl font-bold text-green-700 mt-0.5">{occupiedBeds}</p>
          <p className="text-[10px] text-green-500 font-semibold">{occupancyRate}% Occupancy</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-teal-600">Available Vacant</p>
          <p className="text-xl font-bold text-teal-700 mt-0.5">{availableBeds}</p>
          <p className="text-[10px] text-teal-500">Ready for check-in</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-orange-600">Maintenance</p>
          <p className="text-xl font-bold text-orange-700 mt-0.5">{maintenanceBeds}</p>
          <p className="text-[10px] text-orange-500">Temporarily blocked</p>
        </div>
      </div>

      {/* Visual Status Legend */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 text-xs text-gray-600">
        <span className="font-bold text-gray-900">Bed Status Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-400 inline-block" />
          <span>Available (Vacant)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
          <span>Blocked</span>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms && rooms.length > 0 ? (
          rooms.map((room) => {
            const bedsList = room.beds || []
            const occupiedCount = bedsList.filter((b: any) => b.status === 'occupied').length
            const isFull = occupiedCount === bedsList.length && bedsList.length > 0

            return (
              <div
                key={room.id}
                className={cn(
                  'bg-white rounded-2xl border p-5 transition-all hover:shadow-md flex flex-col justify-between',
                  isFull ? 'border-gray-200' : 'border-blue-200 shadow-sm shadow-blue-50'
                )}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900">Room {room.room_number}</h3>
                      <p className="text-xs text-gray-500">
                        {room.floors?.buildings?.name} · {room.floors?.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                        isFull
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      )}
                    >
                      {isFull ? 'Full' : `${bedsList.length - occupiedCount} Vacant`}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-blue-600 mt-2">
                    Rent: {room.base_rent_paise ? formatCurrency(room.base_rent_paise) : '—'} / bed
                  </p>

                  {/* Beds Display */}
                  <div className="mt-4 space-y-2 border-t pt-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Beds ({occupiedCount}/{bedsList.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {bedsList.map((bed: any) => {
                        // Find active resident
                        const activeAssign = bed.resident_assignments?.find((a: any) => !a.check_out_date)
                        const residentName = activeAssign?.residents?.full_name

                        return (
                          <div
                            key={bed.id}
                            className={cn(
                              'p-2 rounded-xl border text-xs flex flex-col justify-between transition',
                              bed.status === 'occupied'
                                ? 'bg-green-50/70 border-green-200 text-green-900'
                                : bed.status === 'available'
                                ? 'bg-blue-50/50 border-blue-200 text-blue-900 border-dashed'
                                : 'bg-gray-100 border-gray-200 text-gray-600'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-[11px]">Bed {bed.bed_label}</span>
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  bed.status === 'occupied' ? 'bg-green-500' :
                                  bed.status === 'available' ? 'bg-blue-400' : 'bg-orange-400'
                                )}
                              />
                            </div>
                            <p className="text-[10px] font-semibold truncate mt-1 text-gray-700">
                              {residentName || (bed.status === 'available' ? 'Vacant' : bed.status)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Manage Room <ArrowRight className="w-3 h-3" />
                  </Link>
                  {!isFull && (
                    <Link
                      href={`/dashboard/residents/new`}
                      className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded-lg transition"
                    >
                      + Assign
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
              className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
            >
              + Create First Room
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
