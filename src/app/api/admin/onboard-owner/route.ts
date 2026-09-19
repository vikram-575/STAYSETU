import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { cleanMobile } from '@/lib/profiles'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function verifySuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) {
    return { email: 'vikramtomar0505@gmail.com', role: 'superadmin' }
  }
  const user = await getAuthenticatedUser()
  if (user && (user.role === 'superadmin' || user.email === 'vikramtomar0505@gmail.com')) {
    return user
  }
  return null
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

/**
 * GET /api/admin/onboard-owner
 * Lists all registered PG Owners, segregating pending locked owners who need onboarding
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifySuperAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()

    // 1. Fetch all Firestore owner profiles
    let firestoreOwners: any[] = []
    try {
      const { queryDocuments } = await import('@/lib/firebase/firestore')
      firestoreOwners = await queryDocuments('owner_profiles', [])
    } catch (fErr: any) {
      console.warn('[Admin Onboard Owner GET Firestore warning]:', fErr?.message)
    }

    // 2. Fetch Supabase users with role 'owner'
    const { data: dbOwners } = await serviceClient
      .from('users')
      .select('id, full_name, email, phone, role, organization_id, created_at')
      .eq('role', 'owner')
      .order('created_at', { ascending: false })

    // 3. Fetch organizations for lookup
    const { data: dbOrgs } = await serviceClient
      .from('organizations')
      .select('id, name, city, address, created_at')

    const orgMap = new Map((dbOrgs || []).map((o) => [o.id, o]))

    // 4. Fetch all properties from Supabase to track website listings
    const { data: dbProps } = await serviceClient
      .from('properties')
      .select('id, name, city, address, organization_id, is_active, created_at')
      .order('created_at', { ascending: false })

    const propsByOrg = new Map<string, any[]>()
    for (const p of dbProps || []) {
      if (p.organization_id) {
        const list = propsByOrg.get(p.organization_id) || []
        list.push(p)
        propsByOrg.set(p.organization_id, list)
      }
    }
    const websitePropertiesCount = (dbProps || []).filter((p) => p.is_active !== false).length

    // Merge and deduplicate owner records
    const processedMobiles = new Set<string>()
    const allOwners: any[] = []

    // Add from Firestore
    for (const fOwner of firestoreOwners) {
      const mobile = cleanMobile(fOwner.mobile || '')
      if (mobile) processedMobiles.add(mobile)

      const matchedDbUser = (dbOwners || []).find(
        (u) => cleanMobile(u.phone || '') === mobile || u.id === fOwner.user_id
      )
      const orgId = fOwner.organization_id || matchedDbUser?.organization_id
      const isPlaceholderOrg = orgId === 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98'
      const linkedOrg = orgId && !isPlaceholderOrg ? orgMap.get(orgId) : null
      const orgProps = orgId && !isPlaceholderOrg ? (propsByOrg.get(orgId) || []) : []

      const isPending =
        fOwner.erp_unlocked === false ||
        fOwner.onboarding_status === 'pending_superadmin' ||
        fOwner.onboarding_status === 'unlocked_pending_pg' ||
        !orgId ||
        isPlaceholderOrg ||
        orgProps.length === 0

      const isLocked = fOwner.erp_unlocked === false || fOwner.onboarding_status === 'pending_superadmin'
      const ownerStatus = isPending
        ? isLocked
          ? 'pending_superadmin'
          : 'unlocked_pending_pg'
        : 'completed'

      allOwners.push({
        id: fOwner.id,
        user_id: fOwner.user_id || matchedDbUser?.id || null,
        full_name: fOwner.full_name || matchedDbUser?.full_name || 'PG Owner',
        mobile,
        email: fOwner.email || matchedDbUser?.email || '',
        dob: fOwner.dob || '',
        gender: fOwner.gender || 'male',
        city: fOwner.city || linkedOrg?.city || '',
        onboarding_status: ownerStatus,
        erp_unlocked: !isLocked,
        can_list_properties: !isPending,
        organization_id: isPlaceholderOrg ? null : (orgId || null),
        organization_name: linkedOrg?.name || fOwner.property_name || null,
        properties_count: orgProps.length,
        properties: orgProps,
        created_at: fOwner.created_at || matchedDbUser?.created_at || new Date().toISOString(),
      })
    }

    // Add Supabase owners that were not in Firestore
    for (const dbOwner of dbOwners || []) {
      const mobile = cleanMobile(dbOwner.phone || '')
      if (mobile && processedMobiles.has(mobile)) continue
      if (mobile) processedMobiles.add(mobile)

      const orgId = dbOwner.organization_id
      const isPlaceholderOrg = orgId === 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98'
      const linkedOrg = orgId && !isPlaceholderOrg ? orgMap.get(orgId) : null
      const orgProps = orgId && !isPlaceholderOrg ? (propsByOrg.get(orgId) || []) : []

      const isPending = !orgId || isPlaceholderOrg || orgProps.length === 0
      const ownerStatus = isPending ? 'pending_superadmin' : 'completed'

      allOwners.push({
        id: `OW-${mobile.slice(-4)}-${dbOwner.id.slice(0, 4).toUpperCase()}`,
        user_id: dbOwner.id,
        full_name: dbOwner.full_name || 'PG Owner',
        mobile,
        email: dbOwner.email || '',
        dob: '',
        gender: 'male',
        city: linkedOrg?.city || '',
        onboarding_status: ownerStatus,
        erp_unlocked: !isPending,
        can_list_properties: !isPending,
        organization_id: isPlaceholderOrg ? null : (orgId || null),
        organization_name: linkedOrg?.name || null,
        properties_count: orgProps.length,
        properties: orgProps,
        created_at: dbOwner.created_at,
      })
    }

    const pendingOwners = allOwners.filter(
      (o) => o.onboarding_status === 'pending_superadmin' || o.onboarding_status === 'unlocked_pending_pg'
    )
    const onboardedOwners = allOwners.filter(
      (o) => o.onboarding_status !== 'pending_superadmin' && o.onboarding_status !== 'unlocked_pending_pg'
    )

    return NextResponse.json({
      success: true,
      pendingOwners,
      onboardedOwners,
      websitePropertiesCount,
      totalCount: allOwners.length,
      pendingCount: pendingOwners.length,
    })
  } catch (err: any) {
    console.error('[Admin Onboard Owner GET Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to load owners' }, { status: 500 })
  }
}

/**
 * POST /api/admin/onboard-owner
 * SuperAdmin completes onboarding and unlocks ERP + property listing for a PG Owner
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifySuperAdmin(request)
    if (!admin) {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
    }

    const body = await request.json()
    const {
      action,
      userId,
      mobile,
      property_name,
      city,
      address,
      pg_type,
      approx_rooms,
      starting_rent,
      rejection_reason,
    } = body

    const serviceClient = await createServiceClient()
    const cleanedMobile = cleanMobile(mobile || '')

    // 1. Locate the Supabase user
    let targetUser: any = null
    if (userId) {
      const { data } = await serviceClient.from('users').select('*').eq('id', userId).maybeSingle()
      targetUser = data
    }
    if (!targetUser && cleanedMobile.length >= 10) {
      const { data } = await serviceClient
        .from('users')
        .select('*')
        .or(`phone.ilike.%${cleanedMobile}%,phone.eq.${cleanedMobile}`)
        .maybeSingle()
      targetUser = data
    }

    // If user does not exist in Supabase users table yet, create user row
    if (!targetUser) {
      const { data: newUser, error: userErr } = await serviceClient
        .from('users')
        .insert({
          full_name: property_name ? `${property_name} Owner` : 'PG Owner',
          phone: cleanedMobile,
          email: (body.email && body.email.trim()) ? body.email.trim().toLowerCase() : '',
          role: 'owner',
        })
        .select('*')
        .single()

      if (userErr || !newUser) {
        throw new Error(`Failed to initialize user: ${userErr?.message || 'Database error'}`)
      }
      targetUser = newUser
    }

    // Handle rejection
    if (action === 'reject') {
      try {
        const { queryDocuments, updateDocument } = await import('@/lib/firebase/firestore')
        if (cleanedMobile) {
          const docs = await queryDocuments('owner_profiles', [{ field: 'mobile', operator: '==', value: cleanedMobile }])
          if (docs && docs.length > 0) {
            await updateDocument('owner_profiles', docs[0].id, {
              onboarding_status: 'rejected',
              rejection_reason: rejection_reason || 'Incomplete owner verification',
              updated_at: new Date().toISOString(),
              reviewed_by: admin.email || 'superadmin',
            })
          }
        }
      } catch (fErr) {}

      return NextResponse.json({
        success: true,
        message: 'Owner application marked as rejected.',
      })
    }

    // Action 1: UNLOCK ERP ACCESS ONLY (First step before PG onboarding)
    if (action === 'unlock_only') {
      try {
        const { queryDocuments, updateDocument } = await import('@/lib/firebase/firestore')
        if (cleanedMobile) {
          const docs = await queryDocuments('owner_profiles', [{ field: 'mobile', operator: '==', value: cleanedMobile }])
          if (docs && docs.length > 0) {
            await updateDocument('owner_profiles', docs[0].id, {
              erp_unlocked: true,
              onboarding_status: 'unlocked_pending_pg',
              reviewed_by: admin.email || 'superadmin',
              updated_at: new Date().toISOString(),
            })
          }
        }
      } catch (fErr) {}

      await serviceClient
        .from('users')
        .update({ is_active: true })
        .eq('id', targetUser.id)

      // Ensure Organization exists
      let userOrgId = targetUser.organization_id
      if (!userOrgId || userOrgId === 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98') {
        const orgName = `${targetUser.full_name || 'PG'} Stays`
        const { data: newOrg } = await serviceClient
          .from('organizations')
          .insert({
            name: orgName,
            slug: `${slugify(orgName)}-${Date.now().toString(36)}`,
            owner_user_id: targetUser.id,
            phone: targetUser.phone,
            email: targetUser.email,
            city: city || 'Bengaluru',
            currency_code: 'INR',
            timezone: 'Asia/Kolkata',
            settings: { plan: 'growth', subscription_status: 'active', is_verified: true },
          })
          .select('id')
          .single()
        if (newOrg) {
          userOrgId = newOrg.id
          await serviceClient.from('users').update({ organization_id: userOrgId }).eq('id', targetUser.id)
        }
      }

      // Check if property exists; if not, create draft pending listing so it syncs to Marketplace tab
      if (userOrgId) {
        const { data: existingProps } = await serviceClient
          .from('properties')
          .select('id')
          .eq('organization_id', userOrgId)
          .limit(1)

        if (!existingProps || existingProps.length === 0) {
          const draftName = `${targetUser.full_name || 'Verified'} PG Residence`
          await serviceClient.from('properties').insert({
            organization_id: userOrgId,
            name: draftName,
            city: city || 'Bengaluru',
            address: address || 'Main Road, City Center',
            phone: targetUser.phone,
            email: targetUser.email,
            starting_rent_paise: 800000,
            is_active: false, // draft pending approval in marketplace
            settings: {
              status: 'pending',
              pg_type: 'coliving',
              amenities: ['High-Speed WiFi', 'Power Backup', 'RO Water', 'CCTV Security'],
              rules: ['No smoking', 'Gate closes at 11:00 PM'],
            },
          })
        }
      }

      return NextResponse.json({
        success: true,
        status: 'unlocked_pending_pg',
        message: `ERP access unlocked for ${targetUser.full_name || 'Owner'}. A draft listing has been submitted to the Marketplace for review.`,
      })
    }

    // Action 2: ONBOARD PG PROPERTY & ADJUST ERP
    const propName = property_name?.trim() || `${targetUser.full_name || 'PG'} Property`
    const propCity = city?.trim() || 'Bangalore'
    const propAddress = address?.trim() || `${propCity}, India`
    const effectivePgType = pg_type || 'coliving'
    const roomCount = Math.max(1, Math.min(50, Number(approx_rooms) || 6))
    const rentPaise = starting_rent ? Number(starting_rent) * 100 : 750000

    // 2. Check if user already has an organization (ignoring placeholder org)
    let orgId = targetUser.organization_id
    let organization: any = null

    if (orgId && orgId !== 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98') {
      const { data: existingOrg } = await serviceClient
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle()
      organization = existingOrg
    }

    if (!organization) {
      // Provision fresh Organization
      const slug = `${slugify(propName)}-${Date.now().toString(36)}`
      const { data: newOrg, error: orgErr } = await serviceClient
        .from('organizations')
        .insert({
          name: propName,
          slug,
          owner_user_id: targetUser.id,
          phone: targetUser.phone,
          email: targetUser.email,
          city: propCity,
          address: propAddress,
          currency_code: 'INR',
          timezone: 'Asia/Kolkata',
          settings: {
            plan: 'enterprise',
            subscription_status: 'active',
            is_verified: true,
            verification_status: 'verified',
            pg_type: effectivePgType,
            approx_rooms: roomCount,
          },
        })
        .select('*')
        .single()

      if (orgErr || !newOrg) {
        throw new Error(`Failed to create organization: ${orgErr?.message || 'DB error'}`)
      }

      organization = newOrg
      orgId = newOrg.id

      // Link user to this organization and set role to owner
      await serviceClient
        .from('users')
        .update({ organization_id: orgId, role: 'owner' })
        .eq('id', targetUser.id)
    }

    // 3. Provision primary Property under this organization
    const { data: existingProps } = await serviceClient
      .from('properties')
      .select('id')
      .eq('organization_id', orgId)

    let propertyId: string | null = null
    if (!existingProps || existingProps.length === 0) {
      const { data: newProp } = await serviceClient
        .from('properties')
        .insert({
          organization_id: orgId,
          name: propName,
          city: propCity,
          address: propAddress,
          phone: targetUser.phone,
          email: targetUser.email,
          starting_rent_paise: rentPaise,
          is_active: true,
          settings: {
            pg_type: effectivePgType,
            amenities: ['High-Speed WiFi', 'Power Backup', 'RO Water', '3 Daily Meals', 'Air Conditioning', 'CCTV Security'],
            rules: ['Gate closes at 11:00 PM', 'Visitors in lounge only', 'No smoking inside rooms'],
          },
        })
        .select('id')
        .single()

      propertyId = newProp?.id || null

      // Provision Building, Floor, Rooms, Beds
      if (propertyId) {
        try {
          const { data: bld } = await serviceClient
            .from('buildings')
            .insert({ property_id: propertyId, name: 'Main Block' })
            .select('id')
            .single()

          if (bld) {
            const { data: flr } = await serviceClient
              .from('floors')
              .insert({ building_id: bld.id, floor_number: 1, name: 'First Floor' })
              .select('id')
              .single()

            if (flr) {
              for (let i = 1; i <= roomCount; i++) {
                const roomNum = `10${i}`
                const { data: rm } = await serviceClient
                  .from('rooms')
                  .insert({
                    organization_id: orgId,
                    property_id: propertyId,
                    floor_id: flr.id,
                    room_number: roomNum,
                    room_type: 'Double Sharing',
                    capacity: 2,
                    base_rent_paise: rentPaise,
                  })
                  .select('id')
                  .single()

                if (rm) {
                  await serviceClient.from('beds').insert([
                    { organization_id: orgId, room_id: rm.id, bed_label: `${roomNum}-A`, status: 'available' },
                    { organization_id: orgId, room_id: rm.id, bed_label: `${roomNum}-B`, status: 'available' },
                  ])
                }
              }
            }
          }
        } catch (setupErr: any) {
          console.warn('[Onboarding auto room setup warning]:', setupErr?.message)
        }
      }
    }

    // 4. Update Firestore owner profile to unlocked & verified
    const nowIso = new Date().toISOString()
    try {
      const { queryDocuments, updateDocument } = await import('@/lib/firebase/firestore')
      if (cleanedMobile) {
        const docs = await queryDocuments('owner_profiles', [{ field: 'mobile', operator: '==', value: cleanedMobile }])
        if (docs && docs.length > 0) {
          await updateDocument('owner_profiles', docs[0].id, {
            profile_status: 'verified',
            onboarding_status: 'unlocked',
            erp_unlocked: true,
            can_list_properties: true,
            organization_id: orgId,
            property_name: propName,
            city: propCity,
            unlocked_at: nowIso,
            unlocked_by: admin.email || 'superadmin',
            updated_at: nowIso,
          })
        }
      }
    } catch (fErr: any) {
      console.warn('[Firestore Owner Profile Unlock Warning]:', fErr?.message)
    }

    // 5. Audit Log
    try {
      await serviceClient.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: targetUser.id,
        action: 'owner_onboarded_unlocked',
        entity_type: 'owner_profiles',
        entity_id: targetUser.id,
        metadata: {
          property_name: propName,
          city: propCity,
          unlocked_by: admin.email,
          approx_rooms: roomCount,
        },
      })
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Owner onboarding completed! "${propName}" is created and ERP platform is now unlocked.`,
      organization,
    })
  } catch (err: any) {
    console.error('[Admin Onboard Owner POST Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to complete owner onboarding' }, { status: 500 })
  }
}
