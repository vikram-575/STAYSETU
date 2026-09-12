import { NextResponse, type NextRequest } from 'next/server'

interface PricingRule {
  id: string
  name: string
  ruleType: 'upfront_discount' | 'seasonal_surge' | 'occupancy_surge' | 'loyalty_discount'
  condition: string
  adjustmentType: 'percentage' | 'fixed_rupees'
  adjustmentValue: number // e.g. -5 for 5% off, +10 for 10% surge
  isActive: boolean
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_pricing_rules__: PricingRule[] | undefined
}

if (!global.__pgsetu_pricing_rules__) {
  global.__pgsetu_pricing_rules__ = [
    {
      id: 'pr_01',
      name: '6-Month Upfront Payment Discount',
      ruleType: 'upfront_discount',
      condition: 'Resident pays 6+ months advance rent in single transaction',
      adjustmentType: 'percentage',
      adjustmentValue: -5, // 5% discount
      isActive: true,
    },
    {
      id: 'pr_02',
      name: 'College Intake Peak Season Surge (July - August)',
      ruleType: 'seasonal_surge',
      condition: 'New admissions during college academic intake rush',
      adjustmentType: 'percentage',
      adjustmentValue: 8, // 8% surge
      isActive: true,
    },
    {
      id: 'pr_03',
      name: 'High Occupancy Premium (>90% Occupancy)',
      ruleType: 'occupancy_surge',
      condition: 'Triggered when property occupancy exceeds 90%',
      adjustmentType: 'fixed_rupees',
      adjustmentValue: 500, // +₹500 per month
      isActive: true,
    },
    {
      id: 'pr_04',
      name: 'Annual Renewal Loyalty Rebate (1+ Year Stay)',
      ruleType: 'loyalty_discount',
      condition: 'Existing resident extending lease past 12 months',
      adjustmentType: 'fixed_rupees',
      adjustmentValue: -500, // -₹500 discount
      isActive: true,
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const rules = global.__pgsetu_pricing_rules__ || []

    return NextResponse.json({
      success: true,
      rules,
      summary: {
        totalRules: rules.length,
        activeRules: rules.filter((r) => r.isActive).length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Pricing rules query failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'evaluate', baseRentRupees = 10000, tenureMonths = 6, occupancyPercent = 92 } = body
    const rules = global.__pgsetu_pricing_rules__ || []

    if (action === 'toggle') {
      const rule = rules.find((r) => r.id === body.ruleId)
      if (rule) rule.isActive = !rule.isActive
      return NextResponse.json({ success: true, rule })
    }

    // Calculation Simulator
    let finalRentRupees = Number(baseRentRupees)
    const appliedDiscounts: any[] = []

    // Check upfront rule
    const upfrontRule = rules.find((r) => r.ruleType === 'upfront_discount' && r.isActive)
    if (upfrontRule && Number(tenureMonths) >= 6) {
      const discount = Math.round((finalRentRupees * Math.abs(upfrontRule.adjustmentValue)) / 100)
      finalRentRupees -= discount
      appliedDiscounts.push({ name: upfrontRule.name, discountRupees: discount })
    }

    // Check occupancy rule
    const occRule = rules.find((r) => r.ruleType === 'occupancy_surge' && r.isActive)
    if (occRule && Number(occupancyPercent) >= 90) {
      finalRentRupees += occRule.adjustmentValue
      appliedDiscounts.push({ name: occRule.name, surgeRupees: occRule.adjustmentValue })
    }

    return NextResponse.json({
      success: true,
      calculation: {
        baseRentRupees: Number(baseRentRupees),
        finalRentRupees,
        netDifference: finalRentRupees - Number(baseRentRupees),
        appliedDiscounts,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Pricing calculation failed' }, { status: 500 })
  }
}
