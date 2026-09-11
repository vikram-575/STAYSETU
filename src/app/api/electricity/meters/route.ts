import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * GET /api/electricity/meters
 * Fetches all electricity meters strictly belonging to the authenticated user's organization,
 * including associated room details, latest recorded reading, and active residents in the room.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ meters: [] })
    }

    // 1. Fetch meters for this org
    const { data: meters, error: meterError } = await serviceClient
      .from('electricity_meters')
      .select('*, rooms(*)')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('meter_number')

    if (meterError) {
      return NextResponse.json({ error: meterError.message }, { status: 500 })
    }

    if (!meters || meters.length === 0) {
      return NextResponse.json({ meters: [] })
    }

    // 2. Fetch latest reading for each meter & active residents for rooms
    const roomIds = meters.map((m) => m.room_id).filter(Boolean)

    const [readingsRes, residentsRes] = await Promise.all([
      serviceClient
        .from('electricity_readings')
        .select('meter_id, current_reading, reading_date')
        .eq('organization_id', orgId)
        .order('reading_date', { ascending: false }),
      roomIds.length > 0
        ? serviceClient
            .from('v_resident_current')
            .select('*')
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .in('room_id', roomIds)
        : Promise.resolve({ data: [] }),
    ])

    const readingsByMeter: Record<string, any> = {}
    readingsRes.data?.forEach((r) => {
      if (!readingsByMeter[r.meter_id]) {
        readingsByMeter[r.meter_id] = r
      }
    })

    const residentsByRoom: Record<string, any[]> = {}
    residentsRes.data?.forEach((res) => {
      if (res.room_id) {
        if (!residentsByRoom[res.room_id]) residentsByRoom[res.room_id] = []
        residentsByRoom[res.room_id].push(res)
      }
    })

    const enrichedMeters = meters.map((m) => ({
      ...m,
      latest_reading: readingsByMeter[m.id]?.current_reading ?? 0,
      latest_reading_date: readingsByMeter[m.id]?.reading_date ?? null,
      room_residents: m.room_id ? (residentsByRoom[m.room_id] || []) : [],
    }))

    return NextResponse.json({ meters: enrichedMeters })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch electricity meters' }, { status: 500 })
  }
}

/**
 * POST /api/electricity/meters
 * Registers a new electricity sub-meter
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'staff', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const { meter_number, meter_type, room_id, allocation_method, notes } = body

    if (!meter_number) {
      return NextResponse.json({ error: 'Meter number is required' }, { status: 400 })
    }

    // Get primary property for org
    const { data: property } = await serviceClient
      .from('properties')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single()

    const { data: meter, error: meterError } = await serviceClient
      .from('electricity_meters')
      .insert({
        organization_id: orgId,
        property_id: property?.id,
        meter_number,
        meter_type: meter_type || 'sub',
        room_id: room_id || null,
        allocation_method: allocation_method || 'equal_split',
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (meterError || !meter) {
      return NextResponse.json({ error: meterError?.message || 'Failed to create meter' }, { status: 500 })
    }

    const validUserId = isUuid(user.id) ? user.id : null

    // Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: 'create',
      entity_type: 'electricity_meter',
      entity_id: meter.id,
      entity_label: `Meter ${meter_number}`,
    })

    return NextResponse.json({ success: true, meter_id: meter.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to register meter' }, { status: 500 })
  }
}
