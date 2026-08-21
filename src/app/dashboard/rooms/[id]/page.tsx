import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import {
  BedDouble, ArrowLeft, Plus, User, Zap,
  CheckCircle2, AlertCircle, Wrench, ArrowRight
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'

export default async function RoomDetailPage({ params }: Props) {
  const { id: roomId } = await params

  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  let orgId = user.organization_id
  if (!orgId) {
    const { data: defaultOrg } = await supabase.from('organizations').select('id').limit(1).single()
    orgId = defaultOrg?.id || 'primary'
  }

  // Room details
  const { data: room } = await supabase
    .from('rooms')
    .select('*, floors(*, buildings(*)), beds(*, resident_assignments(*, residents(*)))')
    .eq('id', roomId)
    .eq('organization_id', orgId)
    .single()

  if (!room) notFound()

  // Electricity meter linked to this room
  const { data: meter } = await supabase
    .from('electricity_meters')
    .select('*, electricity_readings(*)')
    .eq('room_id', roomId)
    .single()

  const bedsList = room.beds || []
  const occupiedBeds = bedsList.filter((b: any) => b.status === 'occupied').length

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/rooms"
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Rooms Matrix
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Room {room.room_number}</h1>
          <p className="text-xs text-gray-500 font-medium">
            {room.floors?.buildings?.name} · {room.floors?.name} · Capacity: {room.capacity} Beds
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/residents/new"
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            + Check In to This Room
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 truncate">Total Beds</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 truncate">{bedsList.length}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-green-600 truncate">Occupied</p>
          <p className="text-lg sm:text-xl font-black text-green-700 mt-0.5 truncate">{occupiedBeds}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-blue-600 truncate">Vacant Available</p>
          <p className="text-lg sm:text-xl font-black text-blue-700 mt-0.5 truncate">{bedsList.length - occupiedBeds}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate">Base Bed Rent</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 truncate">
            {room.base_rent_paise ? formatCurrency(room.base_rent_paise) : '—'}
          </p>
        </div>
      </div>

      {/* Beds Detailed List */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-gray-900">Bed Assignments in Room {room.room_number}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {bedsList.map((bed: any) => {
            const activeAssign = bed.resident_assignments?.find((a: any) => !a.check_out_date)
            const resident = activeAssign?.residents

            return (
              <div
                key={bed.id}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-2xs',
                  bed.status === 'occupied'
                    ? 'bg-green-50/50 border-green-200'
                    : 'bg-gray-50/60 border-gray-200'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-gray-900">Bed {bed.bed_label}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        bed.status === 'occupied'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {bed.status}
                    </span>
                  </div>

                  {resident ? (
                    <div className="mt-2.5 space-y-1 text-xs">
                      <p className="font-black text-gray-900 text-sm">{resident.full_name}</p>
                      <p className="font-mono text-[11px] text-blue-600 font-bold">{resident.registration_number}</p>
                      <p className="text-gray-500 font-medium">{resident.phone}</p>
                      <p className="text-gray-400 text-[10px]">Check-in: {formatDate(activeAssign.check_in_date)}</p>
                      <p className="font-bold text-gray-900 pt-1">
                        Rent: {formatCurrency(activeAssign.monthly_rent_paise)}/mo
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-400 py-4 text-center font-medium">
                      Vacant bed. Ready for check-in.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  {resident ? (
                    <Link
                      href={`/dashboard/residents/${resident.id}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95"
                    >
                      Resident Profile →
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/residents/new"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 active:scale-95"
                    >
                      + Assign Resident
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Electricity Meter Information */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900">Electricity Sub-Meter</h2>
          </div>
          <Link
            href="/dashboard/electricity/reading"
            className="text-xs font-bold px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border border-yellow-200 rounded-xl transition active:scale-95"
          >
            + Record Reading
          </Link>
        </div>

        {meter ? (
          <div className="p-3.5 sm:p-4 bg-yellow-50/40 border border-yellow-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
            <div>
              <p className="font-bold text-gray-900">Meter Number: {meter.meter_number}</p>
              <p className="text-gray-500 text-[11px] mt-0.5">Allocation: {meter.allocation_method.replace('_', ' ')}</p>
            </div>
            <span className="font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full text-[10px] uppercase">
              Active
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-400 py-2">
            No dedicated electricity meter linked to Room {room.room_number}. Add one in Electricity Management.
          </p>
        )}
      </div>
    </div>
  )
}
