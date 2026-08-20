import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/electricity/reading
 * Stores meter reading, calculates units, splits among room residents and debits their ledgers
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

  if (!profile || !['owner', 'manager', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = profile.organization_id
  const body = await request.json()
  const {
    meter_id, reading_date, previous_reading, current_reading,
    rate_per_unit_paise, is_meter_reset, period_month, period_year,
    notes, resident_ids, per_resident_paise
  } = body

  if (!meter_id || !reading_date || current_reading === undefined || !rate_per_unit_paise) {
    return NextResponse.json({ error: 'Missing required reading fields' }, { status: 400 })
  }

  if (!is_meter_reset && current_reading < previous_reading) {
    return NextResponse.json({ error: 'Current reading cannot be lower than previous reading without meter reset' }, { status: 400 })
  }

  // 1. Insert Reading
  const { data: reading, error: readError } = await supabase
    .from('electricity_readings')
    .insert({
      organization_id: orgId,
      meter_id,
      reading_date,
      previous_reading,
      current_reading,
      rate_per_unit_paise,
      is_meter_reset: !!is_meter_reset,
      period_month,
      period_year,
      notes: notes || null,
      recorded_by: user.id,
    })
    .select()
    .single()

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 })
  }

  // 2. Post Split Charges to Resident Ledgers
  if (resident_ids && resident_ids.length > 0 && per_resident_paise > 0) {
    for (const resId of resident_ids) {
      await supabase.from('electricity_allocations').insert({
        organization_id: orgId,
        reading_id: reading.id,
        resident_id: resId,
        units_allocated: reading.units_consumed / resident_ids.length,
        amount_paise: per_resident_paise,
        allocation_method: 'equal_split',
      })

      // Post Debit Entry to Ledger
      await supabase.from('ledger_entries').insert({
        organization_id: orgId,
        resident_id: resId,
        entry_date: reading_date,
        description: `Electricity Consumption (${reading.units_consumed / resident_ids.length} kWh)`,
        category: 'electricity',
        entry_type: 'charge',
        debit_paise: per_resident_paise,
        credit_paise: 0,
        added_by: user.id,
      })
    }
  }

  // 3. Audit Log
  await supabase.from('audit_logs').insert({
    organization_id: orgId,
    user_id: user.id,
    action: 'create',
    entity_type: 'electricity_reading',
    entity_id: reading.id,
    entity_label: `Reading ${current_reading} on meter ${meter_id}`,
    after_data: { units_consumed: reading.units_consumed, rate_per_unit_paise },
  })

  return NextResponse.json({ success: true, reading_id: reading.id })
}
