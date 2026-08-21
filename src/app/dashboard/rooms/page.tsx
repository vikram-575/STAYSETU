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

  // Parallel Fetch Buildings & Rooms
  const [{ data: buildings }, { data: rooms }] = await Promise.all([
    supabase.from('buildings').select('*, floors(*)').eq('organization_id', orgId).order('name'),
    (selectedFloor
      ? supabase.from('rooms').select('*, floors(*, buildings(*)), beds(*, resident_assignments(*, residents(*)))').eq('organization_id', orgId).eq('floor_id', selectedFloor).order('room_number')
      : supabase.from('rooms').select('*, floors(*, buildings(*)), beds(*, resident_assignments(*, residents(*)))').eq('organization_id', orgId).order('room_number')
    ),
  ])

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
        <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate">Total Rooms</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">{totalRooms}</p>
          <p className="text-[10px] text-gray-400">Configured spaces</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-600 truncate">Total Beds</p>
          <p className="text-lg sm:text-xl font-black text-blue-700 mt-0.5">{totalBeds}</p>
          <p className="text-[10px] text-blue-400">Total capacity</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-green-600 truncate">Occupied Beds</p>
          <p className="text-lg sm:text-xl font-black text-green-700 mt-0.5">{occupiedBeds}</p>
          <p className="text-[10px] text-green-500 font-bold">{occupancyRate}% Occupancy</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-teal-600 truncate">Available Vacant</p>
          <p className="text-lg sm:text-xl font-black text-teal-700 mt-0.5">{availableBeds}</p>
          <p className="text-[10px] text-teal-500 font-medium">Ready for check-in</p>
        </div>
        <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase font-bold text-orange-600 truncate">Maintenance</p>
          <p className="text-lg sm:text-xl font-black text-orange-700 mt-0.5">{maintenanceBeds}</p>
          <p className="text-[10px] text-orange-500">Temporarily blocked</p>
        </div>
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
                  'bg-white rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-md flex flex-col justify-between shadow-2xs',
                  isFull ? 'border-gray-200' : 'border-blue-200 shadow-sm shadow-blue-50/50'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-base text-gray-900">Room {room.room_number}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {room.floors?.buildings?.name} · {room.floors?.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0',
                        isFull
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-800 border border-green-200'
                      )}
                    >
                      {isFull ? 'Full' : `${bedsList.length - occupiedCount} Vacant`}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-blue-600 mt-1.5">
                    Rent: {room.base_rent_paise ? formatCurrency(room.base_rent_paise) : '—'} / bed
                  </p>

                  {/* Beds Display */}
                  <div className="mt-3.5 space-y-1.5 border-t border-gray-100 pt-2.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Beds ({occupiedCount}/{bedsList.length})
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {bedsList.map((bed: any) => {
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

                <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95"
                  >
                    Manage Room <ArrowRight className="w-3 h-3" />
                  </Link>
                  {!isFull && (
                    <Link
                      href={`/dashboard/residents/new`}
                      className="text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg transition active:scale-95"
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
