import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

interface VaultClosingRecord {
  id: string
  date: string
  shift: 'Morning Shift' | 'Evening Shift' | 'Night Shift'
  cashierName: string
  denominations: {
    d500: number
    d200: number
    d100: number
    d50: number
    d20: number
    d10: number
    coins: number
  }
  physicalTotalRupees: number
  expectedSystemRupees: number
  differenceRupees: number // 0 = balanced, +ve = surplus, -ve = deficit
  handoverNotes: string
  supervisorApproved: boolean
  createdAt: string
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_vault_closings__: VaultClosingRecord[] | undefined
}

if (!global.__pgsetu_vault_closings__) {
  global.__pgsetu_vault_closings__ = [
    {
      id: 'vc_01',
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning Shift',
      cashierName: 'Rameshwar Yadav (Warden)',
      denominations: { d500: 24, d200: 15, d100: 30, d50: 20, d20: 15, d10: 20, coins: 50 },
      physicalTotalRupees: 19550,
      expectedSystemRupees: 19550,
      differenceRupees: 0,
      handoverNotes: 'All cash verified against room deposit receipts #102, #104.',
      supervisorApproved: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const records = global.__pgsetu_vault_closings__ || []
    const expectedSystemCashRupees = 19550 // simulated expected today

    return NextResponse.json({
      success: true,
      records,
      expectedSystemCashRupees,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Vault query failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { denominations, cashierName, shift, handoverNotes, expectedRupees } = body
    const records = global.__pgsetu_vault_closings__ || []

    const d = denominations || { d500: 0, d200: 0, d100: 0, d50: 0, d20: 0, d10: 0, coins: 0 }
    const physicalTotal =
      (d.d500 || 0) * 500 +
      (d.d200 || 0) * 200 +
      (d.d100 || 0) * 100 +
      (d.d50 || 0) * 50 +
      (d.d20 || 0) * 20 +
      (d.d10 || 0) * 10 +
      (d.coins || 0)

    const expected = Number(expectedRupees) || 19550
    const difference = physicalTotal - expected

    const newClosing: VaultClosingRecord = {
      id: `vc_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      shift: shift || 'Evening Shift',
      cashierName: cashierName || 'Cashier',
      denominations: d,
      physicalTotalRupees: physicalTotal,
      expectedSystemRupees: expected,
      differenceRupees: difference,
      handoverNotes: handoverNotes || 'Shift closed successfully.',
      supervisorApproved: true,
      createdAt: new Date().toISOString(),
    }

    records.unshift(newClosing)
    return NextResponse.json({ success: true, record: newClosing })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Vault closing failed' }, { status: 500 })
  }
}
