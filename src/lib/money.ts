/**
 * Money utilities for PG-SETU
 * All amounts stored in PAISE (integer). ₹1 = 100 paise.
 * NEVER use floating point for money calculations.
 */

/**
 * Convert rupees to paise (for storage)
 */
export function rupeesToPaise(rupees: number): number {
  if (rupees === 0) return 0
  if (!rupees || isNaN(rupees)) return 0
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees (for display)
 */
export function paiseToRupees(paise: number): number {
  if (paise === 0) return 0
  if (!paise || isNaN(paise)) return 0
  return paise / 100
}

/**
 * Format paise as Indian Rupee string
 * e.g., 500000 paise → "₹5,000"
 */
export function formatCurrency(paise: number, showDecimal = false): string {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0'
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
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0'
  const isNegative = paise < 0
  const absPaise = Math.abs(paise)
  const rupees = absPaise / 100
  const prefix = isNegative ? '-₹' : '₹'

  if (rupees >= 10000000) {
    const val = (rupees / 10000000).toFixed(1).replace(/\.0$/, '')
    return `${prefix}${val}Cr`
  }
  if (rupees >= 100000) {
    const val = (rupees / 100000).toFixed(1).replace(/\.0$/, '')
    return `${prefix}${val}L`
  }
  if (rupees >= 1000) {
    const val = (rupees / 1000).toFixed(1).replace(/\.0$/, '')
    return `${prefix}${val}K`
  }
  return formatCurrency(paise)
}

/**
 * Safe add for paise amounts
 */
export function addPaise(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + Math.round(a || 0), 0)
}

/**
 * Safe multiply: (paise amount) * (factor) → paise
 */
export function multiplyPaise(paise: number, factor: number): number {
  if (!paise || isNaN(paise) || !factor || isNaN(factor)) return 0
  return Math.round(paise * factor)
}

/**
 * Calculate percentage
 */
export function percentage(part: number, total: number): number {
  if (!total || total <= 0 || isNaN(total) || isNaN(part)) return 0
  return Math.round(((part || 0) / total) * 100 * 10) / 10 // 1 decimal place
}

/**
 * Calculate prorated rent in paise
 */
export function calculateProration(
  monthlyRentPaise: number,
  daysOccupied: number,
  daysInMonth: number
): number {
  if (!daysInMonth || daysInMonth <= 0 || isNaN(daysInMonth)) return 0
  if (!daysOccupied || daysOccupied <= 0 || isNaN(daysOccupied)) return 0
  if (daysOccupied >= daysInMonth) return Math.round(monthlyRentPaise || 0)
  return Math.round(((monthlyRentPaise || 0) / daysInMonth) * daysOccupied)
}

/**
 * Parse a string input to paise (handles "5000", "5,000", "5000.50")
 */
export function parseInputToPaise(input: string): number {
  if (!input || typeof input !== 'string') return 0
  const cleaned = input.replace(/[,₹\s]/g, '')
  const rupees = parseFloat(cleaned)
  if (isNaN(rupees)) return 0
  return Math.round(rupees * 100)
}

/**
 * Format paise for input field (as rupees string without symbol)
 */
export function paiseToInputString(paise: number): string {
  if (paise === 0) return '0.00'
  if (!paise || isNaN(paise)) return '0.00'
  return (paise / 100).toFixed(2)
}
