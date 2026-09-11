import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { cleanMobile, isValidMobile, generateTenantId } from '@/lib/profiles'
import { queryCollection } from '@/lib/firebase/firestore'

/**
 * GET /api/tenants/lookup?phone=9876543210
 * Unifies tenant identity across self-registered profiles and PG owner check-ins.
 * Returns pre-fillable tenant details, stay history, and their single permanent Unique Tenant ID.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const primaryProfile = tenantProfiles[0] || null
    const latestResident = residents && residents.length > 0 ? residents[0] : null

    // Determine the permanent Unique Tenant ID:
    // Check if latest resident or profile already has a TN... ID
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

    // Fetch details of previous stays if residents exist
    let stays: any[] = []
    if (residents && residents.length > 0) {
      const orgIds = Array.from(new Set(residents.map((r) => r.organization_id)))
      const { data: orgs } = await serviceClient
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)

      const orgMap = new Map((orgs || []).map((o) => [o.id, o.name]))

      stays = residents.map((r) => ({
        resident_id: r.id,
        organization_id: r.organization_id,
        organization_name: orgMap.get(r.organization_id) || 'PG Property',
        registration_number: r.registration_number,
        status: r.status,
        check_in_date: r.created_at ? r.created_at.split('T')[0] : null,
      }))
    }

    const isFound = Boolean(latestResident || primaryProfile)

    // Build the resolved data object
    const result = {
      found: isFound,
      tenant_id: unifiedTenantId,
      full_name: latestResident?.full_name || primaryProfile?.full_name || '',
      phone: cleanedPhone,
      alternate_phone: latestResident?.alternate_phone || '',
      email: latestResident?.email || primaryProfile?.email || '',
      date_of_birth: latestResident?.date_of_birth || primaryProfile?.dob || '',
      gender: latestResident?.gender || primaryProfile?.gender || 'male',
      permanent_address: latestResident?.permanent_address || '',
      permanent_city: latestResident?.permanent_city || primaryProfile?.current_city || '',
      permanent_state: latestResident?.permanent_state || '',
      permanent_pincode: latestResident?.permanent_pincode || '',
      emergency_name: latestResident?.emergency_name || '',
      emergency_phone: latestResident?.emergency_phone || '',
      emergency_relation: latestResident?.emergency_relation || 'Parent',
      id_type: latestResident?.id_type || 'aadhaar',
      id_number: latestResident?.id_number || '',
      kyc_verified: kycVerified || Boolean(primaryProfile?.verified_mobile),
      source: latestResident ? 'existing_resident' : primaryProfile ? 'tenant_profile' : 'new',
      stays,
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[Tenant Lookup Error]:', err?.message)
    return NextResponse.json({ error: err.message || 'Lookup failed' }, { status: 500 })
  }
}
