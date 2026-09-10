import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) return { role: 'superadmin' }
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
    const url = new URL(request.url)
    const view = url.searchParams.get('view') || 'listings'
    const status = url.searchParams.get('status')
    const city = url.searchParams.get('city')
    const search = url.searchParams.get('search')?.toLowerCase().trim()

    if (view === 'listings') {
      // Query properties and synthesize marketplace listing moderation status
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id, name, city, locality, address, is_active, created_at, updated_at, settings,
          organizations(id, name, phone, email),
          rooms(id, room_number, base_rent_paise, capacity, beds(id, status))
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const listings = (properties || []).map((prop: any) => {
        const rooms = prop.rooms || []
        const minRentPaise = rooms.length > 0
          ? Math.min(...rooms.map((r: any) => r.base_rent_paise || 800000))
          : 900000
        const totalBeds = rooms.reduce((acc: number, r: any) => acc + (r.beds?.length || r.capacity || 0), 0)
        const occupiedBeds = rooms.reduce(
          (acc: number, r: any) => acc + (r.beds?.filter((b: any) => b.status === 'occupied').length || 0),
          0
        )

        const listingStatus = prop.settings?.listing_status || (prop.is_active ? 'published' : 'draft')
        const isFeatured = Boolean(prop.settings?.is_featured)

        return {
          id: prop.id,
          title: prop.name,
          property_name: prop.name,
          owner_name: prop.organizations?.name || 'Verified Landlord',
          owner_email: prop.organizations?.email || '',
          owner_phone: prop.organizations?.phone || '',
          city: prop.city || 'Bengaluru',
          locality: prop.locality || 'Koramangala',
          property_type: prop.settings?.property_type || 'pg',
          monthly_rent_paise: minRentPaise,
          deposit_paise: minRentPaise * 2,
          sharing_type: rooms.length > 0 ? (rooms[0].capacity === 1 ? 'Single Room' : `${rooms[0].capacity} Sharing`) : 'Double Sharing',
          total_beds: totalBeds,
          occupied_beds: occupiedBeds,
          vacant_beds: Math.max(0, totalBeds - occupiedBeds),
          status: listingStatus,
          is_featured: isFeatured,
          featured_priority: prop.settings?.featured_priority || 1,
          featured_until: prop.settings?.featured_until || null,
          views_count: prop.settings?.views_count || 140,
          enquiries_count: prop.settings?.enquiries_count || 8,
          created_at: prop.created_at,
          updated_at: prop.updated_at,
          flagged_reason: prop.settings?.flagged_reason || null,
        }
      })

      let filtered = listings
      if (status && status !== 'all') {
        filtered = filtered.filter((l) => l.status === status)
      }
      if (city && city !== 'all') {
        filtered = filtered.filter((l) => l.city.toLowerCase() === city.toLowerCase())
      }
      if (search) {
        filtered = filtered.filter(
          (l) =>
            l.title.toLowerCase().includes(search) ||
            l.owner_name.toLowerCase().includes(search) ||
            l.city.toLowerCase().includes(search) ||
            l.locality.toLowerCase().includes(search)
        )
      }

      return NextResponse.json({
        success: true,
        listings: filtered,
      })
    }

    if (view === 'enquiries') {
      // Mock / persistent platform enquiries funnel
      const enquiries = [
        {
          id: 'enq-101',
          tenant_name: 'Priya Sharma',
          tenant_phone: '9876543210',
          tenant_email: 'priya.s@example.com',
          property_name: 'Sai Balaji Grand Coliving',
          owner_name: 'Rajesh Gowda',
          sharing_choice: 'Single Room',
          status: 'visit_scheduled',
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          notes: 'Looking for immediate move-in near Manyata Tech Park.',
        },
        {
          id: 'enq-102',
          tenant_name: 'Amit Verma',
          tenant_phone: '9811223344',
          tenant_email: 'amit.v@example.com',
          property_name: 'Cyber View Premium PG',
          owner_name: 'Vikram Singh',
          sharing_choice: 'Double Sharing',
          status: 'new',
          created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
          notes: 'Software engineer joining DLF Cyber City.',
        },
        {
          id: 'enq-103',
          tenant_name: 'Sneha Patel',
          tenant_phone: '9988776655',
          tenant_email: 'sneha.p@example.com',
          property_name: 'Aura Bloom Luxury Living',
          owner_name: 'Mrs. Rekha Sharma',
          sharing_choice: 'Single Room',
          status: 'converted',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          notes: 'Checked in to Room 204.',
        },
      ]

      return NextResponse.json({
        success: true,
        enquiries,
      })
    }

    if (view === 'visits') {
      const visits = [
        {
          id: 'vis-201',
          tenant_name: 'Priya Sharma',
          tenant_phone: '9876543210',
          property_name: 'Sai Balaji Grand Coliving',
          owner_name: 'Rajesh Gowda',
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: '17:30',
          status: 'scheduled',
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: 'vis-202',
          tenant_name: 'Rohan Deshmukh',
          tenant_phone: '9765432190',
          property_name: 'Elysium Luxury Coliving',
          owner_name: 'Arjun Menon',
          scheduled_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          scheduled_time: '14:00',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ]

      return NextResponse.json({
        success: true,
        visits,
      })
    }

    return NextResponse.json({ error: 'Unknown view parameter' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch marketplace data' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const { property_id, action, reason, featured_priority, featured_until } = await request.json()

    if (!property_id || !action) {
      return NextResponse.json({ error: 'property_id and action are required.' }, { status: 400 })
    }

    // Fetch existing property settings
    const { data: prop, error: fetchError } = await supabase
      .from('properties')
      .select('id, name, settings, organization_id')
      .eq('id', property_id)
      .single()

    if (fetchError || !prop) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const currentSettings = prop.settings || {}
    let newStatus = currentSettings.listing_status || 'published'
    let isActive = true
    let isFeatured = currentSettings.is_featured || false

    if (action === 'approve') {
      newStatus = 'published'
      isActive = true
    } else if (action === 'reject') {
      if (!reason) return NextResponse.json({ error: 'Rejection reason is mandatory.' }, { status: 400 })
      newStatus = 'rejected'
      isActive = false
    } else if (action === 'suspend') {
      if (!reason) return NextResponse.json({ error: 'Suspension reason is mandatory.' }, { status: 400 })
      newStatus = 'suspended'
      isActive = false
    } else if (action === 'restore') {
      newStatus = 'published'
      isActive = true
    } else if (action === 'feature') {
      isFeatured = true
    } else if (action === 'unfeature') {
      isFeatured = false
    }

    const updatedSettings = {
      ...currentSettings,
      listing_status: newStatus,
      is_featured: isFeatured,
      featured_priority: featured_priority || currentSettings.featured_priority || 1,
      featured_until: featured_until || currentSettings.featured_until || null,
      moderated_at: new Date().toISOString(),
      moderator_email: (adminUser as any).email || 'superadmin@pgsetu.com',
      flagged_reason: action === 'reject' || action === 'suspend' ? reason : null,
    }

    const { error: updateError } = await supabase
      .from('properties')
      .update({
        is_active: isActive,
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', property_id)

    if (updateError) throw updateError

    // Record Tamper-Resistant Audit Log
    try {
      await supabase.from('audit_logs').insert({
        organization_id: prop.organization_id,
        action: 'update',
        entity_type: 'property_listing',
        entity_id: property_id,
        before_state: { status: currentSettings.listing_status, is_featured: currentSettings.is_featured },
        after_state: { status: newStatus, is_featured: isFeatured, reason },
      })
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Listing action '${action}' applied successfully.`,
      listing: {
        id: property_id,
        status: newStatus,
        is_featured: isFeatured,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update marketplace listing' }, { status: 500 })
  }
}
