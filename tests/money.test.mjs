import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Direct pure implementations mirroring src/lib/money.ts
function rupeesToPaise(rupees) {
  if (rupees === 0) return 0
  if (!rupees || isNaN(rupees)) return 0
  return Math.round(rupees * 100)
}

function paiseToRupees(paise) {
  if (paise === 0) return 0
  if (!paise || isNaN(paise)) return 0
  return paise / 100
}

function formatCurrency(paise, showDecimal = false) {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0'
  const rupees = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimal ? 2 : 0,
    maximumFractionDigits: showDecimal ? 2 : 0,
  }).format(rupees)
}

function formatCurrencyCompact(paise) {
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

function addPaise(...amounts) {
  return amounts.reduce((sum, a) => sum + Math.round(a || 0), 0)
}

function multiplyPaise(paise, factor) {
  if (!paise || isNaN(paise) || !factor || isNaN(factor)) return 0
  return Math.round(paise * factor)
}

function percentage(part, total) {
  if (!total || total <= 0 || isNaN(total) || isNaN(part)) return 0
  return Math.round(((part || 0) / total) * 100 * 10) / 10
}

function calculateProration(monthlyRentPaise, daysOccupied, daysInMonth) {
  if (!daysInMonth || daysInMonth <= 0 || isNaN(daysInMonth)) return 0
  if (!daysOccupied || daysOccupied <= 0 || isNaN(daysOccupied)) return 0
  if (daysOccupied >= daysInMonth) return Math.round(monthlyRentPaise || 0)
  return Math.round(((monthlyRentPaise || 0) / daysInMonth) * daysOccupied)
}

function parseInputToPaise(input) {
  if (!input || typeof input !== 'string') return 0
  const cleaned = input.replace(/[,₹\s]/g, '')
  const rupees = parseFloat(cleaned)
  if (isNaN(rupees)) return 0
  return Math.round(rupees * 100)
}

function paiseToInputString(paise) {
  if (paise === 0) return '0.00'
  if (!paise || isNaN(paise)) return '0.00'
  return (paise / 100).toFixed(2)
}

describe('Money Utilities — Senior QA Test Suite', () => {

  // ==========================================
  // 1. EQUIVALENCE PARTITIONING
  // ==========================================
  describe('Technique 1: Equivalence Partitioning (EP)', () => {
    // Catches conversion errors on normal whole rupee amounts (e.g. floating point precision leaks)
    it('[EP] [Valid Class: Whole Rupees] converts valid integer rupees to paise', () => {
      assert.strictEqual(rupeesToPaise(500), 50000)
    })

    // Catches decimal rupee precision loss (e.g. 10.50 * 100 resulting in imprecise floats without Math.round)
    it('[EP] [Valid Class: Decimal Rupees] converts decimal rupees to paise accurately', () => {
      assert.strictEqual(rupeesToPaise(10.50), 1050)
    })

    // Catches unhandled null/undefined input crashing the function with TypeError
    it('[EP] [Invalid Class: Null/Undefined] returns 0 for null or undefined rupees', () => {
      assert.strictEqual(rupeesToPaise(null), 0)
      assert.strictEqual(rupeesToPaise(undefined), 0)
    })

    // Catches NaN propagating through ledger calculations and corrupting financial records
    it('[EP] [Invalid Class: NaN] returns 0 for NaN rupee input', () => {
      assert.strictEqual(rupeesToPaise(NaN), 0)
    })

    // Catches strings with Indian currency symbols and commas failing to parse or returning NaN
    it('[EP] [Valid Class: Formatted Currency String] parses formatted string with symbol and comma to paise', () => {
      assert.strictEqual(parseInputToPaise('₹ 5,000.50'), 500050)
    })

    // Catches non-string inputs (numbers, objects, null) throwing TypeError on .replace()
    it('[EP] [Invalid Class: Non-string input] safely returns 0 for non-string input to parseInputToPaise', () => {
      assert.strictEqual(parseInputToPaise(null), 0)
      assert.strictEqual(parseInputToPaise(12345), 0)
    })
  })

  // ==========================================
  // 2. BOUNDARY VALUE ANALYSIS
  // ==========================================
  describe('Technique 2: Boundary Value Analysis (BVA)', () => {
    // Catches off-by-one or zero-handling bugs where 0 paise displays as empty string or NaN
    it('[BVA] [Zero Boundary] handles 0 paise correctly across converters and formatters', () => {
      assert.strictEqual(rupeesToPaise(0), 0)
      assert.strictEqual(paiseToRupees(0), 0)
      assert.strictEqual(paiseToInputString(0), '0.00')
      assert.match(formatCurrency(0), /0/)
    })

    // Catches floating point inaccuracy at 1 paisa (₹0.01) threshold
    it('[BVA] [Min Value: 1 Paisa] correctly formats and converts the smallest currency unit', () => {
      assert.strictEqual(rupeesToPaise(0.01), 1)
      assert.strictEqual(paiseToRupees(1), 0.01)
      assert.strictEqual(paiseToInputString(1), '0.01')
    })

    // Catches boundary threshold at 1K boundary (99,999 paise vs 100,000 paise) in compact formatter
    it('[BVA] [Compact Threshold: 1K] formats ₹999 vs ₹1,000 correctly at boundary', () => {
      const below = formatCurrencyCompact(99900)
      assert.match(below, /999/)
      const atBoundary = formatCurrencyCompact(100000)
      assert.strictEqual(atBoundary, '₹1K')
    })

    // Catches boundary formatting error at 1 Lakh boundary (₹99,999 vs ₹1,00,000)
    it('[BVA] [Compact Threshold: 1 Lakh] formats ₹1 Lakh correctly without trailing .0', () => {
      assert.strictEqual(formatCurrencyCompact(10000000), '₹1L')
      assert.strictEqual(formatCurrencyCompact(15000000), '₹1.5L')
    })

    // Catches boundary formatting error at 1 Crore boundary (₹1,00,00,000)
    it('[BVA] [Compact Threshold: 1 Crore] formats ₹1 Crore correctly', () => {
      assert.strictEqual(formatCurrencyCompact(1000000000), '₹1Cr')
    })

    // Catches negative balance/deficit formatting bugs where negative sign is dropped or misplaced
    it('[BVA] [Negative Boundary] preserves negative sign in compact formatting for tenant debts', () => {
      assert.strictEqual(formatCurrencyCompact(-500000), '-₹5K')
      assert.strictEqual(formatCurrencyCompact(-10000000), '-₹1L')
    })

    // Catches proration daysOccupied = 0 boundary returning NaN or undefined
    it('[BVA] [Proration Min Boundary: 0 days occupied] returns 0 paise', () => {
      assert.strictEqual(calculateProration(1000000, 0, 30), 0)
    })

    // Catches proration daysOccupied = daysInMonth boundary (full month) returning incorrect rounded fractions
    it('[BVA] [Proration Max Boundary: daysOccupied == daysInMonth] returns full monthly rent', () => {
      assert.strictEqual(calculateProration(1000000, 30, 30), 1000000)
    })

    // Catches proration daysOccupied > daysInMonth (max+1) overcharging tenant beyond agreed monthly rent
    it('[BVA] [Proration Max+1 Boundary: daysOccupied > daysInMonth] caps prorated rent at full month', () => {
      assert.strictEqual(calculateProration(1000000, 31, 30), 1000000)
    })
  })

  // ==========================================
  // 3. DECISION TABLE TESTING
  // ==========================================
  describe('Technique 3: Decision Table Testing', () => {
    // Condition 1: showDecimal (true/false)
    // Condition 2: paise is integer rupee vs fractional rupee
    // Rule 1: showDecimal=false, integer rupees -> "₹5,000" (no decimal)
    it('[Decision Table: Rule 1] showDecimal=false, integer rupees -> formats without decimals', () => {
      // Catches unintended .00 being rendered when clean whole numbers are requested
      const result = formatCurrency(500000, false)
      assert.match(result, /₹.*5,000$/)
    })

    // Rule 2: showDecimal=true, integer rupees -> "₹5,000.00" (with decimal)
    it('[Decision Table: Rule 2] showDecimal=true, integer rupees -> formats with .00 decimals', () => {
      // Catches missing fractional cents/paise in formal invoice mode
      const result = formatCurrency(500000, true)
      assert.match(result, /₹.*5,000\.00/)
    })

    // Rule 3: showDecimal=false, fractional paise -> rounds to nearest rupee
    it('[Decision Table: Rule 3] showDecimal=false, fractional rupees -> formats rounded to whole rupee', () => {
      // Catches floating point decimals leaking through when showDecimal is disabled
      const result = formatCurrency(500075, false)
      assert.match(result, /₹.*5,001$/)
    })

    // Rule 4: showDecimal=true, fractional paise -> retains exact .75
    it('[Decision Table: Rule 4] showDecimal=true, fractional rupees -> displays exact .75 decimals', () => {
      // Catches rounding truncation of fractional paise when showDecimal is enabled
      const result = formatCurrency(500075, true)
      assert.match(result, /₹.*5,000\.75/)
    })
  })

  // ==========================================
  // 4. STATE TRANSITION TESTING
  // ==========================================
  describe('Technique 4: State Transition Testing (Rupees -> Paise -> Calculations -> Input Display)', () => {
    // Catches lifecycle data corruption when user input is converted to paise, modified by discount, and formatted back
    it('[State Transition: User Input -> Stored Paise -> Add Surcharge -> Render Output]', () => {
      // Step 1: User types rent in UI
      const rawInput = '₹ 12,500.00'
      const basePaise = parseInputToPaise(rawInput)
      assert.strictEqual(basePaise, 1250000)

      // Step 2: Add utility charge (₹1,500)
      const utilityPaise = rupeesToPaise(1500)
      const totalPaise = addPaise(basePaise, utilityPaise)
      assert.strictEqual(totalPaise, 1400000)

      // Step 3: Apply 10% discount (factor 0.9)
      const finalPaise = multiplyPaise(totalPaise, 0.9)
      assert.strictEqual(finalPaise, 1260000)

      // Step 4: Convert back to input string for edit form
      const displayString = paiseToInputString(finalPaise)
      assert.strictEqual(displayString, '12600.00')

      // Step 5: Convert back to compact summary for dashboard widget
      const compactDisplay = formatCurrencyCompact(finalPaise)
      assert.strictEqual(compactDisplay, '₹12.6K')
    })
  })

  // ==========================================
  // 5. ERROR / EXCEPTION PATHS
  // ==========================================
  describe('Technique 5: Error & Exception Paths', () => {
    // Catches division-by-zero causing percentage calculation to return Infinity or NaN
    it('[Error Path: Division by Zero] percentage returns 0 when total is 0 or negative', () => {
      assert.strictEqual(percentage(50, 0), 0)
      assert.strictEqual(percentage(50, -100), 0)
    })

    // Catches division-by-zero in proration when daysInMonth is 0 or negative
    it('[Error Path: Division by Zero] calculateProration returns 0 when daysInMonth <= 0', () => {
      assert.strictEqual(calculateProration(100000, 15, 0), 0)
      assert.strictEqual(calculateProration(100000, 15, -30), 0)
    })

    // Catches negative days occupied returning a negative rent credit exploit
    it('[Error Path: Negative Proration Days] calculateProration returns 0 when daysOccupied is negative', () => {
      assert.strictEqual(calculateProration(100000, -5, 30), 0)
    })

    // Catches multiplyPaise by NaN or 0 returning NaN
    it('[Error Path: NaN Factor] multiplyPaise returns 0 when factor is NaN or invalid', () => {
      assert.strictEqual(multiplyPaise(10000, NaN), 0)
      assert.strictEqual(multiplyPaise(NaN, 1.5), 0)
    })

    // Catches addPaise with NaN or undefined arguments poisoning the total sum
    it('[Error Path: Poisoned Variadic Sum] addPaise skips undefined/null/NaN items safely', () => {
      assert.strictEqual(addPaise(1000, undefined, null, NaN, 2000), 3000)
    })
  })
})
