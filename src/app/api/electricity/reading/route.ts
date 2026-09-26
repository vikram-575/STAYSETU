import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * POST /api/electricity/reading
 * Stores meter reading, calculates units, splits among room residents and debits their ledgers
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

    // Verify meter belongs to organization
    const { data: meter } = await serviceClient
      .from('electricity_meters')
      .select('id, meter_number, room_id')
      .eq('id', meter_id)
      .eq('organization_id', orgId)
      .single()

    if (!meter) {
      return NextResponse.json({ error: 'Meter not found in this organization' }, { status: 404 })
    }

    const validUserId = isUuid(user.id) ? user.id : null

    // 1. Check if a reading for this meter and period already exists (non-reset)
    let reading: any = null
    let isUpdate = false

    if (!is_meter_reset) {
      const { data: existing } = await serviceClient
        .from('electricity_readings')
        .select('*')
        .eq('meter_id', meter_id)
        .eq('period_year', period_year)
        .eq('period_month', period_month)
        .eq('is_meter_reset', false)
        .maybeSingle()

      if (existing) {
        isUpdate = true
        const { data: updated, error: updateError } = await serviceClient
          .from('electricity_readings')
          .update({
            reading_date,
            previous_reading,
            current_reading,
            rate_per_unit_paise,
            notes: notes || null,
            recorded_by: validUserId,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError || !updated) {
          return NextResponse.json({
            error: updateError?.message || 'Failed to update existing meter reading'
          }, { status: 500 })
        }
        reading = updated

        // Delete previous allocations for this reading to recreate them cleanly
        await serviceClient
          .from('electricity_allocations')
          .delete()
          .eq('reading_id', existing.id)

        // Clean up previous electricity ledger entries for this meter and period if replacing
        if (resident_ids && resident_ids.length > 0) {
          await serviceClient
            .from('ledger_entries')
            .delete()
            .eq('organization_id', orgId)
            .eq('category', 'electricity')
            .like('description', `Electricity (${meter.meter_number}%`)
            .in('resident_id', resident_ids)
        }
      }
    }

    if (!reading) {
      // Insert new Reading
      const { data: inserted, error: readError } = await serviceClient
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
          recorded_by: validUserId,
        })
        .select()
        .single()

      if (readError || !inserted) {
        if (readError?.code === '23505' || readError?.message?.includes('idx_unique_meter_reading_period')) {
          return NextResponse.json({
            error: `A reading for this meter has already been recorded for period ${period_month}/${period_year}. You can modify the reading date or update the existing period.`
          }, { status: 409 })
        }
        return NextResponse.json({ error: readError?.message || 'Failed to record meter reading' }, { status: 500 })
      }
      reading = inserted
    }

    // 2. Post Split Charges to Resident Ledgers
    if (resident_ids && resident_ids.length > 0 && per_resident_paise > 0) {
      const unitsPerResident = (reading.units_consumed || Math.max(0, current_reading - previous_reading)) / resident_ids.length
      for (const resId of resident_ids) {
        await serviceClient.from('electricity_allocations').insert({
          organization_id: orgId,
          reading_id: reading.id,
          resident_id: resId,
          units_allocated: unitsPerResident,
          amount_paise: per_resident_paise,
          allocation_method: 'equal_split',
        })

        // Post Debit Entry to Resident's Ledger
        await serviceClient.from('ledger_entries').insert({
          organization_id: orgId,
          resident_id: resId,
          entry_date: reading_date,
          description: `Electricity (${meter.meter_number} - ${period_month}/${period_year}): ${unitsPerResident.toFixed(1)} units @ ₹${(rate_per_unit_paise / 100).toFixed(2)}/u`,
          category: 'electricity',
          entry_type: 'charge',
          debit_paise: per_resident_paise,
          credit_paise: 0,
          added_by: validUserId,
        })
      }
    }

    // 3. Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: isUpdate ? 'update' : 'create',
      entity_type: 'electricity_reading',
      entity_id: reading.id,
      entity_label: `${isUpdate ? 'Updated' : 'Recorded'} reading ${current_reading} on meter ${meter.meter_number}`,
      after_data: { units_consumed: reading.units_consumed, rate_per_unit_paise, is_update: isUpdate },
    })

    return NextResponse.json({
      success: true,
      reading_id: reading.id,
      updated: isUpdate,
      message: isUpdate ? 'Existing reading updated successfully' : 'Meter reading recorded successfully'
    })
  } catch (err: any) {
    const rawMsg = err.message || ''
    if (rawMsg.includes('idx_unique_meter_reading_period') || rawMsg.includes('duplicate key')) {
      return NextResponse.json({
        error: 'A reading has already been recorded for this meter in the selected period. The system prevented a duplicate entry.'
      }, { status: 409 })
    }
    return NextResponse.json({ error: rawMsg || 'Electricity reading submission failed' }, { status: 500 })
  }
}
