import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

import { isSuperAdminFromRequest } from '@/lib/admin-auth'

async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) {
    return { role: 'superadmin' }
  }
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const service = await createServiceClient()
    const { data: profile } = await service.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') return null
    return user
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()

    const { count: totalOrgs } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
    const { count: totalProps } = await supabase.from('properties').select('*', { count: 'exact', head: true })
    const { count: totalBuildings } = await supabase.from('buildings').select('*', { count: 'exact', head: true })
    const { count: totalRooms } = await supabase.from('rooms').select('*', { count: 'exact', head: true })

    const { data: beds } = await supabase.from('beds').select('status')
    const totalBeds = beds?.length || 0
    const occupiedBeds = beds?.filter((b) => b.status === 'occupied').length || 0
    const availableBeds = beds?.filter((b) => b.status === 'available').length || 0
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

    const { count: activeResidents } = await supabase.from('residents').select('*', { count: 'exact', head: true }).eq('status', 'active')

    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_paise, paid_paise, balance_paise, status')
      .not('status', 'in', '(cancelled,draft)')

    const totalGtvPaise = invoices?.reduce((s, i) => s + (i.total_paise || 0), 0) || 0
    const totalCollectedPaise = invoices?.reduce((s, i) => s + (i.paid_paise || 0), 0) || 0
    const totalOutstandingPaise = invoices?.reduce((s, i) => s + Math.max(0, i.balance_paise || 0), 0) || 0
    const saasMrrPaise = totalBeds * 1000

    return NextResponse.json({
      success: true,
      stats: {
        total_organizations: totalOrgs || 0,
        total_properties: totalProps || 0,
        total_buildings: totalBuildings || 0,
        total_rooms: totalRooms || 0,
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        available_beds: availableBeds,
        occupancy_rate_pct: occupancyRate,
        total_active_residents: activeResidents || 0,
        platform_gtv_paise: totalGtvPaise,
        platform_collected_paise: totalCollectedPaise,
        platform_outstanding_paise: totalOutstandingPaise,
        platform_saas_mrr_paise: saasMrrPaise,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch platform stats' }, { status: 500 })
  }
}
