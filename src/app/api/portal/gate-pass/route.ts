import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

// In-memory / persistent gate pass store
interface GatePass {
  id: string
  passNumber: string
  pinCode: string
  residentName: string
  residentPhone: string
  roomNumber: string
  guestName: string
  guestPhone: string
  guestCount: number
  purpose: string
  vehicleNumber?: string
  expectedArrival: string
  validUntil: string
  status: 'approved' | 'checked_in' | 'expired' | 'cancelled'
  checkedInAt?: string
  createdAt: string
}

// Module-level mock store with persistent seed data
declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_gatepasses__: GatePass[] | undefined
}

if (!global.__pgsetu_gatepasses__) {
  global.__pgsetu_gatepasses__ = [
    {
      id: 'gp_demo_01',
      passNumber: 'GP-84920',
      pinCode: '4920',
      residentName: 'Arjun Verma',
      residentPhone: '9876543210',
      roomNumber: '204-B',
      guestName: 'Rohit Sharma',
      guestPhone: '9811223344',
      guestCount: 1,
      purpose: 'Friend Visiting / Study Session',
      vehicleNumber: 'KA-01-MJ-4592',
      expectedArrival: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'approved',
      createdAt: new Date().toISOString(),
    },
  ]
}

/**
 * GET /api/portal/gate-pass?pass_id=...
 * Fetch gate passes for current resident, or check single pass for guard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const passId = searchParams.get('pass_id')
    const passes = global.__pgsetu_gatepasses__ || []

    if (passId) {
      const found = passes.find((p) => p.id === passId || p.passNumber === passId || p.pinCode === passId)
      if (!found) {
        return NextResponse.json({ error: 'Gate pass not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, pass: found })
    }

    return NextResponse.json({ success: true, passes })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch gate pass' }, { status: 500 })
  }
}

/**
 * POST /api/portal/gate-pass
 * Create a new gate pass or mark check-in
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'create', passId, guestName, guestPhone, guestCount, purpose, vehicleNumber, expectedArrival } = body
    const passes = global.__pgsetu_gatepasses__ || []

    if (action === 'check_in') {
      const pass = passes.find((p) => p.id === passId || p.passNumber === passId || p.pinCode === passId)
      if (!pass) return NextResponse.json({ error: 'Gate pass not found' }, { status: 404 })

      pass.status = 'checked_in'
      pass.checkedInAt = new Date().toISOString()
      return NextResponse.json({ success: true, pass })
    }

    if (action === 'cancel') {
      const pass = passes.find((p) => p.id === passId)
      if (pass) pass.status = 'cancelled'
      return NextResponse.json({ success: true, pass })
    }

    // Create New Gate Pass
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString()
    const newId = `gp_${Date.now()}`
    const passNumber = `GP-${randomPin}${Math.floor(10 + Math.random() * 90)}`

    const newPass: GatePass = {
      id: newId,
      passNumber,
      pinCode: randomPin,
      residentName: body.residentName || 'Resident',
      residentPhone: body.residentPhone || '9876543210',
      roomNumber: body.roomNumber || '101-A',
      guestName: guestName || 'Guest Visitor',
      guestPhone: guestPhone || '',
      guestCount: Number(guestCount) || 1,
      purpose: purpose || 'General Visit',
      vehicleNumber: vehicleNumber || '',
      expectedArrival: expectedArrival || new Date().toISOString(),
      validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours validity
      status: 'approved',
      createdAt: new Date().toISOString(),
    }

    passes.unshift(newPass)
    return NextResponse.json({ success: true, pass: newPass })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process gate pass' }, { status: 500 })
  }
}
