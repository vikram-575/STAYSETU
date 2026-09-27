import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'
import { parseMeterNotes, calculateDifferentialUnits } from '@/lib/electricity-helper'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * POST /api/electricity/reading
 * Stores meter reading, calculates differential units (current - previous),
 * and debits the assigned resident's ledger directly (Bed-wise) or splits among room residents
 * using stay-adjusted pro-rata (solo days 100%, shared days 50/50).
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
      meter_id,
      reading_date,
      previous_reading,
      current_reading,
      rate_per_unit_paise,
      is_meter_reset,
      period_month,
      period_year,
      notes,
      photo_url,
      resident_ids,
      resident_id,
      bed_id,
      per_resident_paise,
      allocation_method,
      allocations, // Array<{ resident_id: string; resident_name?: string; units_allocated: number; amount_paise: number; explanation?: string }>
    } = body

    if (!meter_id || !reading_date || current_reading === undefined || !rate_per_unit_paise) {
      return NextResponse.json({ error: 'Missing required reading fields' }, { status: 400 })
    }

    const prevNum = parseFloat(previous_reading) || 0
    const currNum = parseFloat(current_reading) || 0
    const ratePaise = parseInt(rate_per_unit_paise) || 1000

    if (!is_meter_reset && currNum < prevNum) {
      return NextResponse.json(
        { error: `Current reading (${currNum}) cannot be lower than previous reading (${prevNum}) without meter reset.` },
        { status: 400 }
      )
    }

    // Verify meter belongs to organization
    const { data: meter, error: meterFetchErr } = await serviceClient
      .from('electricity_meters')
      .select('id, meter_number, meter_type, allocation_method, room_id, notes, rooms(id, room_number)')
      .eq('id', meter_id)
      .eq('organization_id', orgId)
      .single()

    if (meterFetchErr || !meter) {
      return NextResponse.json({ error: 'Meter not found in this organization' }, { status: 404 })
    }

    const validUserId = isUuid(user.id) ? user.id : null
    const meta = parseMeterNotes(meter.notes)
    const effectiveBedId = bed_id || meta.bed_id

    // Determine target residents for this meter
    let targetResidentIds: string[] = []

    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      targetResidentIds = allocations.map((a: any) => a.resident_id).filter(Boolean)
    } else if (resident_id) {
      targetResidentIds = [resident_id]
    } else if (effectiveBedId) {
      const { data: bedAssignment } = await serviceClient
        .from('resident_assignments')
        .select('resident_id, residents(id, full_name)')
        .eq('bed_id', effectiveBedId)
        .is('check_out_date', null)
        .maybeSingle()

      if (bedAssignment?.resident_id) {
        targetResidentIds = [bedAssignment.resident_id]
      }
    }

    if (targetResidentIds.length === 0 && Array.isArray(resident_ids) && resident_ids.length > 0) {
      targetResidentIds = resident_ids
    }

    // 1. Check if a reading for this meter and period already exists (non-reset)
    let reading: any = null
    let isUpdate = false

    let effectiveNotes = notes || null
    if (photo_url) {
      effectiveNotes = effectiveNotes
        ? `${effectiveNotes} | Photo: ${photo_url}`
        : `Photo: ${photo_url}`
    }

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
            previous_reading: prevNum,
            current_reading: currNum,
            rate_per_unit_paise: ratePaise,
            notes: effectiveNotes,
            recorded_by: validUserId,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError || !updated) {
          return NextResponse.json(
            { error: updateError?.message || 'Failed to update existing meter reading' },
            { status: 500 }
          )
        }
        reading = updated

        // Delete previous allocations and ledger entries for this reading to recreate them cleanly
        await serviceClient.from('electricity_allocations').delete().eq('reading_id', existing.id)

        if (targetResidentIds.length > 0) {
          await serviceClient
            .from('ledger_entries')
            .delete()
            .eq('organization_id', orgId)
            .eq('category', 'electricity')
            .like('description', `Electricity (${meter.meter_number}%`)
            .in('resident_id', targetResidentIds)
        }
      }
    }

    if (!reading) {
      // Insert new Reading (PostgreSQL generated columns compute units_consumed & total_paise)
      const { data: inserted, error: readError } = await serviceClient
        .from('electricity_readings')
        .insert({
          organization_id: orgId,
          meter_id,
          reading_date,
          previous_reading: prevNum,
          current_reading: currNum,
          rate_per_unit_paise: ratePaise,
          is_meter_reset: !!is_meter_reset,
          period_month,
          period_year,
          notes: effectiveNotes,
          recorded_by: validUserId,
        })
        .select()
        .single()

      if (readError || !inserted) {
        if (readError?.code === '23505' || readError?.message?.includes('idx_unique_meter_reading_period')) {
          return NextResponse.json(
            {
              error: `A reading for meter ${meter.meter_number} has already been recorded for period ${period_month}/${period_year}. You can update or re-record with a different period.`,
            },
            { status: 409 }
          )
        }
        return NextResponse.json({ error: readError?.message || 'Failed to record meter reading' }, { status: 500 })
      }
      reading = inserted
    }

    // 2. Compute Differential Units and Post Ledger Charges
    // Differential units = current_reading - previous_reading
    const unitsConsumed = is_meter_reset ? currNum : Math.max(0, currNum - prevNum)
    const totalPaise = Math.round(unitsConsumed * ratePaise)

    if (unitsConsumed > 0 && totalPaise > 0) {
      const bedTag = meta.bed_label ? ` · Bed ${meta.bed_label}` : ''
      const roomTag = (meter as any).rooms?.room_number ? ` (Room ${(meter as any).rooms.room_number}${bedTag})` : ''

      if (allocations && Array.isArray(allocations) && allocations.length > 0) {
        // Stay-Adjusted Pro-Rata Allocations
        for (const alloc of allocations) {
          if (!alloc.resident_id) continue

          const unitsAlloc = Number(alloc.units_allocated) || 0
          const paiseAlloc = Number(alloc.amount_paise) || 0

          await serviceClient.from('electricity_allocations').insert({
            organization_id: orgId,
            reading_id: reading.id,
            resident_id: alloc.resident_id,
            units_allocated: unitsAlloc,
            amount_paise: paiseAlloc,
            allocation_method: allocation_method || 'pro_rata_stay',
          })

          const explainTag = alloc.explanation ? ` (${alloc.explanation})` : ''
          await serviceClient.from('ledger_entries').insert({
            organization_id: orgId,
            resident_id: alloc.resident_id,
            entry_date: reading_date,
            description: `Electricity (${meter.meter_number}${roomTag} - ${period_month}/${period_year}): ${unitsAlloc.toFixed(1)} kWh @ ₹${(ratePaise / 100).toFixed(2)}/u${explainTag}`,
            category: 'electricity',
            entry_type: 'charge',
            debit_paise: paiseAlloc,
            credit_paise: 0,
            added_by: validUserId,
          })
        }
      } else if (targetResidentIds.length > 0) {
        // Standard equal / single resident split fallback
        const unitsPerResident = unitsConsumed / targetResidentIds.length
        const paisePerResident = Math.round(totalPaise / targetResidentIds.length)

        for (const resId of targetResidentIds) {
          await serviceClient.from('electricity_allocations').insert({
            organization_id: orgId,
            reading_id: reading.id,
            resident_id: resId,
            units_allocated: unitsPerResident,
            amount_paise: paisePerResident,
            allocation_method: targetResidentIds.length === 1 ? 'per_resident' : 'equal_split',
          })

          await serviceClient.from('ledger_entries').insert({
            organization_id: orgId,
            resident_id: resId,
            entry_date: reading_date,
            description: `Electricity (${meter.meter_number}${roomTag} - ${period_month}/${period_year}): ${unitsPerResident.toFixed(1)} kWh @ ₹${(ratePaise / 100).toFixed(2)}/u (${prevNum} → ${currNum})`,
            category: 'electricity',
            entry_type: 'charge',
            debit_paise: paisePerResident,
            credit_paise: 0,
            added_by: validUserId,
          })
        }
      }
    }

    // 3. Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: isUpdate ? 'update' : 'create',
      entity_type: 'electricity_reading',
      entity_id: reading.id,
      entity_label: `${isUpdate ? 'Updated' : 'Recorded'} reading ${currNum} on meter ${meter.meter_number} (${unitsConsumed} units)`,
      after_data: {
        units_consumed: unitsConsumed,
        previous_reading: prevNum,
        current_reading: currNum,
        rate_per_unit_paise: ratePaise,
        total_paise: totalPaise,
        photo_url: photo_url || null,
        billed_residents_count: targetResidentIds.length,
        is_update: isUpdate,
        allocation_method: allocation_method || (allocations ? 'pro_rata_stay' : 'equal_split'),
      },
    })

    const billedCount = allocations?.length || targetResidentIds.length
    return NextResponse.json({
      success: true,
      reading_id: reading.id,
      units_consumed: unitsConsumed,
      total_amount_rupees: totalPaise / 100,
      billed_residents: billedCount,
      updated: isUpdate,
      message: isUpdate
        ? `Existing reading updated. ${unitsConsumed} kWh allocated to ${billedCount} resident(s).`
        : `Reading recorded successfully. ${unitsConsumed} kWh (${prevNum} → ${currNum}) billed to ${billedCount} resident(s).`,
    })
  } catch (err: any) {
    const rawMsg = err.message || ''
    if (rawMsg.includes('idx_unique_meter_reading_period') || rawMsg.includes('duplicate key')) {
      return NextResponse.json(
        {
          error: 'A reading has already been recorded for this meter in the selected period.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: rawMsg || 'Electricity reading submission failed' }, { status: 500 })
  }
}
