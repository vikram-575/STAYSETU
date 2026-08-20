/**
 * Money utilities for PG-SETU
 * All amounts stored in PAISE (integer). ₹1 = 100 paise.
 * NEVER use floating point for money calculations.
 */

/**
 * Convert rupees to paise (for storage)
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees (for display)
 */
export function paiseToRupees(paise: number): number {
  return paise / 100
}

/**
 * Format paise as Indian Rupee string
 * e.g., 500000 paise → "₹5,000"
 */
export function formatCurrency(paise: number, showDecimal = false): string {
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimal ? 2 : 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  }).format(rupees)
}

/**
 * Format paise as compact Indian Rupee string
 * e.g., 500000 paise → "₹5K"
 */
export function formatCurrencyCompact(paise: number): string {
  const rupees = paise / 100
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(1)}Cr`
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`
  return formatCurrency(paise)
}

/**
 * Safe add for paise amounts
 */
export function addPaise(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + Math.round(a), 0)
}

/**
 * Safe multiply: (paise amount) * (factor) → paise
 */
export function multiplyPaise(paise: number, factor: number): number {
  return Math.round(paise * factor)
}

/**
 * Calculate percentage
 */
export function percentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100 * 10) / 10 // 1 decimal place
}

/**
 * Calculate prorated rent in paise
 */
export function calculateProration(
  monthlyRentPaise: number,
  daysOccupied: number,
  daysInMonth: number
): number {
  if (daysOccupied >= daysInMonth) return monthlyRentPaise
  if (daysOccupied <= 0) return 0
  return Math.round((monthlyRentPaise / daysInMonth) * daysOccupied)
}

/**
 * Parse a string input to paise (handles "5000", "5,000", "5000.50")
 */
export function parseInputToPaise(input: string): number {
  const cleaned = input.replace(/[,₹\s]/g, '')
  const rupees = parseFloat(cleaned)
  if (isNaN(rupees)) return 0
  return Math.round(rupees * 100)
}

/**
 * Format paise for input field (as rupees string without symbol)
 */
export function paiseToInputString(paise: number): string {
  return (paise / 100).toFixed(2)
}
