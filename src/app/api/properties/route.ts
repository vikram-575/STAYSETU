import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { PropertyListing, PropertyType, SharingType } from '@/types/marketplace'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const propertyType = searchParams.get('type')
    const query = searchParams.get('q')?.toLowerCase()

    // Query active properties from database
    const { data: properties, error: propErr } = await supabase
      .from('properties')
      .select(`
        id, name, city, state, address, pincode, phone, email, description,
        is_active, created_at, settings, organization_id,
        organizations (id, name, phone, email, created_at)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (propErr) {
      console.error('Failed to query properties:', propErr)
      return NextResponse.json({ success: false, error: propErr.message }, { status: 500 })
    }

    const propList = properties || []
    const propIds = propList.map((p) => p.id)

    // Fetch related buildings, floors, rooms, and beds
    const { data: buildings } = propIds.length > 0
      ? await supabase.from('buildings').select('id, property_id').in('property_id', propIds)
      : { data: [] }

    const bldgIds = (buildings || []).map((b) => b.id)

    const { data: floors } = bldgIds.length > 0
      ? await supabase.from('floors').select('id, building_id').in('building_id', bldgIds)
      : { data: [] }

    const floorIds = (floors || []).map((f) => f.id)

    const { data: rooms } = floorIds.length > 0
      ? await supabase.from('rooms').select('id, floor_id, room_number, base_rent_paise, capacity, room_type').in('floor_id', floorIds)
      : { data: [] }

    const roomIds = (rooms || []).map((r) => r.id)

    const { data: beds } = roomIds.length > 0
      ? await supabase.from('beds').select('id, room_id, status').in('room_id', roomIds)
      : { data: [] }

    // Index by foreign keys
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

    const listings: PropertyListing[] = propList.map((prop: any) => {
      const propBldgs = bldgByProp.get(prop.id) || []
      const propFloors = propBldgs.flatMap((bId) => floorByBldg.get(bId) || [])
      const propRooms = propFloors.flatMap((fId) => roomsByFloor.get(fId) || [])
      const propBeds = propRooms.flatMap((r) => bedsByRoom.get(r.id) || [])

      const totalBeds = propBeds.length || propRooms.reduce((sum: number, r: any) => sum + (r.capacity || 1), 0) || 10
      const availableBeds = propBeds.filter((b: any) => b.status === 'available').length || totalBeds

      const minRentPaise = propRooms.length > 0
        ? Math.min(...propRooms.map((r: any) => r.base_rent_paise || 600000))
        : 600000

      const price = Math.round(minRentPaise / 100)
      const settings = prop.settings || {}

      let sharingType: SharingType = 'Double Sharing'
      if (propRooms.length > 0 && propRooms[0].capacity === 1) sharingType = 'Single Room'
      else if (propRooms.length > 0 && propRooms[0].capacity === 3) sharingType = 'Triple Sharing'

      const joinedYear = prop.organizations?.created_at
        ? new Date(prop.organizations.created_at).getFullYear()
        : 2026

      const propImages = settings.images && settings.images.length > 0
        ? settings.images
        : defaultImages

      return {
        id: prop.id,
        title: prop.name,
        slug: prop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: settings.tagline || `Verified living space in ${prop.city || 'India'}`,
        propertyType: (settings.property_type as PropertyType) || 'pg',
        genderPreference: settings.gender_preference || 'coed',
        city: prop.city || 'India',
        locality: settings.locality || prop.city || 'Central',
        fullAddress: prop.address || `${prop.name}, ${prop.city}`,
        pincode: prop.pincode || '',
        distanceToMetro: settings.distance_to_metro || 'Accessible to transit',
        nearestLandmark: settings.nearest_landmark || 'Main Road',
        price,
        deposit: price * 2,
        maintenance: settings.maintenance_charges || 0,
        lockInPeriod: settings.lock_in_period || '1 Month',
        noticePeriod: settings.notice_period || '30 Days',
        electricityPolicy: settings.electricity_policy || 'Actual Sub-meter units',
        sharingType,
        furnishing: settings.furnishing || 'fully_furnished',
        foodIncluded: Boolean(settings.food_included),
        foodDetails: settings.food_details || undefined,
        images: propImages,
        coverImage: propImages[0],
        rating: settings.rating || 0,
        reviewCount: settings.review_count || 0,
        verified: true,
        superHost: Boolean(settings.super_host),
        zeroBrokerage: true,
        featured: Boolean(settings.is_featured),
        amenities: settings.amenities || ['wifi', 'power_backup', 'cctv', 'housekeeping', 'water_purifier'],
        rules: Array.isArray(settings.rules) && typeof settings.rules[0] === 'string'
          ? settings.rules
          : ['Gate closes at 11:00 PM', 'Visitors allowed during day only'],
        coordinates: settings.coordinates || { lat: 28.5355, lng: 77.391 },
        availableFrom: settings.available_from || 'Immediate',
        totalBeds,
        availableBeds,
        postedAt: prop.created_at ? new Date(prop.created_at).toLocaleDateString('en-IN') : 'Recently',
        owner: {
          name: prop.organizations?.name || 'Verified Landlord',
          phone: prop.organizations?.phone || prop.phone || '',
          whatsapp: (prop.organizations?.phone || prop.phone) ? '91' + (prop.organizations?.phone || prop.phone).replace(/\D/g, '') : '',
          email: prop.organizations?.email || prop.email || '',
          responseRate: '100%',
          responseTime: settings.response_time || 'Within 24 hours',
          verified: true,
          propertiesCount: 1,
        },
      }
    })

    let filtered = listings

    if (city && city !== 'all') {
      filtered = filtered.filter((l) => l.city.toLowerCase() === city.toLowerCase())
    }

    if (propertyType && propertyType !== 'all') {
      filtered = filtered.filter((l) => l.propertyType === propertyType)
    }

    if (query) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.city.toLowerCase().includes(query) ||
          l.locality.toLowerCase().includes(query) ||
          l.fullAddress.toLowerCase().includes(query)
      )
    }

    return NextResponse.json({
      success: true,
      total: filtered.length,
      properties: filtered,
    })
  } catch (err: any) {
    console.error('Error in /api/properties:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}