import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServiceClient()

    // 1. Organizations count
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })

    // 2. Properties, Buildings, Rooms, Beds
    const { count: totalProps } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })

    const { count: totalBuildings } = await supabase
      .from('buildings')
      .select('*', { count: 'exact', head: true })

    const { count: totalRooms } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })

    const { data: beds } = await supabase
      .from('beds')
      .select('status')

    const totalBeds = beds?.length || 0
    const occupiedBeds = beds?.filter((b) => b.status === 'occupied').length || 0
    const availableBeds = beds?.filter((b) => b.status === 'available').length || 0
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

    // 3. Active Residents
    const { count: activeResidents } = await supabase
      .from('residents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // 4. Financial totals (GTV, Collections, Outstanding)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_paise, paid_paise, balance_paise, status')
      .not('status', 'in', '(cancelled,draft)')

    const totalGtvPaise = invoices?.reduce((s, i) => s + (i.total_paise || 0), 0) || 0
    const totalCollectedPaise = invoices?.reduce((s, i) => s + (i.paid_paise || 0), 0) || 0
    const totalOutstandingPaise = invoices?.reduce((s, i) => s + Math.max(0, i.balance_paise || 0), 0) || 0

    // 5. SaaS Subscriptions
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, settings, created_at')

    let saasMrrPaise = 0
    orgs?.forEach((org) => {
      const plan = org.settings?.plan || 'starter'
      if (plan === 'growth') saasMrrPaise += 249900 // ₹2,499
      else if (plan === 'enterprise') saasMrrPaise += 499900 // ₹4,999
      else saasMrrPaise += 99900 // ₹999
    })

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
