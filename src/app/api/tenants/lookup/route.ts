import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'
import { cleanMobile, isValidMobile, generateTenantId } from '@/lib/profiles'
import { queryCollection } from '@/lib/firebase/firestore'

/**
 * GET /api/tenants/lookup?phone=9876543210
 * Unifies tenant identity across self-registered profiles and PG owner check-ins.
 * Returns pre-fillable tenant details, active stay verification (PG name, PG mobile no), stay history, and single permanent Unique Tenant ID.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentOrgId = (await resolveEffectiveOrgId(user)) || user.organization_id

    const rawPhone = request.nextUrl.searchParams.get('phone') || ''
    const cleanedPhone = cleanMobile(rawPhone)

    if (!cleanedPhone || cleanedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit mobile number is required for lookup.' },
        { status: 400 }
      )
    }

    const serviceClient = await createServiceClient()

    // 1. Search in Supabase residents table (across all organizations)
    const { data: residents } = await serviceClient
      .from('residents')
      .select(`
        id,
        organization_id,
        registration_number,
        full_name,
        phone,
        alternate_phone,
        email,
        date_of_birth,
        gender,
        permanent_address,
        permanent_city,
        permanent_state,
        permanent_pincode,
        emergency_name,
        emergency_phone,
        emergency_relation,
        id_type,
        id_number,
        status,
        created_at
      `)
      .or(`phone.ilike.%${cleanedPhone}%,alternate_phone.ilike.%${cleanedPhone}%`)
      .order('created_at', { ascending: false })

    // 2. Search in tenant_profiles (self-registered on website/app)
    let tenantProfiles: any[] = []
    try {
      tenantProfiles = await queryCollection('tenant_profiles', [['mobile', '==', cleanedPhone]])
    } catch {
      // Ignore if Firestore is unavailable
    }

    // 3. Search in Supabase users table (Users registered via mobile OTP or portal)
    const { data: userRecord } = await serviceClient
      .from('users')
      .select('id, full_name, email, phone, role')
      .ilike('phone', `%${cleanedPhone}%`)
      .maybeSingle()

    const primaryProfile = tenantProfiles[0] || null
    const latestResident = residents && residents.length > 0 ? residents[0] : null

    // Determine the permanent Unique Tenant ID:
    let unifiedTenantId: string | null = null

    // Priority 1: Check if any resident record already has a TN... registration_number
    const residentWithTn = residents?.find((r) => r.registration_number?.startsWith('TN'))
    if (residentWithTn) {
      unifiedTenantId = residentWithTn.registration_number
    } else if (primaryProfile?.id && primaryProfile.id.startsWith('TN')) {
      // Priority 2: Use tenant_profile ID if starting with TN
      unifiedTenantId = primaryProfile.id
    } else if (latestResident?.registration_number) {
      // Priority 3: Fallback to existing registration number
      unifiedTenantId = latestResident.registration_number
    }

    // If still no ID found, generate a fresh canonical Tenant ID
    if (!unifiedTenantId) {
      unifiedTenantId = generateTenantId()
    }

    // Check KYC status for this tenant
    let kycVerified = false
    if (residents && residents.length > 0) {
      const resIds = residents.map((r) => r.id)
      const { data: kycRecords } = await serviceClient
        .from('tenant_kyc')
        .select('id, verification_status')
        .in('tenant_id', resIds)
        .eq('verification_status', 'verified')
        .limit(1)

      if (kycRecords && kycRecords.length > 0) {
        kycVerified = true
      }
    }

    // ── CHECK IF RESIDENT IS CURRENTLY ACTIVELY CHECKED IN AT ANY PG ──
    const activeResident = residents?.find((r) => r.status === 'active' || r.status === 'temporarily_absent')
    let activeStay: any = null

    if (activeResident) {
      const [
        { data: orgData },
        { data: activeAssignment }
      ] = await Promise.all([
        serviceClient
          .from('organizations')
          .select('id, name, slug, phone, email, address, city, state, pincode, owner_user_id')
          .eq('id', activeResident.organization_id)
          .maybeSingle(),
        serviceClient
          .from('resident_assignments')
          .select(`
            id,
            check_in_date,
            monthly_rent_paise,
            beds(
              id,
              bed_label,
              rooms(
                id,
                room_number,
                name,
                floor_id,
                floors(
                  id,
                  name,
                  building_id,
                  buildings(
                    id,
                    name,
                    property_id,
                    properties(
                      id,
                      name,
                      phone,
                      address,
                      city,
                      state
                    )
                  )
                )
              )
            )
          `)
          .eq('resident_id', activeResident.id)
          .is('check_out_date', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ])

      // Fallback: if organization phone is missing, lookup owner user's mobile number
      let pgContactMobile = orgData?.phone || ''
      if (!pgContactMobile && orgData?.owner_user_id) {
        const { data: ownerUser } = await serviceClient
          .from('users')
          .select('phone, full_name')
          .eq('id', orgData.owner_user_id)
          .maybeSingle()
        if (ownerUser?.phone) {
          pgContactMobile = ownerUser.phone
        }
      }
      if (!pgContactMobile) {
        const { data: anyOwner } = await serviceClient
          .from('users')
          .select('phone, full_name')
          .eq('organization_id', activeResident.organization_id)
          .eq('role', 'owner')
          .not('phone', 'is', null)
          .limit(1)
          .maybeSingle()
        if (anyOwner?.phone) {
          pgContactMobile = anyOwner.phone
        }
      }

      const bedData = (activeAssignment as any)?.beds
      const roomData = bedData?.rooms
      const floorData = roomData?.floors
      const buildingData = floorData?.buildings
      const propertyData = buildingData?.properties

      const finalPgName = orgData?.name || propertyData?.name || 'PG Partner'
      const finalPgPhone = pgContactMobile || propertyData?.phone || ''
      const isSameOrg = Boolean(currentOrgId && currentOrgId === activeResident.organization_id)

      activeStay = {
        is_active: true,
        resident_id: activeResident.id,
        resident_name: activeResident.full_name,
        registration_number: activeResident.registration_number,
        check_in_date: activeAssignment?.check_in_date || (activeResident.created_at ? activeResident.created_at.split('T')[0] : null),
        organization_id: activeResident.organization_id,
        pg_name: finalPgName,
        pg_mobile: finalPgPhone,
        pg_email: orgData?.email || '',
        pg_city: orgData?.city || propertyData?.city || '',
        pg_address: orgData?.address || propertyData?.address || '',
        property_name: propertyData?.name || finalPgName,
        building_name: buildingData?.name || '',
        floor_name: floorData?.name || '',
        room_number: roomData?.room_number || null,
        bed_label: bedData?.bed_label || null,
        monthly_rent_paise: activeAssignment?.monthly_rent_paise || null,
        is_same_pg: isSameOrg,
      }
    }

    // Fetch details of previous stays if residents exist
    let stays: any[] = []
    if (residents && residents.length > 0) {
      const orgIds = Array.from(new Set(residents.map((r) => r.organization_id)))
      const { data: orgs } = await serviceClient
        .from('organizations')
        .select('id, name, phone, city, address')
        .in('id', orgIds)

      const orgMap = new Map((orgs || []).map((o) => [o.id, o]))

      stays = residents.map((r) => {
        const orgInfo = orgMap.get(r.organization_id)
        return {
          resident_id: r.id,
          organization_id: r.organization_id,
          organization_name: orgInfo?.name || 'PG Property',
          organization_phone: orgInfo?.phone || '',
          organization_city: orgInfo?.city || '',
          registration_number: r.registration_number,
          status: r.status,
          check_in_date: r.created_at ? r.created_at.split('T')[0] : null,
        }
      })
    }

    const isFound = Boolean(latestResident || primaryProfile || userRecord)

    // Build the resolved data object
    const result = {
      found: isFound,
      already_exists: isFound,
      is_currently_checked_in: Boolean(activeStay),
      active_stay: activeStay,
      tenant_id: unifiedTenantId,
      full_name: latestResident?.full_name || primaryProfile?.full_name || userRecord?.full_name || '',
      phone: cleanedPhone,
      alternate_phone: latestResident?.alternate_phone || primaryProfile?.alternate_phone || '',
      email: latestResident?.email || primaryProfile?.email || userRecord?.email || '',
      date_of_birth: latestResident?.date_of_birth || primaryProfile?.dob || '',
      gender: latestResident?.gender || primaryProfile?.gender || 'male',
      permanent_address: latestResident?.permanent_address || primaryProfile?.permanent_address || '',
      permanent_city: latestResident?.permanent_city || primaryProfile?.current_city || '',
      permanent_state: latestResident?.permanent_state || primaryProfile?.permanent_state || '',
      permanent_pincode: latestResident?.permanent_pincode || primaryProfile?.permanent_pincode || '',
      emergency_name: latestResident?.emergency_name || primaryProfile?.emergency_name || '',
      emergency_phone: latestResident?.emergency_phone || primaryProfile?.emergency_phone || '',
      emergency_relation: latestResident?.emergency_relation || primaryProfile?.emergency_relation || 'Parent',
      id_type: latestResident?.id_type || primaryProfile?.id_type || 'aadhaar',
      id_number: latestResident?.id_number || primaryProfile?.aadhaar_number || '',
      kyc_verified: kycVerified || Boolean(primaryProfile?.verified_mobile) || Boolean(primaryProfile?.aadhaar_verified),
      profession: primaryProfile?.profession || 'Corporate Professional',
      source: latestResident ? 'existing_resident' : primaryProfile ? 'tenant_profile' : userRecord ? 'registered_user' : 'new',
      stays,
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[Tenant Lookup Error]:', err?.message)
    return NextResponse.json({ error: err.message || 'Lookup failed' }, { status: 500 })
  }
}
