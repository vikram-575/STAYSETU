/**
 * Pure formatting and normalization utilities for KYC and Identity documents
 */

/**
 * Normalizes any incoming date of birth string to strict Postgres ISO format: YYYY-MM-DD
 */
export function normalizeDobToIso(dob?: string | null): string | null {
  if (!dob) return null
  const clean = dob.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  const dmy = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmy) {
    const day = dmy[1].padStart(2, '0')
    const month = dmy[2].padStart(2, '0')
    const year = dmy[3]
    return `${year}-${month}-${day}`
  }
  if (/^\d{4}$/.test(clean)) {
    return `${clean}-01-01`
  }
  const parsed = new Date(clean)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return null
}

/**
 * Formats raw 12 digits or unmasked number to UIDAI standard format: "XXXX XXXX 1234"
 */
export function formatMaskedAadhaar(raw?: string | null): string {
  if (!raw) return 'XXXX XXXX XXXX'
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 4) {
    const last4 = digits.slice(-4)
    return `XXXX XXXX ${last4}`
  }
  return raw
}
