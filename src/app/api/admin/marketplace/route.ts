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
    const propertyType = url.searchParams.get('type')
    const verifiedOnly = url.searchParams.get('verified') === 'true'
    const featuredOnly = url.searchParams.get('featured') === 'true'
    const search = url.searchParams.get('search')?.toLowerCase().trim()
    const sort = url.searchParams.get('sort') || 'newest'

    // 1. Fetch Listings
    let listings: any[] = []
    if (view === 'listings' || view === 'all') {
      const { data: properties, error: propErr } = await supabase
        .from('properties')
        .select(`
          id, name, city, state, address, pincode, phone, email, description,
          is_active, created_at, updated_at, settings, organization_id,
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

      const defaultImages = [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
      ]

      listings = propList.map((prop: any) => {
        const propBldgs = bldgByProp.get(prop.id) || []
        const propFloors = propBldgs.flatMap((bId) => floorByBldg.get(bId) || [])
        const propRooms = propFloors.flatMap((fId) => roomsByFloor.get(fId) || [])
        const propBeds = propRooms.flatMap((r) => bedsByRoom.get(r.id) || [])

        const minRentPaise = propRooms.length > 0
          ? Math.min(...propRooms.map((r: any) => r.base_rent_paise || 600000))
          : (prop.settings?.starting_rent_paise || 600000)

        const totalBeds = propBeds.length || propRooms.reduce((acc: number, r: any) => acc + (r.capacity || 0), 0) || 10
        const occupiedBeds = propBeds.filter((b: any) => b.status === 'occupied').length

        const settings = prop.settings || {}
        const listingStatus = settings.listing_status || (prop.is_active ? 'published' : 'pending')
        const isFeatured = Boolean(settings.is_featured)
        const isVerified = Boolean(settings.is_verified ?? true)
        const superHost = Boolean(settings.super_host)

        const propImages = Array.isArray(settings.images) && settings.images.length > 0
          ? settings.images
          : defaultImages

        return {
          id: prop.id,
          title: prop.name,
          name: prop.name,
          property_name: prop.name,
          owner_name: (prop.organizations as any)?.name || 'Verified Host',
          owner_email: (prop.organizations as any)?.email || prop.email || '',
          owner_phone: (prop.organizations as any)?.phone || prop.phone || '',
          phone: prop.phone || (prop.organizations as any)?.phone || '',
          email: prop.email || (prop.organizations as any)?.email || '',
          address: prop.address || '',
          city: prop.city || '',
          state: prop.state || '',
          pincode: prop.pincode || settings.pincode || '',
          locality: settings.locality || prop.city || '',
          property_type: settings.property_type || 'pg',
          gender_preference: settings.gender_preference || 'coed',
          monthly_rent_paise: Number(settings.starting_rent_paise) || minRentPaise,
          deposit_paise: Number(settings.deposit_paise) || (minRentPaise * 2),
          sharing_type: propRooms.length > 0 ? (propRooms[0].capacity === 1 ? 'Single Room' : `${propRooms[0].capacity} Sharing`) : 'Double Sharing',
          total_beds: totalBeds,
          occupied_beds: occupiedBeds,
          vacant_beds: Math.max(0, totalBeds - occupiedBeds),
          status: listingStatus,
          is_active: Boolean(prop.is_active),
          is_verified: isVerified,
          super_host: superHost,
          is_featured: isFeatured,
          featured_priority: settings.featured_priority || 1,
          featured_until: settings.featured_until || null,
          images: propImages,
          coverImage: settings.coverImage || propImages[0],
          amenities: Array.isArray(settings.amenities) && settings.amenities.length > 0
            ? settings.amenities
            : ['High-Speed WiFi', 'Power Backup', 'RO Water', 'CCTV Security', 'Housekeeping', 'Washing Machine'],
          rules: Array.isArray(settings.rules) && settings.rules.length > 0
            ? settings.rules
            : ['Gate closes at 11:00 PM', 'Visitors allowed in lounge only', 'No smoking inside rooms'],
          description: prop.description || '',
          views_count: settings.views_count || 0,
          enquiries_count: settings.enquiries_count || 0,
          created_at: prop.created_at,
          updated_at: prop.updated_at,
          flagged_reason: settings.flagged_reason || null,
          approved_at: settings.approved_at || null,
          approved_by: settings.approved_by || null,
        }
      })

      // Apply Filters
      if (status && status !== 'all') {
        if (status === 'pending') {
          listings = listings.filter((l) => l.status === 'pending' || (!l.is_active && l.status !== 'rejected'))
        } else if (status === 'published') {
          listings = listings.filter((l) => l.status === 'published' && l.is_active)
        } else {
          listings = listings.filter((l) => l.status === status)
        }
      }

      if (city && city !== 'all') {
        listings = listings.filter((l) => l.city.toLowerCase() === city.toLowerCase())
      }

      if (propertyType && propertyType !== 'all') {
        listings = listings.filter((l) => l.property_type.toLowerCase() === propertyType.toLowerCase())
      }

      if (verifiedOnly) {
        listings = listings.filter((l) => l.is_verified)
      }

      if (featuredOnly) {
        listings = listings.filter((l) => l.is_featured)
      }

      if (search) {
        listings = listings.filter(
          (l) =>
            l.title.toLowerCase().includes(search) ||
            l.owner_name.toLowerCase().includes(search) ||
            l.owner_phone.includes(search) ||
            l.city.toLowerCase().includes(search) ||
            l.locality.toLowerCase().includes(search) ||
            l.address.toLowerCase().includes(search)
        )
      }

      // Sort
      if (sort === 'newest') {
        listings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      } else if (sort === 'rent_asc') {
        listings.sort((a, b) => (a.monthly_rent_paise || 0) - (b.monthly_rent_paise || 0))
      } else if (sort === 'rent_desc') {
        listings.sort((a, b) => (b.monthly_rent_paise || 0) - (a.monthly_rent_paise || 0))
      } else if (sort === 'pending_first') {
        listings.sort((a, b) => {
          const aPending = a.status === 'pending' || !a.is_active ? 1 : 0
          const bPending = b.status === 'pending' || !b.is_active ? 1 : 0
          return bPending - aPending
        })
      }

      if (view === 'listings') {
        return NextResponse.json({
          success: true,
          listings,
          stats: {
            totalListings: listings.length,
            pendingListings: listings.filter((l) => l.status === 'pending' || (!l.is_active && l.status !== 'rejected')).length,
            publishedListings: listings.filter((l) => l.status === 'published' || l.is_active).length,
            rejectedListings: listings.filter((l) => l.status === 'rejected').length,
            totalBeds: listings.reduce((acc, l) => acc + (l.total_beds || 0), 0),
          },
        })
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
    const pendingListingsCount = listings.filter((l) => l.status === 'pending' || (!l.is_active && l.status !== 'rejected')).length
    const publishedListingsCount = listings.filter((l) => l.status === 'published' || l.is_active).length

    return NextResponse.json({
      success: true,
      listings,
      enquiries,
      visits,
      instant_pg_leads: instantPgLeads,
      stats: {
        totalListings: listings.length,
        pendingListings: pendingListingsCount,
        publishedListings: publishedListingsCount,
        rejectedListings: listings.filter((l) => l.status === 'rejected').length,
        totalBeds: listings.reduce((acc, l) => acc + (l.total_beds || 0), 0),
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

export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const url = new URL(request.url)
    let propertyId = url.searchParams.get('property_id') || url.searchParams.get('id')
    if (!propertyId) {
      const body = await request.json().catch(() => ({}))
      propertyId = body.property_id || body.id
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'property_id is required for deletion' }, { status: 400 })
    }

    return executeDeleteProperty(propertyId)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete property' }, { status: 500 })
  }
}

async function executeDeleteProperty(propertyId: string) {
  const supabase = await createServiceClient()

  // 1. Unlink residents assigned to this property
  try {
    await supabase.from('residents').update({ property_id: null }).eq('property_id', propertyId)
  } catch (e) {
    console.warn('[Admin Delete Property Warning - Unlink Residents]:', e)
  }

  // 2. Fetch building and floor IDs to cascade delete
  try {
    const { data: bldgs } = await supabase.from('buildings').select('id').eq('property_id', propertyId)
    const bldgIds = (bldgs || []).map((b) => b.id)

    if (bldgIds.length > 0) {
      const { data: flrs } = await supabase.from('floors').select('id').in('building_id', bldgIds)
      const floorIds = (flrs || []).map((f) => f.id)

      if (floorIds.length > 0) {
        const { data: rms } = await supabase.from('rooms').select('id').in('floor_id', floorIds)
        const roomIds = (rms || []).map((r) => r.id)

        if (roomIds.length > 0) {
          await supabase.from('beds').delete().in('room_id', roomIds)
          await supabase.from('rooms').delete().in('id', roomIds)
        }
        await supabase.from('floors').delete().in('id', floorIds)
      }
      await supabase.from('buildings').delete().in('id', bldgIds)
    }
  } catch (cascadeErr) {
    console.warn('[Admin Delete Cascade Warning]:', cascadeErr)
  }

  // 3. Delete property record
  const { error: delErr } = await supabase.from('properties').delete().eq('id', propertyId)
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    property_id: propertyId,
    message: 'Property listing and associated inventory deleted permanently.',
  })
}

async function handleListingModeration(adminUser: any, body: any) {
  const supabase = await createServiceClient()
  const { property_id, action, reason, featured_priority, featured_until } = body

  if (!property_id || !action) {
    return NextResponse.json({ error: 'property_id and action are required.' }, { status: 400 })
  }

  if (action === 'delete') {
    return executeDeleteProperty(property_id)
  }

  // Fetch existing property settings
  const { data: prop, error: fetchError } = await supabase
    .from('properties')
    .select('id, name, city, address, phone, email, description, settings, is_active')
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
      approval_status: 'approved',
      flagged_reason: null,
      approved_at: new Date().toISOString(),
      approved_by: adminUser.email,
    }
  } else if (action === 'reject') {
    updates.is_active = false
    updates.settings = {
      ...currentSettings,
      listing_status: 'rejected',
      approval_status: 'rejected',
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
  } else if (action === 'edit' || action === 'edit_property') {
    const {
      name,
      city,
      address,
      phone,
      email,
      description,
      locality,
      pincode,
      property_type,
      gender_preference,
      monthly_rent_paise,
      deposit_paise,
      is_verified,
      super_host,
      is_featured,
      listing_status,
      amenities,
      rules,
      images,
    } = body

    if (name) updates.name = name.trim()
    if (city !== undefined) updates.city = city.trim()
    if (address !== undefined) updates.address = address.trim()
    if (phone !== undefined) updates.phone = phone.trim()
    if (email !== undefined) updates.email = email.trim()
    if (description !== undefined) updates.description = description.trim()

    const newStatus = listing_status || currentSettings.listing_status || (prop.is_active ? 'published' : 'pending')
    updates.is_active = newStatus === 'published'

    const propImages = Array.isArray(images) && images.length > 0
      ? images
      : currentSettings.images

    updates.settings = {
      ...currentSettings,
      locality: locality !== undefined ? locality : currentSettings.locality,
      pincode: pincode !== undefined ? pincode : currentSettings.pincode,
      property_type: property_type || currentSettings.property_type || 'pg',
      gender_preference: gender_preference || currentSettings.gender_preference || 'coed',
      starting_rent_paise: monthly_rent_paise !== undefined ? Number(monthly_rent_paise) : currentSettings.starting_rent_paise,
      deposit_paise: deposit_paise !== undefined ? Number(deposit_paise) : currentSettings.deposit_paise,
      is_verified: is_verified !== undefined ? Boolean(is_verified) : Boolean(currentSettings.is_verified ?? true),
      super_host: super_host !== undefined ? Boolean(super_host) : Boolean(currentSettings.super_host),
      is_featured: is_featured !== undefined ? Boolean(is_featured) : Boolean(currentSettings.is_featured),
      listing_status: newStatus,
      approval_status: newStatus === 'published' ? 'approved' : (newStatus === 'rejected' ? 'rejected' : 'pending'),
      amenities: Array.isArray(amenities) ? amenities : currentSettings.amenities,
      rules: Array.isArray(rules) ? rules : currentSettings.rules,
      images: propImages,
      coverImage: propImages && propImages.length > 0 ? propImages[0] : currentSettings.coverImage,
      last_edited_at: new Date().toISOString(),
      last_edited_by: adminUser.email,
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
    message: `Property listing ${action === 'edit' || action === 'edit_property' ? 'updated' : action + 'd'} successfully.`,
  })
}
