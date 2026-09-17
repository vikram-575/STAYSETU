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
  global.__pgsetu_maintenance_assets__ = []
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
