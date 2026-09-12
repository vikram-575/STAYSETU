import { NextResponse, type NextRequest } from 'next/server'

interface GroceryItem {
  id: string
  name: string
  category: 'Grains' | 'Pulses' | 'Dairy' | 'Vegetables' | 'Oils' | 'Spices'
  quantity: number
  unit: string
  minThreshold: number
  unitPricePaise: number
}

interface DailyAttendance {
  date: string
  breakfastCount: number
  lunchCount: number
  dinnerCount: number
  totalMeals: number
  totalExpensePaise: number
  costPerMealPaise: number
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_mess_groceries__: GroceryItem[] | undefined
  // eslint-disable-next-line no-var
  var __pgsetu_mess_attendance__: DailyAttendance[] | undefined
}

if (!global.__pgsetu_mess_groceries__) {
  global.__pgsetu_mess_groceries__ = [
    { id: 'g_01', name: 'Kolam Rice (25kg Bag)', category: 'Grains', quantity: 8, unit: 'Bags', minThreshold: 3, unitPricePaise: 160000 },
    { id: 'g_02', name: 'Toor Dal (Premium)', category: 'Pulses', quantity: 22, unit: 'Kg', minThreshold: 10, unitPricePaise: 14000 },
    { id: 'g_03', name: 'Sunflower Cooking Oil (15L Tin)', category: 'Oils', quantity: 2, unit: 'Tins', minThreshold: 2, unitPricePaise: 210000 }, // Low Stock!
    { id: 'g_04', name: 'Aashirvaad Whole Wheat Atta', category: 'Grains', quantity: 45, unit: 'Kg', minThreshold: 15, unitPricePaise: 4200 },
    { id: 'g_05', name: 'Nandini Toned Milk', category: 'Dairy', quantity: 30, unit: 'Liters', minThreshold: 10, unitPricePaise: 4400 },
  ]
}

if (!global.__pgsetu_mess_attendance__) {
  global.__pgsetu_mess_attendance__ = [
    {
      date: new Date().toISOString().split('T')[0],
      breakfastCount: 42,
      lunchCount: 35,
      dinnerCount: 48,
      totalMeals: 125,
      totalExpensePaise: 450000,
      costPerMealPaise: Math.round(450000 / 125), // ~36 INR per meal
    },
    {
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      breakfastCount: 40,
      lunchCount: 38,
      dinnerCount: 46,
      totalMeals: 124,
      totalExpensePaise: 434000,
      costPerMealPaise: Math.round(434000 / 124),
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const groceries = global.__pgsetu_mess_groceries__ || []
    const attendance = global.__pgsetu_mess_attendance__ || []

    const lowStockItems = groceries.filter((g) => g.quantity <= g.minThreshold)
    const todayAttendance = attendance[0] || {
      breakfastCount: 0,
      lunchCount: 0,
      dinnerCount: 0,
      totalMeals: 0,
      costPerMealPaise: 0,
    }

    return NextResponse.json({
      success: true,
      groceries,
      attendance,
      todayAttendance,
      summary: {
        totalGroceryItems: groceries.length,
        lowStockCount: lowStockItems.length,
        todayCostPerMealPaise: todayAttendance.costPerMealPaise,
        totalHeadcountToday: todayAttendance.totalMeals,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch mess data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'update_attendance', breakfast, lunch, dinner } = body
    const attendance = global.__pgsetu_mess_attendance__ || []

    if (action === 'update_attendance') {
      const b = Number(breakfast) || 0
      const l = Number(lunch) || 0
      const d = Number(dinner) || 0
      const totalMeals = b + l + d
      const totalExpensePaise = 450000
      const costPerMealPaise = totalMeals > 0 ? Math.round(totalExpensePaise / totalMeals) : 0

      attendance[0] = {
        date: new Date().toISOString().split('T')[0],
        breakfastCount: b,
        lunchCount: l,
        dinnerCount: d,
        totalMeals,
        totalExpensePaise,
        costPerMealPaise,
      }
      return NextResponse.json({ success: true, attendance: attendance[0] })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Mess operation failed' }, { status: 500 })
  }
}
