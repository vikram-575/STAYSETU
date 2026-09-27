import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'
import {
  parseMeterNotes,
  formatMeterNotes,
  generateBedMeterNumber,
  calculateProRataElectricitySplit,
} from '@/lib/electricity-helper'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * GET /api/electricity/meters
 * Fetches all electricity meters strictly belonging to the authenticated user's organization,
 * enriched with room, bed, active resident occupant, stay duration, and latest recorded reading baseline.
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
      .select('*, rooms(*, floors(id, name, buildings(id, name)))')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('meter_number')

    if (meterError) {
      return NextResponse.json({ error: meterError.message }, { status: 500 })
    }

    if (!meters || meters.length === 0) {
      return NextResponse.json({ meters: [] })
    }

    const meterIds = meters.map((m) => m.id)
    const roomIds = meters.map((m) => m.room_id).filter(Boolean)

    // 2. Fetch latest readings, beds, assignments, and reading history
    const [readingsRes, bedsRes, assignmentsRes, allReadingsRes] = await Promise.all([
      serviceClient
        .from('electricity_readings')
        .select('meter_id, current_reading, reading_date, rate_per_unit_paise, is_meter_reset, units_consumed, total_paise')
        .eq('organization_id', orgId)
        .in('meter_id', meterIds)
        .order('reading_date', { ascending: false }),
      roomIds.length > 0
        ? serviceClient
            .from('beds')
            .select('id, room_id, bed_label, status, base_rent_paise')
            .eq('organization_id', orgId)
            .in('room_id', roomIds)
            .order('bed_label')
        : Promise.resolve({ data: [] }),
      serviceClient
        .from('resident_assignments')
        .select('id, resident_id, bed_id, check_in_date, check_out_date, residents(id, full_name, phone, registration_number, email)')
        .eq('organization_id', orgId)
        .is('check_out_date', null),
      serviceClient
        .from('electricity_readings')
        .select('*, electricity_allocations(*, residents(id, full_name))')
        .eq('organization_id', orgId)
        .in('meter_id', meterIds)
        .order('reading_date', { ascending: false })
        .limit(100),
    ])

    // Index latest reading by meter
    const readingsByMeter: Record<string, any> = {}
    readingsRes.data?.forEach((r) => {
      if (!readingsByMeter[r.meter_id]) {
        readingsByMeter[r.meter_id] = r
      }
    })

    // Index all readings by meter
    const historyByMeter: Record<string, any[]> = {}
    allReadingsRes.data?.forEach((r) => {
      if (!historyByMeter[r.meter_id]) historyByMeter[r.meter_id] = []
      historyByMeter[r.meter_id].push(r)
    })

    // Index beds by ID & by room_id
    const bedsById: Record<string, any> = {}
    const bedsByRoomId: Record<string, any[]> = {}
    const bedsByRoomAndLabel: Record<string, any> = {}
    bedsRes.data?.forEach((b) => {
      bedsById[b.id] = b
      if (b.room_id) {
        if (!bedsByRoomId[b.room_id]) bedsByRoomId[b.room_id] = []
        bedsByRoomId[b.room_id].push(b)
        if (b.bed_label) {
          bedsByRoomAndLabel[`${b.room_id}_${b.bed_label.toUpperCase()}`] = b
        }
      }
    })

    // Index active assignment by bed_id
    const assignmentByBedId: Record<string, any> = {}
    assignmentsRes.data?.forEach((a) => {
      if (a.bed_id) {
        assignmentByBedId[a.bed_id] = a
      }
    })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // 3. Enrich each meter with bed, room beds, active resident details, and pro-rata stay preview
    const enrichedMeters = meters.map((m) => {
      const parsedMeta = parseMeterNotes(m.notes)
      let matchedBed = parsedMeta.bed_id ? bedsById[parsedMeta.bed_id] : null

      // Match bed if meter number ends with bed label (e.g. MTR-101-A -> Bed A)
      if (!matchedBed && m.room_id) {
        const lastPart = m.meter_number.split(/[-_]/).pop()?.toUpperCase()
        if (lastPart && lastPart.length <= 2) {
          matchedBed = bedsByRoomAndLabel[`${m.room_id}_${lastPart}`] || null
        }
      }

      // Find active resident occupying this specific bed (if bed-wise meter)
      const activeAssignment = matchedBed?.id ? assignmentByBedId[matchedBed.id] : null
      const activeResident = activeAssignment?.residents || null

      // Find all beds in this room
      const rawRoomBeds = m.room_id ? (bedsByRoomId[m.room_id] || []) : []
      const roomResidentsList: any[] = []

      const roomBeds = rawRoomBeds.map((b) => {
        const assign = assignmentByBedId[b.id]
        const res = assign?.residents || null
        if (res) {
          roomResidentsList.push({
            resident_id: res.id,
            resident_name: res.full_name,
            phone: res.phone,
            bed_id: b.id,
            bed_label: b.bed_label,
            check_in_date: assign.check_in_date,
            check_out_date: assign.check_out_date || null,
          })
        }

        return {
          id: b.id,
          bed_label: b.bed_label,
          status: assign ? 'occupied' : (b.status || 'available'),
          base_rent_paise: b.base_rent_paise,
          resident: res ? {
            id: res.id,
            full_name: res.full_name,
            phone: res.phone,
            check_in_date: assign.check_in_date,
          } : null,
        }
      })

      const latestReading = readingsByMeter[m.id]?.current_reading ?? 0
      const latestReadingDate = readingsByMeter[m.id]?.reading_date ?? null
      const defaultRatePaise = readingsByMeter[m.id]?.rate_per_unit_paise ?? 1000

      // Pro-Rata Stay Split Preview for this room
      const proRataPreview = calculateProRataElectricitySplit({
        totalUnits: 100, // benchmark 100 kWh
        ratePerUnitPaise: defaultRatePaise,
        periodMonth: currentMonth,
        periodYear: currentYear,
        residents: roomResidentsList,
      })

      // Compute display title
      const roomLabel = m.rooms?.room_number ? `Room ${m.rooms.room_number}` : 'Common Area'
      let displayTitle = `Meter ${m.meter_number} · ${roomLabel}`
      if (matchedBed) {
        displayTitle += ` · Bed ${matchedBed.bed_label}`
        if (activeResident) {
          displayTitle += ` (${activeResident.full_name})`
        } else {
          displayTitle += ` (Vacant)`
        }
      } else if (roomResidentsList.length > 0) {
        displayTitle += ` (${roomResidentsList.length} Residents · Equal/Pro-Rata)`
      }

      return {
        ...m,
        bed_id: matchedBed?.id || parsedMeta.bed_id || null,
        bed_label: matchedBed?.bed_label || parsedMeta.bed_label || null,
        bed: matchedBed,
        active_resident: activeResident,
        is_bed_meter: Boolean(matchedBed || parsedMeta.isBedMeter),
        display_title: displayTitle,
        latest_reading: latestReading,
        latest_reading_date: latestReadingDate,
        rate_per_unit_paise: defaultRatePaise,
        room_residents: roomResidentsList,
        room_beds: roomBeds,
        meter_readings: historyByMeter[m.id] || [],
        pro_rata_preview: proRataPreview,
        parsed_note: parsedMeta.displayNote,
      }
    })

    return NextResponse.json({ meters: enrichedMeters })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch electricity meters' }, { status: 500 })
  }
}

/**
 * POST /api/electricity/meters
 * Registers a new electricity sub-meter (Bed-wise or Room-wise)
 * Optionally saves opening baseline units if provided
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
      meter_number,
      meter_type,
      room_id,
      bed_id,
      allocation_method,
      notes,
      initial_reading,
      rate_per_unit_paise,
    } = body

    if (!meter_number || !meter_number.trim()) {
      return NextResponse.json({ error: 'Meter number is required' }, { status: 400 })
    }

    const cleanMeterNumber = meter_number.trim().toUpperCase()

    // 1. Verify Property
    let propertyId: string | null = null
    if (room_id) {
      const { data: roomData } = await serviceClient
        .from('rooms')
        .select('id, room_number, floors(building_id, buildings(property_id))')
        .eq('id', room_id)
        .maybeSingle()

      propertyId = (roomData as any)?.floors?.buildings?.property_id || null
    }

    if (!propertyId) {
      const { data: prop } = await serviceClient
        .from('properties')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1)
        .single()
      propertyId = prop?.id || null
    }

    // 2. Resolve Bed Details if Bed-Wise Meter
    let bedLabel: string | null = null
    let targetRoomId = room_id || null
    let activeResidentInfo: any = null

    if (bed_id) {
      const { data: bed } = await serviceClient
        .from('beds')
        .select('id, room_id, bed_label')
        .eq('id', bed_id)
        .maybeSingle()

      if (bed) {
        bedLabel = bed.bed_label
        targetRoomId = bed.room_id || targetRoomId

        // Look for active resident on this bed
        const { data: assignment } = await serviceClient
          .from('resident_assignments')
          .select('resident_id, residents(id, full_name, phone)')
          .eq('bed_id', bed.id)
          .is('check_out_date', null)
          .maybeSingle()

        if (assignment?.residents) {
          activeResidentInfo = assignment.residents
        }
      }
    }

    // 3. Format structured metadata in notes
    const formattedNotes = formatMeterNotes({
      bed_id: bed_id || null,
      bed_label: bedLabel,
      resident_id: activeResidentInfo?.id || null,
      resident_name: activeResidentInfo?.full_name || null,
      resident_phone: activeResidentInfo?.phone || null,
      custom_note: notes || null,
    })

    const effectiveAllocation = bed_id
      ? 'per_resident'
      : (allocation_method || 'equal_split')

    // 4. Check for duplicate meter number in organization
    const { data: existingMeter } = await serviceClient
      .from('electricity_meters')
      .select('id')
      .eq('organization_id', orgId)
      .eq('meter_number', cleanMeterNumber)
      .maybeSingle()

    let meterId: string

    if (existingMeter) {
      // Update existing meter with bed metadata
      const { data: updatedMeter, error: updateErr } = await serviceClient
        .from('electricity_meters')
        .update({
          room_id: targetRoomId,
          meter_type: meter_type || 'sub',
          allocation_method: effectiveAllocation,
          notes: formattedNotes,
          is_active: true,
        })
        .eq('id', existingMeter.id)
        .select()
        .single()

      if (updateErr || !updatedMeter) {
        return NextResponse.json({ error: updateErr?.message || 'Failed to update existing meter' }, { status: 500 })
      }
      meterId = updatedMeter.id
    } else {
      // Insert new meter
      const { data: newMeter, error: insertErr } = await serviceClient
        .from('electricity_meters')
        .insert({
          organization_id: orgId,
          property_id: propertyId,
          meter_number: cleanMeterNumber,
          meter_type: meter_type || 'sub',
          room_id: targetRoomId,
          allocation_method: effectiveAllocation,
          notes: formattedNotes,
          is_active: true,
        })
        .select()
        .single()

      if (insertErr || !newMeter) {
        return NextResponse.json({ error: insertErr?.message || 'Failed to create meter' }, { status: 500 })
      }
      meterId = newMeter.id
    }

    const validUserId = isUuid(user.id) ? user.id : null

    // 5. If initial reading baseline is provided (> 0), record opening baseline
    if (initial_reading !== undefined && initial_reading !== null && initial_reading !== '') {
      const startingUnits = parseFloat(initial_reading)
      if (!isNaN(startingUnits) && startingUnits >= 0) {
        const today = new Date()
        const ratePaise = rate_per_unit_paise ? parseInt(rate_per_unit_paise) : 1000

        await serviceClient.from('electricity_readings').insert({
          organization_id: orgId,
          meter_id: meterId,
          reading_date: today.toISOString().split('T')[0],
          previous_reading: startingUnits,
          current_reading: startingUnits,
          rate_per_unit_paise: ratePaise,
          is_meter_reset: true,
          reset_note: `Opening baseline reading (${startingUnits} kWh) for Bed ${bedLabel || 'Room'}`,
          period_month: today.getMonth() + 1,
          period_year: today.getFullYear(),
          notes: `Initial opening baseline reading: ${startingUnits} kWh`,
          recorded_by: validUserId,
        })
      }
    }

    // 6. Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: existingMeter ? 'update' : 'create',
      entity_type: 'electricity_meter',
      entity_id: meterId,
      entity_label: `Meter ${cleanMeterNumber}${bedLabel ? ` (Bed ${bedLabel})` : ''}`,
    })

    return NextResponse.json({ success: true, meter_id: meterId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to register meter' }, { status: 500 })
  }
}
