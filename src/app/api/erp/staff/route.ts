import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'
import { queryCollection, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore'

export interface StaffMember {
  id: string
  organization_id?: string
  name: string
  role: 'Warden' | 'Cook' | 'Security Guard' | 'Housekeeping' | 'Maintenance Tech' | 'Manager / Supervisor'
  phone: string
  shift: 'Morning (6 AM - 2 PM)' | 'General (9 AM - 6 PM)' | 'Night (10 PM - 6 AM)'
  monthlySalaryPaise: number
  advanceTakenPaise: number
  overtimeHours: number
  status: 'active' | 'on_leave'
  notes?: string
  created_at?: string
  updated_at?: string
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_staff_members__: StaffMember[] | undefined
}

if (!global.__pgsetu_staff_members__) {
  global.__pgsetu_staff_members__ = []
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const orgId = user ? await resolveEffectiveOrgId(user) : null

    let staffList: StaffMember[] = []

    // 1. Try fetching from Firestore by organization_id
    if (orgId) {
      try {
        const firestoreDocs = await queryCollection<StaffMember>('staff_members', [
          { field: 'organization_id', operator: '==', value: orgId },
        ])
        if (firestoreDocs && firestoreDocs.length > 0) {
          staffList = firestoreDocs
        }
      } catch (fErr) {
        console.warn('[Staff API] Firestore fetch warning:', fErr)
      }
    }

    // 2. Fallback to memory if Firestore returned nothing or wasn't available
    if (staffList.length === 0) {
      const allMem = global.__pgsetu_staff_members__ || []
      staffList = orgId ? allMem.filter((s) => !s.organization_id || s.organization_id === orgId) : allMem
    }

    const calculatedPayroll = staffList.map((s) => {
      const baseSalaryRupees = (s.monthlySalaryPaise || 0) / 100
      const advanceRupees = (s.advanceTakenPaise || 0) / 100
      const overtimePayRupees = (s.overtimeHours || 0) * 150
      const pfDeductionRupees = Math.round(baseSalaryRupees * 0.12)
      const netPayableRupees = Math.max(0, baseSalaryRupees + overtimePayRupees - advanceRupees - pfDeductionRupees)

      return {
        ...s,
        baseSalaryRupees,
        advanceRupees,
        overtimePayRupees,
        pfDeductionRupees,
        netPayableRupees,
      }
    })

    const totalMonthlyPayrollPaise = calculatedPayroll.reduce((acc, s) => acc + s.netPayableRupees * 100, 0)

    return NextResponse.json({
      success: true,
      staff: calculatedPayroll,
      summary: {
        totalStaff: staffList.length,
        activeOnDuty: staffList.filter((s) => s.status === 'active').length,
        onLeave: staffList.filter((s) => s.status === 'on_leave').length,
        totalMonthlyPayrollPaise,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Staff query failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const orgId = user ? await resolveEffectiveOrgId(user) : null

    const body = await request.json()
    const { action = 'create', id, name, role, phone, shift, salaryRupees, advanceRupees, overtimeHours, notes } = body

    const allMem = global.__pgsetu_staff_members__ || []

    if (action === 'create') {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Staff name is required.' }, { status: 400 })
      }

      const newStaff: StaffMember = {
        id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        organization_id: orgId || undefined,
        name: name.trim(),
        role: role || 'Housekeeping',
        phone: phone ? phone.replace(/\D/g, '').slice(-10) : '',
        shift: shift || 'General (9 AM - 6 PM)',
        monthlySalaryPaise: Number(salaryRupees || 18000) * 100,
        advanceTakenPaise: 0,
        overtimeHours: 0,
        status: 'active',
        notes: notes?.trim() || '',
        created_at: new Date().toISOString(),
      }

      // Save in Firestore
      try {
        await createDocument('staff_members', newStaff, newStaff.id)
      } catch (fErr) {
        console.warn('[Staff API] Firestore create warning:', fErr)
      }

      // Save in memory
      allMem.unshift(newStaff)
      global.__pgsetu_staff_members__ = allMem

      return NextResponse.json({ success: true, staff: newStaff })
    }

    if (action === 'advance') {
      if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
      const advancePaise = Number(advanceRupees || 0) * 100

      const staffMem = allMem.find((s) => s.id === id)
      if (staffMem) {
        staffMem.advanceTakenPaise = (staffMem.advanceTakenPaise || 0) + advancePaise
      }

      try {
        await updateDocument('staff_members', id, {
          advanceTakenPaise: (staffMem?.advanceTakenPaise || 0),
        })
      } catch (fErr) {
        console.warn('[Staff API] Firestore update warning:', fErr)
      }

      return NextResponse.json({ success: true, staff: staffMem })
    }

    if (action === 'overtime') {
      if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
      const hours = Number(overtimeHours || 0)

      const staffMem = allMem.find((s) => s.id === id)
      if (staffMem) {
        staffMem.overtimeHours = (staffMem.overtimeHours || 0) + hours
      }

      try {
        await updateDocument('staff_members', id, {
          overtimeHours: (staffMem?.overtimeHours || 0),
        })
      } catch (fErr) {
        console.warn('[Staff API] Firestore update warning:', fErr)
      }

      return NextResponse.json({ success: true, staff: staffMem })
    }

    if (action === 'toggle_status') {
      if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })

      const staffMem = allMem.find((s) => s.id === id)
      if (staffMem) {
        staffMem.status = staffMem.status === 'active' ? 'on_leave' : 'active'
      }

      try {
        if (staffMem) {
          await updateDocument('staff_members', id, { status: staffMem.status })
        }
      } catch (fErr) {
        console.warn('[Staff API] Firestore update warning:', fErr)
      }

      return NextResponse.json({ success: true, staff: staffMem })
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })

      global.__pgsetu_staff_members__ = allMem.filter((s) => s.id !== id)

      try {
        await deleteDocument('staff_members', id)
      } catch (fErr) {
        console.warn('[Staff API] Firestore delete warning:', fErr)
      }

      return NextResponse.json({ success: true, message: 'Staff member removed.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Staff operation failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })

    const allMem = global.__pgsetu_staff_members__ || []
    global.__pgsetu_staff_members__ = allMem.filter((s) => s.id !== id)

    try {
      await deleteDocument('staff_members', id)
    } catch (fErr) {
      console.warn('[Staff API] Firestore delete warning:', fErr)
    }

    return NextResponse.json({ success: true, message: 'Staff member removed.' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Staff delete failed' }, { status: 500 })
  }
}
