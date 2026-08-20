import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/electricity/meters
 * Registers a new electricity sub-meter
 */
export async function POST(request: NextRequest) {
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
  const body = await request.json()
  const { meter_number, meter_type, room_id, allocation_method, notes } = body

  if (!meter_number) {
    return NextResponse.json({ error: 'Meter number is required' }, { status: 400 })
  }

  // Get primary property
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1)
    .single()

  const { data: meter, error: meterError } = await supabase
    .from('electricity_meters')
    .insert({
      organization_id: orgId,
      property_id: property?.id,
      meter_number,
      meter_type: meter_type || 'sub',
      room_id: room_id || null,
      allocation_method: allocation_method || 'equal_split',
      notes: notes || null,
    })
    .select()
    .single()

  if (meterError) {
    return NextResponse.json({ error: meterError.message }, { status: 500 })
  }

  // Audit Log
  await supabase.from('audit_logs').insert({
    organization_id: orgId,
    user_id: user.id,
    action: 'create',
    entity_type: 'electricity_meter',
    entity_id: meter.id,
    entity_label: `Meter ${meter_number}`,
  })

  return NextResponse.json({ success: true, meter_id: meter.id })
}
