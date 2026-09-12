import { NextResponse, type NextRequest } from 'next/server'

interface StaffMember {
  id: string
  name: string
  role: 'Warden' | 'Cook' | 'Security Guard' | 'Housekeeping' | 'Maintenance Tech'
  phone: string
  shift: 'Morning (6 AM - 2 PM)' | 'General (9 AM - 6 PM)' | 'Night (10 PM - 6 AM)'
  monthlySalaryPaise: number
  advanceTakenPaise: number
  overtimeHours: number
  status: 'active' | 'on_leave'
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_staff_members__: StaffMember[] | undefined
}

if (!global.__pgsetu_staff_members__) {
  global.__pgsetu_staff_members__ = [
    {
      id: 'st_01',
      name: 'Rameshwar Yadav',
      role: 'Warden',
      phone: '9845019283',
      shift: 'General (9 AM - 6 PM)',
      monthlySalaryPaise: 2800000, // 28,000 INR
      advanceTakenPaise: 300000,
      overtimeHours: 5,
      status: 'active',
    },
    {
      id: 'st_02',
      name: 'Manjunath Gowda',
      role: 'Cook',
      phone: '9811002233',
      shift: 'Morning (6 AM - 2 PM)',
      monthlySalaryPaise: 2400000, // 24,000 INR
      advanceTakenPaise: 0,
      overtimeHours: 8,
      status: 'active',
    },
    {
      id: 'st_03',
      name: 'Santosh Kumar',
      role: 'Security Guard',
      phone: '9988112233',
      shift: 'Night (10 PM - 6 AM)',
      monthlySalaryPaise: 1800000, // 18,000 INR
      advanceTakenPaise: 200000,
      overtimeHours: 12,
      status: 'active',
    },
    {
      id: 'st_04',
      name: 'Geetha Bai',
      role: 'Housekeeping',
      phone: '9744332211',
      shift: 'Morning (6 AM - 2 PM)',
      monthlySalaryPaise: 1500000, // 15,000 INR
      advanceTakenPaise: 0,
      overtimeHours: 2,
      status: 'active',
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const staff = global.__pgsetu_staff_members__ || []

    const calculatedPayroll = staff.map((s) => {
      const baseSalaryRupees = s.monthlySalaryPaise / 100
      const advanceRupees = s.advanceTakenPaise / 100
      const overtimePayRupees = s.overtimeHours * 150
      const pfDeductionRupees = Math.round(baseSalaryRupees * 0.12)
      const netPayableRupees = baseSalaryRupees + overtimePayRupees - advanceRupees - pfDeductionRupees

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
        totalStaff: staff.length,
        activeOnDuty: staff.filter((s) => s.status === 'active').length,
        totalMonthlyPayrollPaise,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Staff query failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'create', name, role, phone, shift, salaryRupees } = body
    const staff = global.__pgsetu_staff_members__ || []

    const newStaff: StaffMember = {
      id: `st_${Date.now()}`,
      name: name || 'New Staff',
      role: role || 'Housekeeping',
      phone: phone || '9876543210',
      shift: shift || 'General (9 AM - 6 PM)',
      monthlySalaryPaise: Number(salaryRupees || 18000) * 100,
      advanceTakenPaise: 0,
      overtimeHours: 0,
      status: 'active',
    }

    staff.unshift(newStaff)
    return NextResponse.json({ success: true, staff: newStaff })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Staff creation failed' }, { status: 500 })
  }
}
