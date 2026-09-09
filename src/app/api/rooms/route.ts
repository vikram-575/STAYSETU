import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

/**
 * GET /api/rooms
 * Returns all buildings, floors, rooms, and beds for the current authenticated user's organization
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = await createServiceClient()
    let orgId = user.organization_id

    if (!orgId) {
      const { data: defaultOrg } = await serviceClient
        .from('organizations')
        .select('id')
        .limit(1)
        .single()
      orgId = defaultOrg?.id || 'primary'
    }

    const { data: rooms, error } = await serviceClient
      .from('rooms')
      .select('*, floors(id, name, buildings(id, name)), beds(*)')
      .eq('organization_id', orgId)
      .order('room_number')

    if (error) throw error

    return NextResponse.json({ rooms: rooms || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch rooms' }, { status: 500 })
  }
}

/**
 * POST /api/rooms
 * Creates room and all associated beds
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'staff', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    let orgId = user.organization_id

    const body = await request.json()
    const { floor_id, room_number, room_type, capacity, base_rent_paise, description, bed_labels } = body

    if (!floor_id || !room_number || !capacity) {
      return NextResponse.json({ error: 'Missing required room fields' }, { status: 400 })
    }

    // Verify floor belongs to organization
    let floorQuery = serviceClient.from('floors').select('id, organization_id').eq('id', floor_id)
    if (orgId) {
      floorQuery = floorQuery.eq('organization_id', orgId)
    }
    const { data: floor } = await floorQuery.maybeSingle()

    if (!floor) {
      return NextResponse.json({ error: 'Floor not found in this organization' }, { status: 404 })
    }

    const targetOrgId = floor.organization_id || orgId

    // 1. Create Room
    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .insert({
        organization_id: targetOrgId,
        floor_id,
        room_number,
        name: `Room ${room_number}`,
        room_type: room_type || 'single',
        capacity,
        base_rent_paise: base_rent_paise || 0,
        description: description || null,
        is_active: true,
      })
      .select()
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: roomError?.message || 'Failed to create room' }, { status: 500 })
    }

    // 2. Create Beds
    const labels: string[] = bed_labels && bed_labels.length > 0
      ? bed_labels
      : Array.from({ length: capacity }, (_, i) => String.fromCharCode(65 + i))

    const bedInserts = labels.map((label) => ({
      organization_id: targetOrgId,
      room_id: room.id,
      bed_label: label,
      status: 'available' as const,
      base_rent_paise: base_rent_paise || null,
    }))

    const { data: beds, error: bedError } = await serviceClient
      .from('beds')
      .insert(bedInserts)
      .select()

    if (bedError || !beds) {
      return NextResponse.json({ error: bedError?.message || 'Failed to create beds for room' }, { status: 500 })
    }

    // Resolve valid user ID for audit log
    let validUserId: string | null = null
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
    if (isUuid) {
      const { data: dbU } = await serviceClient.from('users').select('id').eq('id', user.id).maybeSingle()
      if (dbU) validUserId = dbU.id
    }

    // 3. Audit Log
    try {
      await serviceClient.from('audit_logs').insert({
        organization_id: targetOrgId,
        user_id: validUserId,
        action: 'create',
        entity_type: 'room',
        entity_id: room.id,
        entity_label: `Room ${room_number} with ${labels.length} beds`,
        after_data: { room_number, capacity, base_rent_paise },
      })
    } catch {}

    return NextResponse.json({ success: true, room_id: room.id, beds_count: beds.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Room creation failed' }, { status: 500 })
  }
}
