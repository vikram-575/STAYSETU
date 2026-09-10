import { NextResponse, type NextRequest } from 'next/server'
import {
  generateTenantId,
  generateOwnerId,
  cleanMobile,
  isValidMobile,
} from '@/lib/profiles'
import { queryCollection, createDocument, getDocument } from '@/lib/firebase/firestore'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

const TENANT_COL = 'tenant_profiles'
const OWNER_COL = 'owner_profiles'

// ─── GET: List all or lookup by mobile ──────────────────────────────────────
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const type = url.searchParams.get('type') || 'tenant'
  const mobile = url.searchParams.get('mobile')
  const all = url.searchParams.get('all') === 'true'
  const search = url.searchParams.get('search')?.toLowerCase().trim()
  const city = url.searchParams.get('city')
  const status = url.searchParams.get('status')
  const limit = Number(url.searchParams.get('limit')) || 200

  const collection = type === 'owner' ? OWNER_COL : TENANT_COL

  try {
    // Lookup by mobile
    if (mobile) {
      const cleanedMobile = cleanMobile(mobile)
      const results = await queryCollection(collection, [['mobile', '==', cleanedMobile]])
      if (results.length === 0) {
        return NextResponse.json({ found: false, profile: null })
      }
      return NextResponse.json({ found: true, profile: results[0] })
    }

    // Admin: list all profiles
    if (all) {
      const isAdmin = isSuperAdminFromRequest(request)
      if (!isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const filters: Array<[string, any, any]> = []
      if (city) filters.push(['operating_cities', 'array-contains', city])
      if (status) filters.push(['profile_status', '==', status])

      const profiles = await queryCollection(
        collection,
        filters,
        { field: 'created_at', direction: 'desc' },
        limit
      )

      let filtered = profiles
      if (search) {
        filtered = profiles.filter((p: any) =>
          p.full_name?.toLowerCase().includes(search) ||
          p.mobile?.includes(search) ||
          p.id?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.current_city?.toLowerCase().includes(search)
        )
      }

      return NextResponse.json({ success: true, profiles: filtered, total: filtered.length })
    }

    // Public: list tenant profiles for owners to browse, or owner profiles for tenants
    // Tenants looking at PG owner profiles — show limited public info
    const filters: Array<[string, any, any]> = [['profile_status', '==', 'active']]
    if (city) {
      if (type === 'tenant') {
        filters.push(['preferred_cities', 'array-contains', city])
      } else {
        filters.push(['operating_cities', 'array-contains', city])
      }
    }

    const profiles = await queryCollection(
      collection,
      filters,
      { field: 'created_at', direction: 'desc' },
      50
    )

    // Sanitize - remove sensitive fields for public view
    const sanitized = profiles.map((p: any) => ({
      id: p.id,
      type: p.type,
      full_name: p.full_name,
      current_city: p.current_city,
      preferred_cities: p.preferred_cities || p.operating_cities,
      preferred_room_type: p.preferred_room_type,
      budget_min_paise: p.budget_min_paise,
      budget_max_paise: p.budget_max_paise,
      required_amenities: p.required_amenities,
      profession: p.profession,
      gender: p.gender,
      move_in_date: p.move_in_date,
      property_types: p.property_types,
      total_beds_approx: p.total_beds_approx,
      operating_cities: p.operating_cities,
      created_at: p.created_at,
    }))

    return NextResponse.json({ success: true, profiles: sanitized })
  } catch (err: any) {
    console.error('[Profiles GET]', err?.message)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}

// ─── POST: Create new profile ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (!type || !['tenant', 'owner'].includes(type)) {
      return NextResponse.json({ error: 'Profile type must be "tenant" or "owner"' }, { status: 400 })
    }

    // Validate mobile
    if (!data.mobile) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 })
    }
    const cleanedMobile = cleanMobile(data.mobile)
    if (!isValidMobile(cleanedMobile)) {
      return NextResponse.json({ error: 'Invalid mobile number. Must be 10-digit Indian mobile.' }, { status: 400 })
    }

    // Validate name
    if (!data.full_name?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const collection = type === 'owner' ? OWNER_COL : TENANT_COL

    // Check uniqueness: mobile must be unique within the same collection
    const existing = await queryCollection(collection, [['mobile', '==', cleanedMobile]])
    if (existing.length > 0) {
      const profileId = existing[0].id
      return NextResponse.json(
        {
          error: `A ${type} profile already exists for this mobile number. Your Profile ID is: ${profileId}`,
          existing_profile_id: profileId,
          duplicate: true,
        },
        { status: 409 }
      )
    }

    // Generate unique ID
    let profileId: string
    let attempts = 0
    do {
      profileId = type === 'tenant' ? generateTenantId() : generateOwnerId()
      const conflict = await getDocument(collection, profileId)
      if (!conflict) break
      attempts++
    } while (attempts < 10)

    // Build the profile document
    const now = new Date().toISOString()
    const profileData: Record<string, any> = {
      ...data,
      type,
      mobile: cleanedMobile,
      full_name: data.full_name.trim(),
      email: data.email?.trim().toLowerCase() || null,
      profile_status: 'active',
      verified_mobile: false,
      created_at: now,
      updated_at: now,
    }

    if (type === 'tenant') {
      profileData.preferred_cities = data.preferred_cities || []
      profileData.required_amenities = data.required_amenities || []
      profileData.preferred_room_type = data.preferred_room_type || 'any'
      profileData.budget_min_paise = Number(data.budget_min_paise) || 500000
      profileData.budget_max_paise = Number(data.budget_max_paise) || 1500000
      profileData.current_city = data.current_city || ''
    } else {
      profileData.operating_cities = data.operating_cities || []
      profileData.property_types = data.property_types || ['pg']
      profileData.total_beds_approx = Number(data.total_beds_approx) || 0
    }

    const created = await createDocument(collection, profileData, profileId)

    return NextResponse.json({
      success: true,
      profile_id: profileId,
      profile: created,
      message: `Profile created successfully! Your unique ID is ${profileId}`,
    }, { status: 201 })
  } catch (err: any) {
    console.error('[Profiles POST]', err?.message)
    return NextResponse.json({ error: err.message || 'Failed to create profile' }, { status: 500 })
  }
}
