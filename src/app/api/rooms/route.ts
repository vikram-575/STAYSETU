import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/rooms
 * Creates room and all associated beds
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orgId = profile.organization_id
    if (!orgId) return NextResponse.json({ error: 'No active organization found' }, { status: 400 })

    const body = await request.json()
    const { floor_id, room_number, room_type, capacity, base_rent_paise, description, bed_labels } = body

    if (!floor_id || !room_number || !capacity) {
      return NextResponse.json({ error: 'Missing required room fields' }, { status: 400 })
    }

    // Verify floor belongs to organization
    const { data: floor } = await supabase
      .from('floors')
      .select('id')
      .eq('id', floor_id)
      .eq('organization_id', orgId)
      .single()

    if (!floor) {
      return NextResponse.json({ error: 'Floor not found in this organization' }, { status: 404 })
    }

    // 1. Create Room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        organization_id: orgId,
        floor_id,
        room_number,
        name: `Room ${room_number}`,
        room_type: room_type || 'single',
        capacity,
        base_rent_paise: base_rent_paise || 0,
        description: description || null,
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
      organization_id: orgId,
      room_id: room.id,
      bed_label: label,
      status: 'available' as const,
      base_rent_paise: base_rent_paise || null,
    }))

    const { data: beds, error: bedError } = await supabase
      .from('beds')
      .insert(bedInserts)
      .select()

    if (bedError || !beds) {
      return NextResponse.json({ error: bedError?.message || 'Failed to create beds for room' }, { status: 500 })
    }

    // 3. Audit Log
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: user.id,
      action: 'create',
      entity_type: 'room',
      entity_id: room.id,
      entity_label: `Room ${room_number} with ${labels.length} beds`,
      after_data: { room_number, capacity, base_rent_paise },
    })

    return NextResponse.json({ success: true, room_id: room.id, beds_count: beds.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Room creation failed' }, { status: 500 })
  }
}
