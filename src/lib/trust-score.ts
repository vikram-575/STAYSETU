/**
 * PG-SETU Renter Trust Score Engine
 * Scale: 0 to 100 (Strictly out of 100, never out of 850)
 *
 * Rules:
 * 1. First-time / New user (< 1 month tenure or no stays): Strictly 0 / 100.
 * 2. On-time stay progression:
 *    - 1st completed month (>= 30 days active/completed with on-time payment): jumps directly to 50 / 100.
 *    - Every subsequent completed month (+30 days): +10 points (Month 2: 60, Month 3: 70, Month 4: 80, Month 5: 90, Month 6+: 100 max).
 * 3. Early checkout deductions:
 *    - Left within month 1 (< 30 days): decrease by 30.
 *    - Left after month 1 (30 - 59 days): decrease by 20.
 *    - Left after month 2 (60 - 89 days): decrease by 10.
 *    - Left after month 3 (>= 90 days): 0 decrease (no penalty).
 * 4. Outstanding overdue rent:
 *    - If total_outstanding_paise > 0: decrease by 20.
 * 5. Clamping:
 *    - Score is strictly clamped between 0 and 100.
 */

export interface StayRecord {
  id?: string
  property_name?: string
  room_number?: string | null
  bed_label?: string | null
  check_in_date?: string | null
  check_out_date?: string | null
  status?: 'active' | 'completed' | 'checked_out' | string
  monthly_rent_paise?: number
  deposit_held_paise?: number
  total_paid_paise?: number
  total_outstanding_paise?: number
}

export interface TrustScoreBreakdown {
  tenureDays: number
  completedMonths: number
  baseScore: number
  tenurePoints: number
  checkoutDeduction: number
  overdueDeduction: number
  rawScore: number
  finalScore: number
}

export interface TrustScoreResult {
  score: number // 0 to 100
  scoreFormatted: string // e.g. "0 / 100", "50 / 100"
  tier: string // e.g. "New Tenant", "Verified Resident", "Star Resident"
  onTimePaymentRate: string // e.g. "100%" or "N/A"
  breakdown: TrustScoreBreakdown
}

export function getRenterTier(score: number): string {
  if (score <= 0) return 'New Tenant'
  if (score < 50) return 'Building Trust'
  if (score < 70) return 'Verified Resident'
  if (score < 90) return 'Trusted Resident'
  return 'Star Resident'
}

/**
 * Calculates the PG-Setu Trust Score (0 - 100) for a resident based on their stay history.
 */
export function calculateTrustScore(
  stays: StayRecord[] = [],
  referenceDate: Date = new Date()
): TrustScoreResult {
  // Filter only real allotted stays (must have a room_number or check_in_date)
  const validStays = stays.filter(
    (s) => s && (s.room_number || s.check_in_date)
  )

  if (validStays.length === 0) {
    return {
      score: 0,
      scoreFormatted: '0 / 100',
      tier: 'New Tenant',
      onTimePaymentRate: 'N/A',
      breakdown: {
        tenureDays: 0,
        completedMonths: 0,
        baseScore: 0,
        tenurePoints: 0,
        checkoutDeduction: 0,
        overdueDeduction: 0,
        rawScore: 0,
        finalScore: 0,
      },
    }
  }

  let totalTenureDays = 0
  let totalCheckoutDeduction = 0
  let totalOutstandingPaise = 0

  const refTime = referenceDate.getTime()

  for (const stay of validStays) {
    totalOutstandingPaise += stay.total_outstanding_paise || 0

    if (!stay.check_in_date) continue
    const checkInTime = new Date(stay.check_in_date).getTime()
    if (isNaN(checkInTime)) continue

    let endTime = refTime
    const isCheckedOut = stay.status === 'completed' || stay.status === 'checked_out'

    if (isCheckedOut && stay.check_out_date) {
      const parsedCheckOut = new Date(stay.check_out_date).getTime()
      if (!isNaN(parsedCheckOut)) {
        endTime = parsedCheckOut
      }
    }

    const durationDays = Math.max(0, Math.floor((endTime - checkInTime) / (1000 * 60 * 60 * 24)))
    totalTenureDays += durationDays

    // Apply checkout penalties if the tenant has checked out early
    if (isCheckedOut) {
      if (durationDays < 30) {
        // Left within month 1
        totalCheckoutDeduction += 30
      } else if (durationDays < 60) {
        // Left after month 1 (30 - 59 days)
        totalCheckoutDeduction += 20
      } else if (durationDays < 90) {
        // Left after month 2 (60 - 89 days)
        totalCheckoutDeduction += 10
      }
      // Left after 3 months (>= 90 days): 0 decrease
    }
  }

  // Calculate completed 30-day months
  const completedMonths = Math.floor(totalTenureDays / 30)

  // Progression scoring:
  // - First-time / new user (< 1 month / < 30 days): 0 points
  // - 1 month completed: direct 50 points
  // - Every subsequent month: +10 points (Month 2: 60, Month 3: 70, Month 4: 80, Month 5: 90, Month 6+: 100)
  let tenurePoints = 0
  if (completedMonths >= 1) {
    tenurePoints = 50 + Math.max(0, completedMonths - 1) * 10
  }

  // Overdue rent penalty (-20 points if overdue balance exists)
  const overdueDeduction = totalOutstandingPaise > 0 ? 20 : 0

  // Raw score before clamping
  const rawScore = tenurePoints - totalCheckoutDeduction - overdueDeduction

  // Clamped between 0 and 100
  const finalScore = Math.min(100, Math.max(0, rawScore))

  const onTimePaymentRate =
    totalOutstandingPaise === 0
      ? '100%'
      : totalOutstandingPaise > 500000
        ? '70%'
        : '85%'

  return {
    score: finalScore,
    scoreFormatted: `${finalScore} / 100`,
    tier: getRenterTier(finalScore),
    onTimePaymentRate,
    breakdown: {
      tenureDays: totalTenureDays,
      completedMonths,
      baseScore: 0,
      tenurePoints,
      checkoutDeduction: totalCheckoutDeduction,
      overdueDeduction,
      rawScore,
      finalScore,
    },
  }
}
