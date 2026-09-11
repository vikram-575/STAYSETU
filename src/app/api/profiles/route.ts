import { NextResponse, type NextRequest } from 'next/server'
import {
  generateTenantId,
  generateOwnerId,
  cleanMobile,
  isValidMobile,
} from '@/lib/profiles'
import { queryCollection, createDocument, getDocument } from '@/lib/firebase/firestore'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

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
      let results = await queryCollection(collection, [['mobile', '==', cleanedMobile]])

      // If tenant, cross-check Supabase residents to ensure unified identity with PG owner registrations
      if (type === 'tenant') {
        try {
          const serviceClient = await createServiceClient()
          const { data: dbResidents } = await serviceClient
            .from('residents')
            .select(`
              id, organization_id, registration_number, full_name, phone,
              email, date_of_birth, gender, permanent_address, permanent_city,
              permanent_state, permanent_pincode, emergency_name, emergency_phone,
              emergency_relation, id_type, id_number, status, created_at
            `)
            .or(`phone.ilike.%${cleanedMobile}%,alternate_phone.ilike.%${cleanedMobile}%`)
            .order('created_at', { ascending: false })

          if (dbResidents && dbResidents.length > 0) {
            const latestRes = dbResidents[0]
            // Fetch live stay information from v_resident_current
            const { data: currentView } = await serviceClient
              .from('v_resident_current')
              .select('*')
              .eq('resident_id', latestRes.id)
              .maybeSingle()

            const { data: org } = await serviceClient
              .from('organizations')
              .select('name')
              .eq('id', latestRes.organization_id)
              .maybeSingle()

            const currentStay = {
              organization_name: org?.name || 'PG Property',
              property_name: currentView?.property_name || null,
              room_number: currentView?.room_number || null,
              bed_label: currentView?.bed_label || null,
              monthly_rent_paise: currentView?.monthly_rent_paise || null,
              total_outstanding_paise: currentView?.total_outstanding_paise || 0,
              status: latestRes.status,
              check_in_date: currentView?.check_in_date || (latestRes.created_at ? latestRes.created_at.split('T')[0] : null),
              registration_number: latestRes.registration_number,
            }

            if (results.length > 0) {
              // Enrich existing profile with stay details & ensure ID matches
              const enriched = {
                ...results[0],
                id: results[0].id || latestRes.registration_number,
                current_stay: currentStay,
              }
              return NextResponse.json({ found: true, profile: enriched })
            } else {
              // Synthesize profile from PG Owner resident record
              const synthesized = {
                id: latestRes.registration_number,
                type: 'tenant',
                full_name: latestRes.full_name,
                mobile: cleanedMobile,
                email: latestRes.email || undefined,
                dob: latestRes.date_of_birth || undefined,
                gender: latestRes.gender || undefined,
                current_city: latestRes.permanent_city || '',
                preferred_cities: [latestRes.permanent_city || 'Noida'],
                budget_min_paise: currentView?.monthly_rent_paise || 500000,
                budget_max_paise: (currentView?.monthly_rent_paise || 500000) * 1.5,
                required_amenities: ['wifi', 'ac'],
                preferred_room_type: 'any',
                profile_status: 'active',
                verified_mobile: true,
                created_at: latestRes.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                current_stay: currentStay,
              }
              try {
                await createDocument(TENANT_COL, synthesized, latestRes.registration_number)
              } catch {}

              return NextResponse.json({ found: true, profile: synthesized })
            }
          }
        } catch (dbErr: any) {
          console.warn('[Profiles GET Supabase sync warning]:', dbErr?.message)
        }
      }

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

    // Generate or Reuse unique ID
    let profileId: string | null = null

    // For tenants, check if an existing resident in Supabase already has a Unique Tenant ID
    if (type === 'tenant') {
      try {
        const serviceClient = await createServiceClient()
        const { data: dbRes } = await serviceClient
          .from('residents')
          .select('registration_number')
          .or(`phone.ilike.%${cleanedMobile}%,alternate_phone.ilike.%${cleanedMobile}%`)
          .order('created_at', { ascending: false })

        const resWithTn = dbRes?.find((r) => r.registration_number?.startsWith('TN'))
        if (resWithTn) {
          profileId = resWithTn.registration_number
        } else if (dbRes && dbRes.length > 0 && dbRes[0].registration_number) {
          profileId = dbRes[0].registration_number
        }
      } catch (checkErr: any) {
        console.warn('[Profiles POST Supabase lookup warning]:', checkErr?.message)
      }
    }

    if (!profileId) {
      let attempts = 0
      do {
        profileId = type === 'tenant' ? generateTenantId() : generateOwnerId()
        const conflict = await getDocument(collection, profileId)
        if (!conflict) break
        attempts++
      } while (attempts < 10)
    }

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
