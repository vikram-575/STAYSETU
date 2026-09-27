/**
 * Electricity Sub-Meter & Bed-Wise Management Helpers
 * Supports per-bed sub-metering, onboarding baselines, differential unit calculations,
 * and mid-month stay-adjusted pro-rata bill splitting.
 */

export interface MeterBedMetadata {
  bed_id?: string | null
  bed_label?: string | null
  resident_id?: string | null
  resident_name?: string | null
  resident_phone?: string | null
  room_number?: string | null
  custom_note?: string | null
}

export interface ParsedMeterNotes extends MeterBedMetadata {
  displayNote: string
  isBedMeter: boolean
}

export interface ResidentStayInfo {
  resident_id: string
  resident_name: string
  phone?: string
  bed_id?: string
  bed_label?: string
  check_in_date: string
  check_out_date?: string | null
}

export interface ProRataResidentAllocation {
  resident_id: string
  resident_name: string
  phone?: string
  bed_id?: string
  bed_label?: string
  check_in_date: string
  check_out_date?: string | null
  active_days: number
  total_days_in_month: number
  percentage: number // e.g. 75.0
  day_weight: number // e.g. 22.5
  allocated_units: number
  allocated_paise: number
  allocated_rupees: number
  explanation: string
}

export interface ProRataCalculationResult {
  allocations: ProRataResidentAllocation[]
  totalPaise: number
  totalUnits: number
  ratePerUnitPaise: number
  daysInMonth: number
  periodMonth: number
  periodYear: number
  hasMidMonthMovement: boolean
  soloDaysCount: number
  sharedDaysCount: number
  summaryExplanation: string
}

/**
 * Safely parses meter notes which may contain JSON-encoded bed metadata or raw legacy text
 */
export function parseMeterNotes(rawNotes: string | null | undefined): ParsedMeterNotes {
  if (!rawNotes) {
    return {
      bed_id: null,
      bed_label: null,
      resident_id: null,
      resident_name: null,
      resident_phone: null,
      room_number: null,
      custom_note: null,
      displayNote: '',
      isBedMeter: false,
    }
  }

  const trimmed = rawNotes.trim()

  // 1. Try parsing JSON object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      return {
        bed_id: parsed.bed_id || null,
        bed_label: parsed.bed_label || null,
        resident_id: parsed.resident_id || null,
        resident_name: parsed.resident_name || null,
        resident_phone: parsed.resident_phone || null,
        room_number: parsed.room_number || null,
        custom_note: parsed.custom_note || parsed.note || null,
        displayNote: parsed.custom_note || parsed.note || '',
        isBedMeter: Boolean(parsed.bed_id || parsed.bed_label),
      }
    } catch {
      // Fall through if invalid JSON
    }
  }

  // 2. Check for legacy regex tag: [BED:bed_id:bed_label]
  const bedRegex = /\[BED:([^:\]]+)(?::([^\]]+))?\]/i
  const bedMatch = trimmed.match(bedRegex)
  if (bedMatch) {
    const bedId = bedMatch[1]
    const bedLabel = bedMatch[2] || null
    const displayNote = trimmed.replace(bedRegex, '').trim()
    return {
      bed_id: bedId,
      bed_label: bedLabel,
      resident_id: null,
      resident_name: null,
      resident_phone: null,
      room_number: null,
      custom_note: displayNote || null,
      displayNote,
      isBedMeter: true,
    }
  }

  // 3. Raw note without bed metadata
  return {
    bed_id: null,
    bed_label: null,
    resident_id: null,
    resident_name: null,
    resident_phone: null,
    room_number: null,
    custom_note: trimmed,
    displayNote: trimmed,
    isBedMeter: false,
  }
}

/**
 * Formats bed and resident metadata into a structured note string
 */
export function formatMeterNotes(data: MeterBedMetadata): string {
  const hasBedInfo = Boolean(data.bed_id || data.bed_label || data.resident_id)
  if (!hasBedInfo) {
    return data.custom_note || ''
  }

  return JSON.stringify({
    bed_id: data.bed_id || null,
    bed_label: data.bed_label || null,
    resident_id: data.resident_id || null,
    resident_name: data.resident_name || null,
    resident_phone: data.resident_phone || null,
    room_number: data.room_number || null,
    note: data.custom_note || '',
  })
}

/**
 * Generates a clean standard identifier for a bed meter (e.g. MTR-101-A)
 */
export function generateBedMeterNumber(roomNumber: string | number, bedLabel: string): string {
  const cleanRoom = String(roomNumber || '').trim().replace(/[^a-zA-Z0-9]/g, '')
  const cleanBed = String(bedLabel || '').trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '')
  return `MTR-${cleanRoom || 'RM'}-${cleanBed || 'A'}`
}

/**
 * Calculates differential units consumed
 */
export function calculateDifferentialUnits(
  currentReading: number,
  previousReading: number,
  isMeterReset: boolean = false
): number {
  if (isMeterReset) {
    return Math.max(0, currentReading)
  }
  return Math.max(0, Math.round((currentReading - previousReading) * 100) / 100)
}

/**
 * Calculates Stay-Adjusted Pro-Rata Electricity Bill Split
 * Handles mid-month move-ins, move-outs, and staggered room stays:
 * - Days with only 1 resident: charged 100% to that resident alone.
 * - Days with multiple residents: divided equally among all active residents on those days.
 */
export function calculateProRataElectricitySplit(params: {
  totalUnits: number
  ratePerUnitPaise: number
  periodMonth: number // 1-12
  periodYear: number // e.g. 2026
  residents: ResidentStayInfo[]
}): ProRataCalculationResult {
  const { totalUnits, ratePerUnitPaise, periodMonth, periodYear, residents } = params

  const totalPaise = Math.round(totalUnits * ratePerUnitPaise)
  const daysInMonth = new Date(periodYear, periodMonth, 0).getDate()

  if (!residents || residents.length === 0) {
    return {
      allocations: [],
      totalPaise,
      totalUnits,
      ratePerUnitPaise,
      daysInMonth,
      periodMonth,
      periodYear,
      hasMidMonthMovement: false,
      soloDaysCount: 0,
      sharedDaysCount: 0,
      summaryExplanation: 'No active residents found in room for this billing period.',
    }
  }

  // If only 1 resident in the room, 100% goes to them
  if (residents.length === 1) {
    const single = residents[0]
    return {
      allocations: [
        {
          resident_id: single.resident_id,
          resident_name: single.resident_name,
          phone: single.phone,
          bed_id: single.bed_id,
          bed_label: single.bed_label,
          check_in_date: single.check_in_date,
          check_out_date: single.check_out_date,
          active_days: daysInMonth,
          total_days_in_month: daysInMonth,
          percentage: 100,
          day_weight: daysInMonth,
          allocated_units: totalUnits,
          allocated_paise: totalPaise,
          allocated_rupees: totalPaise / 100,
          explanation: 'Sole occupant of room: 100% room electricity billed directly.',
        },
      ],
      totalPaise,
      totalUnits,
      ratePerUnitPaise,
      daysInMonth,
      periodMonth,
      periodYear,
      hasMidMonthMovement: false,
      soloDaysCount: daysInMonth,
      sharedDaysCount: 0,
      summaryExplanation: `${single.resident_name} is the sole occupant (100% allocated).`,
    }
  }

  // Daily Occupancy Simulation over the entire month
  const residentWeights: Record<string, number> = {}
  const residentActiveDays: Record<string, number> = {}
  residents.forEach((r) => {
    residentWeights[r.resident_id] = 0
    residentActiveDays[r.resident_id] = 0
  })

  let soloDaysCount = 0
  let sharedDaysCount = 0
  let totalActiveRoomDays = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${periodYear}-${String(periodMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const activeResidents = residents.filter((r) => {
      const inDate = r.check_in_date ? r.check_in_date.split('T')[0] : '1970-01-01'
      const outDate = r.check_out_date ? r.check_out_date.split('T')[0] : '9999-12-31'
      return inDate <= dayStr && dayStr <= outDate
    })

    if (activeResidents.length > 0) {
      totalActiveRoomDays++
      if (activeResidents.length === 1) {
        soloDaysCount++
      } else {
        sharedDaysCount++
      }

      // Split this single day's cost equally among occupants active on this day
      const dailyFraction = 1 / activeResidents.length
      activeResidents.forEach((r) => {
        residentWeights[r.resident_id] += dailyFraction
        residentActiveDays[r.resident_id] += 1
      })
    }
  }

  // Check if any resident joined mid-month or left mid-month
  const hasMidMonthMovement = residents.some((r) => residentActiveDays[r.resident_id] < daysInMonth)

  // Calculate allocations based on residentWeights
  let allocatedPaiseSum = 0
  const allocations: ProRataResidentAllocation[] = residents.map((r) => {
    const weight = residentWeights[r.resident_id] || 0
    const activeDays = residentActiveDays[r.resident_id] || 0
    const fraction = totalActiveRoomDays > 0 ? weight / totalActiveRoomDays : 0
    const percentage = Math.round(fraction * 1000) / 10
    const allocatedUnits = Math.round(totalUnits * fraction * 100) / 100
    const residentPaise = Math.round(totalPaise * fraction)
    allocatedPaiseSum += residentPaise

    let explanation = ''
    if (!hasMidMonthMovement) {
      explanation = `Active full month (${activeDays} days) · Equal room split (${percentage}%)`
    } else if (activeDays === daysInMonth) {
      explanation = `Active full month (${activeDays} days) · Covers solo period (100%) + half of shared period (${percentage}%)`
    } else {
      explanation = `Mid-month resident (${activeDays} days active, checked in ${r.check_in_date}) · Covers half of shared period (${percentage}%)`
    }

    return {
      resident_id: r.resident_id,
      resident_name: r.resident_name,
      phone: r.phone,
      bed_id: r.bed_id,
      bed_label: r.bed_label,
      check_in_date: r.check_in_date,
      check_out_date: r.check_out_date,
      active_days: activeDays,
      total_days_in_month: daysInMonth,
      percentage,
      day_weight: Math.round(weight * 10) / 10,
      allocated_units: allocatedUnits,
      allocated_paise: residentPaise,
      allocated_rupees: residentPaise / 100,
      explanation,
    }
  })

  // Distribute any small 1-paise rounding difference to the resident with the largest share
  if (allocations.length > 0 && allocatedPaiseSum !== totalPaise) {
    const diff = totalPaise - allocatedPaiseSum
    allocations.sort((a, b) => b.allocated_paise - a.allocated_paise)
    allocations[0].allocated_paise += diff
    allocations[0].allocated_rupees = allocations[0].allocated_paise / 100
  }

  // Summary human explanation
  let summaryExplanation = ''
  if (!hasMidMonthMovement) {
    summaryExplanation = `All ${residents.length} residents were active for the full month (${daysInMonth} days). Total electricity bill split equally.`
  } else {
    summaryExplanation = `Stay-adjusted pro-rata: ${soloDaysCount} day(s) with single occupant charged 100% to that occupant; ${sharedDaysCount} shared day(s) divided equally among active roommates.`
  }

  return {
    allocations,
    totalPaise,
    totalUnits,
    ratePerUnitPaise,
    daysInMonth,
    periodMonth,
    periodYear,
    hasMidMonthMovement,
    soloDaysCount,
    sharedDaysCount,
    summaryExplanation,
  }
}
