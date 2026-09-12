import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { queryCollection, updateDocument, createDocument } from '@/lib/firebase/firestore'

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_instant_leads__: any[] | undefined
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const url = new URL(request.url)
    const view = url.searchParams.get('view') || url.searchParams.get('section') || 'all'
    const status = url.searchParams.get('status')
    const city = url.searchParams.get('city')
    const search = url.searchParams.get('search')?.toLowerCase().trim()

    // 1. Fetch Listings
    let listings: any[] = []
    if (view === 'listings' || view === 'all') {
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

      listings = propList.map((prop: any) => {
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

      if (status && status !== 'all') {
        listings = listings.filter((l) => l.status === status)
      }
      if (city && city !== 'all') {
        listings = listings.filter((l) => l.city.toLowerCase() === city.toLowerCase())
      }
      if (search) {
        listings = listings.filter(
          (l) =>
            l.title.toLowerCase().includes(search) ||
            l.owner_name.toLowerCase().includes(search) ||
            l.city.toLowerCase().includes(search) ||
            l.locality.toLowerCase().includes(search)
        )
      }

      if (view === 'listings') {
        return NextResponse.json({ success: true, listings })
      }
    }

    // 2. Fetch Leads (Firestore + In-Memory)
    const filters: Array<[string, any, any]> = []
    if (status && status !== 'all') filters.push(['status', '==', status])
    const rawLeads = await queryCollection('leads', filters, { field: 'created_at', direction: 'desc' }, 150)

    const combinedMap = new Map<string, any>()
    const memLeads = global.__pgsetu_instant_leads__ || []
    for (const l of memLeads) {
      if (status && status !== 'all' && l.status !== status) continue
      combinedMap.set(l.id || l.reference_code, l)
    }
    for (const l of rawLeads) {
      combinedMap.set(l.id || l.reference_code, l)
    }

    const allLeads = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // A. Instant PG Leads
    let instantPgLeads = allLeads.filter((l: any) => l.type === 'instant_pg' || l.reference_code?.startsWith('PG-INSTA'))
    if (search) {
      instantPgLeads = instantPgLeads.filter(
        (l) =>
          (l.tenant_name || l.user_name || '').toLowerCase().includes(search) ||
          (l.tenant_phone || l.user_phone || '').includes(search) ||
          (l.property_city || '').toLowerCase().includes(search) ||
          (l.reference_code || '').toLowerCase().includes(search)
      )
    }

    // B. General Enquiries
    let enquiries = allLeads.filter((l: any) => l.type !== 'instant_pg' && l.type !== 'visit')
    if (search) {
      enquiries = enquiries.filter(
        (l) =>
          (l.tenant_name || l.user_name || '').toLowerCase().includes(search) ||
          (l.tenant_phone || l.user_phone || '').includes(search) ||
          (l.property_name || '').toLowerCase().includes(search)
      )
    }

    // C. Visits
    let visits = allLeads.filter((l: any) => l.type === 'visit' || l.status === 'visit_scheduled' || l.scheduled_date)
    if (search) {
      visits = visits.filter(
        (l) =>
          (l.tenant_name || l.user_name || '').toLowerCase().includes(search) ||
          (l.tenant_phone || l.user_phone || '').includes(search)
      )
    }

    if (view === 'instant_pg') {
      return NextResponse.json({ success: true, instant_pg_leads: instantPgLeads })
    }
    if (view === 'enquiries') {
      return NextResponse.json({ success: true, enquiries, instant_pg_leads: instantPgLeads })
    }
    if (view === 'visits') {
      return NextResponse.json({ success: true, visits })
    }

    // View === 'all'
    return NextResponse.json({
      success: true,
      listings,
      enquiries,
      visits,
      instant_pg_leads: instantPgLeads,
      stats: {
        totalListings: listings.length,
        totalEnquiries: enquiries.length,
        totalVisits: visits.length,
        totalInstantLeads: instantPgLeads.length,
        newInstantLeads: instantPgLeads.filter((l) => l.status === 'new').length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch marketplace data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const body = await request.json()
    const { action, enquiry_id, status, assigned_property_name, notes } = body

    if (action === 'update_enquiry_status' && enquiry_id) {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (status) updates.status = status
      if (assigned_property_name) updates.assigned_property_name = assigned_property_name
      if (notes !== undefined) updates.notes = notes

      await updateDocument('leads', enquiry_id, updates)

      // Update in memory as well
      if (global.__pgsetu_instant_leads__) {
        const found = global.__pgsetu_instant_leads__.find((l) => l.id === enquiry_id || l.reference_code === enquiry_id)
        if (found) Object.assign(found, updates)
      }

      return NextResponse.json({ success: true, message: 'Enquiry / Lead status updated' })
    }

    if (action === 'create_instant_lead') {
      const {
        name,
        phone,
        city = 'Bengaluru',
        gender = 'any',
        sharing = '2-Sharing',
        budget = '₹8,000 - ₹12,000',
        move_in = 'Immediate / Today',
        notes = '',
      } = body

      if (!name || !phone) {
        return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
      }

      const refCode = `PG-INSTA-${Math.floor(1000 + Math.random() * 9000)}`
      const payload = {
        reference_code: refCode,
        tenant_name: name,
        user_name: name,
        tenant_phone: phone.replace(/\D/g, ''),
        user_phone: phone.replace(/\D/g, ''),
        property_city: city,
        gender,
        pg_type: gender,
        sharing_choice: sharing,
        budget_range: budget,
        move_in_date: move_in,
        notes,
        type: 'instant_pg',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const doc = await createDocument('leads', payload)
      if (!global.__pgsetu_instant_leads__) global.__pgsetu_instant_leads__ = []
      global.__pgsetu_instant_leads__.unshift(doc)

      return NextResponse.json({ success: true, lead: doc, message: 'Instant lead created by admin' })
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
    .select('id, name, settings, is_active')
    .eq('id', property_id)
    .single()

  if (fetchError || !prop) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  const currentSettings = (prop.settings as Record<string, any>) || {}
  const updates: Record<string, any> = {}

  if (action === 'approve') {
    updates.is_active = true
    updates.settings = {
      ...currentSettings,
      listing_status: 'published',
      flagged_reason: null,
      approved_at: new Date().toISOString(),
      approved_by: adminUser.email,
    }
  } else if (action === 'reject') {
    updates.is_active = false
    updates.settings = {
      ...currentSettings,
      listing_status: 'rejected',
      flagged_reason: reason || 'Listing does not meet quality standards.',
      rejected_at: new Date().toISOString(),
      rejected_by: adminUser.email,
    }
  } else if (action === 'feature') {
    updates.settings = {
      ...currentSettings,
      is_featured: true,
      featured_priority: Number(featured_priority) || 1,
      featured_until: featured_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  } else if (action === 'unfeature') {
    updates.settings = {
      ...currentSettings,
      is_featured: false,
      featured_priority: 0,
      featured_until: null,
    }
  } else {
    return NextResponse.json({ error: 'Unsupported moderation action' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', property_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    action,
    property_id,
    message: `Property listing ${action}d successfully.`,
  })
}
