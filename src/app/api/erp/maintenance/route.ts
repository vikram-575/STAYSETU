import { NextResponse, type NextRequest } from 'next/server'

interface MaintenanceAsset {
  id: string
  name: string
  category: 'Air Conditioner' | 'RO Purifier' | 'Elevator / Lift' | 'DG Genset' | 'Solar / Geyser' | 'Water Tank'
  location: string
  lastServicedDate: string
  nextServiceDueDate: string
  serviceIntervalDays: number
  vendorName: string
  vendorPhone: string
  status: 'healthy' | 'service_due' | 'under_maintenance'
  costPaise: number
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_maintenance_assets__: MaintenanceAsset[] | undefined
}

if (!global.__pgsetu_maintenance_assets__) {
  global.__pgsetu_maintenance_assets__ = [
    {
      id: 'ast_01',
      name: 'Commercial RO Water Plant (500 LPH)',
      category: 'RO Purifier',
      location: 'Ground Floor Utility Yard',
      lastServicedDate: '2025-06-15',
      nextServiceDueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // OVERDUE!
      serviceIntervalDays: 90,
      vendorName: 'Kent Pure RO Care',
      vendorPhone: '9845012345',
      status: 'service_due',
      costPaise: 350000,
    },
    {
      id: 'ast_02',
      name: '6-Passenger Automatic Lift',
      category: 'Elevator / Lift',
      location: 'Main Tower Core',
      lastServicedDate: '2025-08-01',
      nextServiceDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      serviceIntervalDays: 30,
      vendorName: 'Otis Elevator AMC',
      vendorPhone: '9811223344',
      status: 'healthy',
      costPaise: 800000,
    },
    {
      id: 'ast_03',
      name: '45 kVA Kirloskar Silent DG Genset',
      category: 'DG Genset',
      location: 'Rear Parking Shed',
      lastServicedDate: '2025-05-10',
      nextServiceDueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      serviceIntervalDays: 180,
      vendorName: 'PowerTech Diesel Services',
      vendorPhone: '9988776655',
      status: 'healthy',
      costPaise: 1200000,
    },
    {
      id: 'ast_04',
      name: '24 Split AC Units (Voltas 1.5T 3-Star)',
      category: 'Air Conditioner',
      location: 'Floors 1 to 3',
      lastServicedDate: '2025-04-10',
      nextServiceDueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // OVERDUE
      serviceIntervalDays: 120,
      vendorName: 'CoolComfort HVAC',
      vendorPhone: '9744112233',
      status: 'service_due',
      costPaise: 1800000,
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const assets = global.__pgsetu_maintenance_assets__ || []
    const dueAssets = assets.filter((a) => a.status === 'service_due')

    return NextResponse.json({
      success: true,
      assets,
      summary: {
        totalAssets: assets.length,
        dueCount: dueAssets.length,
        healthyCount: assets.filter((a) => a.status === 'healthy').length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Maintenance query failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'complete_service', assetId, costRupees } = body
    const assets = global.__pgsetu_maintenance_assets__ || []

    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    const todayStr = new Date().toISOString().split('T')[0]
    const nextDate = new Date(Date.now() + asset.serviceIntervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    asset.lastServicedDate = todayStr
    asset.nextServiceDueDate = nextDate
    asset.status = 'healthy'
    if (costRupees) asset.costPaise = Number(costRupees) * 100

    return NextResponse.json({ success: true, asset })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update service' }, { status: 500 })
  }
}
