/**
 * Electricity Sub-Meter & Bed-Wise Management Helpers
 * Supports per-bed sub-metering, onboarding baselines, and differential unit calculations.
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
