import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'
import { queryCollection, updateDocument } from '@/lib/firebase/firestore'

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
      // Query properties and hierarchy for accurate counts
      const { data: properties, error: propErr } = await supabase
        .from('properties')
        .select(`
          id, name, city, state, address, pincode, is_active, created_at, updated_at, settings, organization_id,
          organizations(id, name, phone, email)
        `)
        .order('created_at', { ascending: false })

      if (propErr) throw propErr

      const propList = properties || []
      const propIds = propList.map((p) => p.id)

      const { data: buildings } = propIds.length > 0
        ? await supabase.from('buildings').select('id, property_id').in('property_id', propIds)
        : { data: [] }
      const bldgIds = (buildings || []).map((b) => b.id)

      const { data: floors } = bldgIds.length > 0
        ? await supabase.from('floors').select('id, building_id').in('building_id', bldgIds)
        : { data: [] }
      const floorIds = (floors || []).map((f) => f.id)

      const { data: rooms } = floorIds.length > 0
        ? await supabase.from('rooms').select('id, floor_id, room_number, base_rent_paise, capacity').in('floor_id', floorIds)
        : { data: [] }
      const roomIds = (rooms || []).map((r) => r.id)

      const { data: beds } = roomIds.length > 0
        ? await supabase.from('beds').select('id, room_id, status').in('room_id', roomIds)
        : { data: [] }

      // Map hierarchies
      const bldgByProp = new Map<string, string[]>()
      ;(buildings || []).forEach((b) => {
        const arr = bldgByProp.get(b.property_id) || []
        arr.push(b.id)
        bldgByProp.set(b.property_id, arr)
      })

      const floorByBldg = new Map<string, string[]>()
      ;(floors || []).forEach((f) => {
        const arr = floorByBldg.get(f.building_id) || []
        arr.push(f.id)
        floorByBldg.set(f.building_id, arr)
      })

      const roomsByFloor = new Map<string, any[]>()
      ;(rooms || []).forEach((r) => {
        const arr = roomsByFloor.get(r.floor_id) || []
        arr.push(r)
        roomsByFloor.set(r.floor_id, arr)
      })

      const bedsByRoom = new Map<string, any[]>()
      ;(beds || []).forEach((b) => {
        const arr = bedsByRoom.get(b.room_id) || []
        arr.push(b)
        bedsByRoom.set(b.room_id, arr)
      })

      const listings = propList.map((prop: any) => {
        const propBldgs = bldgByProp.get(prop.id) || []
        const propFloors = propBldgs.flatMap((bId) => floorByBldg.get(bId) || [])
        const propRooms = propFloors.flatMap((fId) => roomsByFloor.get(fId) || [])
        const propBeds = propRooms.flatMap((r) => bedsByRoom.get(r.id) || [])

        const minRentPaise = propRooms.length > 0
          ? Math.min(...propRooms.map((r: any) => r.base_rent_paise || 600000))
          : 600000

        const totalBeds = propBeds.length || propRooms.reduce((acc: number, r: any) => acc + (r.capacity || 0), 0)
        const occupiedBeds = propBeds.filter((b: any) => b.status === 'occupied').length

        const listingStatus = prop.settings?.listing_status || (prop.is_active ? 'published' : 'draft')
        const isFeatured = Boolean(prop.settings?.is_featured)

        return {
          id: prop.id,
          title: prop.name,
          property_name: prop.name,
          owner_name: (prop.organizations as any)?.name || 'Verified Landlord',
          owner_email: (prop.organizations as any)?.email || '',
          owner_phone: (prop.organizations as any)?.phone || '',
          city: prop.city || '',
          locality: prop.settings?.locality || prop.city || '',
          property_type: prop.settings?.property_type || 'pg',
          monthly_rent_paise: minRentPaise,
          deposit_paise: minRentPaise * 2,
          sharing_type: propRooms.length > 0 ? (propRooms[0].capacity === 1 ? 'Single Room' : `${propRooms[0].capacity} Sharing`) : 'Double Sharing',
          total_beds: totalBeds,
          occupied_beds: occupiedBeds,
          vacant_beds: Math.max(0, totalBeds - occupiedBeds),
          status: listingStatus,
          is_featured: isFeatured,
          featured_priority: prop.settings?.featured_priority || 1,
          featured_until: prop.settings?.featured_until || null,
          views_count: prop.settings?.views_count || 0,
          enquiries_count: prop.settings?.enquiries_count || 0,
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
      const filters: Array<[string, any, any]> = []
      if (status && status !== 'all') filters.push(['status', '==', status])
      const rawLeads = await queryCollection('leads', filters, { field: 'created_at', direction: 'desc' }, 100)
      const enquiries = (rawLeads || []).map((e: any) => ({
        id: e.id,
        user_name: e.tenant_name || e.user_name || 'Prospect',
        tenant_name: e.tenant_name || e.user_name || 'Prospect',
        user_phone: e.tenant_phone || e.user_phone || '',
        tenant_phone: e.tenant_phone || e.user_phone || '',
        tenant_email: e.tenant_email || '',
        property_name: e.property_name || 'Property',
        properties: { name: e.property_name || 'Property' },
        owner_name: e.owner_name || 'Owner',
        sharing_choice: e.sharing_choice || 'Single Room',
        status: e.status || 'new',
        created_at: e.created_at || new Date().toISOString(),
        notes: e.notes || e.message || '',
        message: e.notes || e.message || '',
      }))

      let filtered = enquiries
      if (search) {
        filtered = filtered.filter(
          (item) =>
            item.tenant_name.toLowerCase().includes(search) ||
            item.tenant_phone.includes(search) ||
            item.property_name.toLowerCase().includes(search)
        )
      }

      return NextResponse.json({
        success: true,
        enquiries: filtered,
      })
    }

    if (view === 'visits') {
      const filters: Array<[string, any, any]> = []
      if (status && status !== 'all') filters.push(['status', '==', status])
      const rawLeads = await queryCollection('leads', filters, { field: 'created_at', direction: 'desc' }, 100)
      const visits = (rawLeads || [])
        .filter((l: any) => l.type === 'visit' || l.status === 'visit_scheduled' || l.scheduled_date)
        .map((v: any) => ({
          id: v.id,
          user_name: v.tenant_name || v.user_name || 'Prospect',
          tenant_name: v.tenant_name || v.user_name || 'Prospect',
          user_phone: v.tenant_phone || v.user_phone || '',
          tenant_phone: v.tenant_phone || v.user_phone || '',
          property_name: v.property_name || 'Property',
          properties: { name: v.property_name || 'Property' },
          owner_name: v.owner_name || 'Owner',
          scheduled_date: v.scheduled_date || v.visit_date || v.created_at?.split('T')[0] || '',
          visit_date: v.scheduled_date || v.visit_date || v.created_at?.split('T')[0] || '',
          scheduled_time: v.scheduled_time || v.time_slot || '11:00 AM',
          time_slot: v.scheduled_time || v.time_slot || '11:00 AM',
          status: v.status || 'scheduled',
          created_at: v.created_at || new Date().toISOString(),
        }))

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

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const body = await request.json()
    const { action, enquiry_id, status } = body

    if (action === 'update_enquiry_status' && enquiry_id) {
      await updateDocument('leads', enquiry_id, { status })
      return NextResponse.json({ success: true, message: 'Enquiry status updated' })
    }

    return handleListingModeration(adminUser, body)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to apply action' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const body = await request.json()
    return handleListingModeration(adminUser, body)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update marketplace listing' }, { status: 500 })
  }
}

async function handleListingModeration(adminUser: any, body: any) {
  const supabase = await createServiceClient()
  const { property_id, action, reason, featured_priority, featured_until } = body

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

  return NextResponse.json({
    success: true,
    message: `Listing action '${action}' applied successfully.`,
    listing: {
      id: property_id,
      status: newStatus,
      is_featured: isFeatured,
    },
  })
}
