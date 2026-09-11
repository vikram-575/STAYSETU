import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) return { role: 'superadmin' }
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const service = await createServiceClient()
    const { data: profile } = await service.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') return null
    return user
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const url = new URL(request.url)
    const propertyId = url.searchParams.get('property_id')

    // Fetch properties with full hierarchy
    let propQuery = supabase
      .from('properties')
      .select(`
        id, name, city, state, address, is_active, created_at, settings, organization_id,
        organizations(id, name, email, phone)
      `)
      .order('name', { ascending: true })

    if (propertyId) {
      propQuery = propQuery.eq('id', propertyId)
    }

    const { data: properties, error: propErr } = await propQuery
    if (propErr) throw propErr

    // Fetch buildings, floors, rooms, beds, and active assignments across these properties
    const propIds = (properties || []).map((p) => p.id)

    const [
      { data: buildings },
      { data: floors },
      { data: rooms },
      { data: beds },
      { data: assignments },
    ] = await Promise.all([
      supabase.from('buildings').select('*').in('property_id', propIds),
      supabase.from('floors').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('beds').select('*'),
      supabase
        .from('resident_assignments')
        .select('id, bed_id, resident_id, check_in_date, monthly_rent_paise, residents(id, full_name, phone, registration_number)')
        .is('check_out_date', null),
    ])

    const activeResidentByBed: Record<string, any> = {}
    ;(assignments || []).forEach((a: any) => {
      if (a.bed_id && a.residents) {
        activeResidentByBed[a.bed_id] = {
          id: a.residents.id,
          name: a.residents.full_name,
          registration_number: a.residents.registration_number,
          phone: a.residents.phone,
          check_in_date: a.check_in_date,
          rent_paise: a.monthly_rent_paise,
        }
      }
    })

    // Construct hierarchy: Property -> Building -> Floor -> Room -> Bed
    const hierarchy = (properties || []).map((prop) => {
      const propBuildings = (buildings || []).filter((b) => b.property_id === prop.id)

      const structuredBuildings = propBuildings.map((b) => {
        const bFloors = (floors || []).filter((f) => f.building_id === b.id)

        const structuredFloors = bFloors.map((f) => {
          const fRooms = (rooms || []).filter((r) => r.floor_id === f.id)

          const structuredRooms = fRooms.map((r) => {
            const rBeds = (beds || []).filter((bed) => bed.room_id === r.id)

            const structuredBeds = rBeds.map((bed) => {
              const activeRes = activeResidentByBed[bed.id] || null
              const bedStatus = activeRes ? 'occupied' : bed.status

              return {
                id: bed.id,
                bed_label: bed.bed_label,
                status: bedStatus,
                base_rent_paise: bed.base_rent_paise || r.base_rent_paise || 800000,
                current_resident: activeRes,
              }
            })

            return {
              id: r.id,
              room_number: r.room_number,
              capacity: r.capacity,
              status: r.is_active ? 'active' : 'inactive',
              base_rent_paise: r.base_rent_paise,
              beds: structuredBeds,
            }
          })

          return {
            id: f.id,
            floor_number: f.floor_number,
            name: f.name,
            rooms: structuredRooms,
          }
        })

        return {
          id: b.id,
          name: b.name,
          total_floors: b.total_floors,
          floors: structuredFloors,
        }
      })

      // Aggregate counts
      let totalRoomsCount = 0
      let totalBedsCount = 0
      let occupiedBedsCount = 0

      structuredBuildings.forEach((b) => {
        b.floors.forEach((f) => {
          totalRoomsCount += f.rooms.length
          f.rooms.forEach((r) => {
            totalBedsCount += r.beds.length
            occupiedBedsCount += r.beds.filter((bed) => bed.status === 'occupied').length
          })
        })
      })

      return {
        id: prop.id,
        name: prop.name,
        city: prop.city || '',
        locality: prop.settings?.locality || prop.city || '',
        address: prop.address || '',
        owner_name: (prop.organizations as any)?.name || 'Property Owner',
        owner_email: (prop.organizations as any)?.email || '',
        owner_phone: (prop.organizations as any)?.phone || '',
        total_buildings: structuredBuildings.length,
        total_rooms: totalRoomsCount,
        total_beds: totalBedsCount,
        occupied_beds: occupiedBedsCount,
        vacant_beds: Math.max(0, totalBedsCount - occupiedBedsCount),
        occupancy_pct: totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0,
        buildings: structuredBuildings,
      }
    })

    return NextResponse.json({
      success: true,
      properties: hierarchy,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch structure hierarchy' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const { entity_type, id, updates, reason } = await request.json()

    if (!entity_type || !id || !updates) {
      return NextResponse.json({ error: 'entity_type, id, and updates are required.' }, { status: 400 })
    }

    if (entity_type === 'bed') {
      // If changing bed status, ensure we don't mark as available if active resident is assigned
      if (updates.status === 'available') {
        const { data: activeAssignment } = await supabase
          .from('resident_assignments')
          .select('id')
          .eq('bed_id', id)
          .is('check_out_date', null)
          .maybeSingle()

        if (activeAssignment) {
          return NextResponse.json(
            { error: 'Cannot set bed to available: An active resident is currently occupying this bed.' },
            { status: 409 }
          )
        }
      }

      const { data: updatedBed, error: bedErr } = await supabase
        .from('beds')
        .update({
          status: updates.status,
          base_rent_paise: updates.base_rent_paise,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (bedErr) throw bedErr

      return NextResponse.json({
        success: true,
        message: 'Bed status updated successfully.',
        bed: updatedBed,
      })
    }

    if (entity_type === 'room') {
      const { data: updatedRoom, error: roomErr } = await supabase
        .from('rooms')
        .update({
          capacity: updates.capacity,
          base_rent_paise: updates.base_rent_paise,
          is_active: updates.is_active !== undefined ? updates.is_active : true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (roomErr) throw roomErr

      return NextResponse.json({
        success: true,
        message: 'Room updated successfully.',
        room: updatedRoom,
      })
    }

    return NextResponse.json({ error: 'Unsupported entity_type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update structure entity' }, { status: 500 })
  }
}
