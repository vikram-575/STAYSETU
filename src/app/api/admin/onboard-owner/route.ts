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
      .select('id, name, city, address, settings, created_at')

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
        address: fOwner.address || linkedOrg?.address || '',
        pg_type: fOwner.pg_type || linkedOrg?.settings?.pg_type || 'coliving',
        approx_rooms: fOwner.approx_rooms || linkedOrg?.settings?.approx_rooms || 6,
        starting_rent: fOwner.starting_rent || linkedOrg?.settings?.starting_rent || 7500,
        electricity_rate: fOwner.electricity_rate || linkedOrg?.settings?.electricity_rate_per_unit || 10,
        building_name: fOwner.building_name || linkedOrg?.settings?.building_name || 'Main Block',
        floor_count: fOwner.floor_count || linkedOrg?.settings?.floor_count || 3,
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
        address: linkedOrg?.address || '',
        pg_type: linkedOrg?.settings?.pg_type || 'coliving',
        approx_rooms: linkedOrg?.settings?.approx_rooms || 6,
        starting_rent: linkedOrg?.settings?.starting_rent || 7500,
        electricity_rate: linkedOrg?.settings?.electricity_rate_per_unit || 10,
        building_name: linkedOrg?.settings?.building_name || 'Main Block',
        floor_count: linkedOrg?.settings?.floor_count || 3,
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
 * SuperAdmin completes full multi-step setup and unlocks ERP + property listing for a PG Owner
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
      full_name,
      email,
      property_name,
      city,
      address,
      pg_type,
      // Building & structure
      building_count,
      building_name,
      floor_count,
      approx_rooms,
      room_count,
      room_type,
      starting_rent,
      // Electricity
      electricity_rate_per_unit,
      electricity_meter_type,
      electricity_allocation_method,
      // Staff
      staff_name,
      staff_phone,
      staff_role,
      staff_salary,
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
      const { data: uByPhone } = await serviceClient
        .from('users')
        .select('*')
        .ilike('phone', `%${cleanedMobile}%`)
        .limit(1)
      if (uByPhone && uByPhone.length > 0) {
        targetUser = uByPhone[0]
      }
    }
    if (!targetUser && cleanedMobile.length >= 10) {
      const { data: uExact } = await serviceClient
        .from('users')
        .select('*')
        .eq('phone', cleanedMobile)
        .maybeSingle()
      targetUser = uExact
    }

    // If user does not exist in Supabase users table yet, create user row
    if (!targetUser) {
      const defaultName = full_name?.trim() || (property_name ? `${property_name.trim()} Owner` : 'PG Owner')
      const userEmail = (email && email.trim()) ? email.trim().toLowerCase() : ''
      const { data: newUser, error: userErr } = await serviceClient
        .from('users')
        .insert({
          full_name: defaultName,
          phone: cleanedMobile,
          email: userEmail,
          role: 'owner',
          is_active: true,
        })
        .select('*')
        .single()

      if (userErr || !newUser) {
        throw new Error(`Failed to initialize user: ${userErr?.message || 'Database error'}`)
      }
      targetUser = newUser
    } else {
      // Ensure user profile details are synced and role is owner
      const userUpdate: any = { is_active: true, role: 'owner' }
      if (full_name && full_name.trim()) userUpdate.full_name = full_name.trim()
      if (email && email.trim()) userUpdate.email = email.trim().toLowerCase()
      await serviceClient.from('users').update(userUpdate).eq('id', targetUser.id)
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

    // Determine details for Onboarding / Unlock
    const ownerDisplayName = full_name?.trim() || targetUser.full_name || 'PG Owner'
    const propName = property_name?.trim() || `${ownerDisplayName}'s PG`
    const propCity = city?.trim() || targetUser.city || 'Bengaluru'
    const propAddress = address?.trim() || `${propCity}, India`
    const effectivePgType = pg_type || 'coliving'
    const bldgName = building_name?.trim() || 'Main Block'
    const bldgCount = Math.max(1, Math.min(10, Number(building_count) || 1))
    const floorsCount = Math.max(1, Math.min(20, Number(floor_count) || 3))
    const totalRooms = Math.max(1, Math.min(100, Number(room_count || approx_rooms) || 6))
    const rentRupees = Number(starting_rent) || 7500
    const rentPaise = rentRupees * 100
    const roomSharing = room_type || 'Double Sharing'

    let roomCapacity = 2
    if (roomSharing.toLowerCase().includes('single')) roomCapacity = 1
    else if (roomSharing.toLowerCase().includes('triple')) roomCapacity = 3
    else if (roomSharing.toLowerCase().includes('four')) roomCapacity = 4

    const electricityRate = Number(electricity_rate_per_unit) || 10
    const meterType = electricity_meter_type || 'sub'
    const allocationMethod = electricity_allocation_method || 'equal_split'

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

    const orgSettings = {
      ...(organization?.settings || {}),
      plan: 'enterprise',
      subscription_status: 'active',
      is_verified: true,
      verification_status: 'verified',
      pg_type: effectivePgType,
      approx_rooms: totalRooms,
      starting_rent: rentRupees,
      building_name: bldgName,
      building_count: bldgCount,
      floor_count: floorsCount,
      electricity_rate_per_unit: electricityRate,
      electricity_meter_type: meterType,
      electricity_allocation_method: allocationMethod,
    }

    if (organization) {
      // Update existing organization with latest details
      await serviceClient
        .from('organizations')
        .update({
          name: propName,
          city: propCity,
          address: propAddress,
          phone: targetUser.phone,
          email: targetUser.email || (email?.trim() ? email.trim().toLowerCase() : ''),
          settings: orgSettings,
        })
        .eq('id', orgId)
    } else {
      // Provision fresh Organization
      const slug = `${slugify(propName)}-${Date.now().toString(36)}`
      const { data: newOrg, error: orgErr } = await serviceClient
        .from('organizations')
        .insert({
          name: propName,
          slug,
          owner_user_id: targetUser.id,
          phone: targetUser.phone,
          email: targetUser.email || (email?.trim() ? email.trim().toLowerCase() : ''),
          city: propCity,
          address: propAddress,
          currency_code: 'INR',
          timezone: 'Asia/Kolkata',
          settings: orgSettings,
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
        .update({ organization_id: orgId, role: 'owner', is_active: true })
        .eq('id', targetUser.id)
    }

    // 3. Provision or Update primary Property under this organization
    const { data: existingProps } = await serviceClient
      .from('properties')
      .select('id, name')
      .eq('organization_id', orgId)

    let propertyId: string | null = null

    const propSettings = {
      pg_type: effectivePgType,
      approx_rooms: totalRooms,
      starting_rent: rentRupees,
      building_name: bldgName,
      floor_count: floorsCount,
      electricity_rate_per_unit: electricityRate,
      electricity_meter_type: meterType,
      electricity_allocation_method: allocationMethod,
      amenities: ['High-Speed WiFi', 'Power Backup', 'RO Water', '3 Daily Meals', 'Air Conditioning', 'CCTV Security'],
      rules: ['Gate closes at 11:00 PM', 'Visitors in lounge only', 'No smoking inside rooms'],
    }

    if (existingProps && existingProps.length > 0) {
      propertyId = existingProps[0].id
      await serviceClient
        .from('properties')
        .update({
          name: propName,
          city: propCity,
          address: propAddress,
          phone: targetUser.phone,
          email: targetUser.email || (email?.trim() ? email.trim().toLowerCase() : ''),
          is_active: true,
          settings: propSettings,
        })
        .eq('id', propertyId)
    } else {
      const { data: newProp } = await serviceClient
        .from('properties')
        .insert({
          organization_id: orgId,
          name: propName,
          city: propCity,
          address: propAddress,
          phone: targetUser.phone,
          email: targetUser.email || (email?.trim() ? email.trim().toLowerCase() : ''),
          is_active: true,
          settings: propSettings,
        })
        .select('id')
        .single()

      propertyId = newProp?.id || null
    }

    // 4. Provision Building, Floors, Rooms, and Beds
    if (propertyId) {
      try {
        // Check building
        let buildingId: string | null = null
        const { data: existingBldgs } = await serviceClient
          .from('buildings')
          .select('id, name')
          .eq('property_id', propertyId)
          .limit(1)

        if (existingBldgs && existingBldgs.length > 0) {
          buildingId = existingBldgs[0].id
          await serviceClient
            .from('buildings')
            .update({ name: bldgName, total_floors: floorsCount })
            .eq('id', buildingId)
        } else {
          const { data: bld } = await serviceClient
            .from('buildings')
            .insert({
              organization_id: orgId,
              property_id: propertyId,
              name: bldgName,
              total_floors: floorsCount,
            })
            .select('id')
            .single()
          buildingId = bld?.id || null
        }

        if (buildingId) {
          // Check & create floors
          const { data: existingFlrs } = await serviceClient
            .from('floors')
            .select('id, floor_number')
            .eq('building_id', buildingId)

          const existingFloorMap = new Map((existingFlrs || []).map((f) => [f.floor_number, f.id]))
          const activeFloors: { id: string; floor_number: number }[] = []

          for (let f = 1; f <= floorsCount; f++) {
            if (existingFloorMap.has(f)) {
              activeFloors.push({ id: existingFloorMap.get(f)!, floor_number: f })
            } else {
              const suffix = f === 1 ? 'st' : f === 2 ? 'nd' : f === 3 ? 'rd' : 'th'
              const floorName = `${f}${suffix} Floor`
              const { data: newFlr } = await serviceClient
                .from('floors')
                .insert({
                  organization_id: orgId,
                  building_id: buildingId,
                  floor_number: f,
                  name: floorName,
                })
                .select('id, floor_number')
                .single()
              if (newFlr) {
                activeFloors.push(newFlr)
              }
            }
          }

          // Check if rooms already exist
          const { count: existingRoomCount } = await serviceClient
            .from('rooms')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)

          if (!existingRoomCount || existingRoomCount === 0) {
            const floorCountSafe = Math.max(1, activeFloors.length)
            const roomsPerFloor = Math.ceil(totalRooms / floorCountSafe)
            let roomsCreatedCount = 0

            for (const flr of activeFloors) {
              if (roomsCreatedCount >= totalRooms) break
              const countForThisFloor = Math.min(roomsPerFloor, totalRooms - roomsCreatedCount)

              for (let r = 1; r <= countForThisFloor; r++) {
                roomsCreatedCount++
                const roomNum = `${flr.floor_number}${String(r).padStart(2, '0')}` // e.g. 101, 102, 201, 202

                const { data: createdRoom } = await serviceClient
                  .from('rooms')
                  .insert({
                    organization_id: orgId,
                    floor_id: flr.id,
                    room_number: roomNum,
                    name: `Room ${roomNum}`,
                    room_type: roomSharing,
                    capacity: roomCapacity,
                    base_rent_paise: rentPaise,
                  })
                  .select('id, room_number')
                  .single()

                if (createdRoom) {
                  const bedsToInsert: any[] = []
                  for (let b = 0; b < roomCapacity; b++) {
                    const bedLetter = String.fromCharCode(65 + b) // A, B, C, D
                    bedsToInsert.push({
                      organization_id: orgId,
                      room_id: createdRoom.id,
                      bed_label: `${createdRoom.room_number}-${bedLetter}`,
                      status: 'available',
                      base_rent_paise: rentPaise,
                    })
                  }
                  await serviceClient.from('beds').insert(bedsToInsert)

                  // If sub-meter per room, create sub-meter for this room
                  if (meterType === 'sub') {
                    try {
                      await serviceClient.from('electricity_meters').insert({
                        organization_id: orgId,
                        property_id: propertyId,
                        room_id: createdRoom.id,
                        meter_number: `MTR-${createdRoom.room_number}`,
                        meter_type: 'sub',
                        allocation_method: allocationMethod === 'room_actual' ? 'equal_split' : allocationMethod,
                        is_active: true,
                        notes: `Room ${createdRoom.room_number} sub-meter (Tariff: ₹${electricityRate}/unit)`,
                      })
                    } catch {}
                  }
                }
              }
            }
          } else {
            // Update existing rooms with base rent and sharing
            await serviceClient
              .from('rooms')
              .update({ base_rent_paise: rentPaise, room_type: roomSharing, capacity: roomCapacity })
              .eq('organization_id', orgId)
          }
        }
      } catch (setupErr: any) {
        console.warn('[Onboarding auto room setup warning]:', setupErr?.message)
      }

      // 5. Electricity Meter setup (Main Property Meter)
      try {
        const mainMeterNumber = `MTR-MAIN-${slugify(propName).slice(0, 8).toUpperCase() || '01'}`
        const { data: existingMainMeter } = await serviceClient
          .from('electricity_meters')
          .select('id')
          .eq('organization_id', orgId)
          .eq('meter_number', mainMeterNumber)
          .maybeSingle()

        if (!existingMainMeter) {
          await serviceClient.from('electricity_meters').insert({
            organization_id: orgId,
            property_id: propertyId,
            meter_number: mainMeterNumber,
            meter_type: meterType === 'sub' ? 'main' : meterType,
            allocation_method: allocationMethod === 'room_actual' ? 'equal_split' : allocationMethod,
            is_active: true,
            notes: `Main property electric connection (Tariff: ₹${electricityRate}/unit)`,
          })
        }
      } catch (mErr: any) {
        console.warn('[Electricity meter insert warning]:', mErr?.message)
      }
    }

    const nowIso = new Date().toISOString()

    // 6. On-site Staff Setup (if staff_name provided)
    if (staff_name && staff_name.trim()) {
      const cleanStaffName = staff_name.trim()
      const staffPhoneClean = staff_phone ? cleanMobile(staff_phone) : ''
      const staffSalaryPaise = (Number(staff_salary) || 15000) * 100
      const staffRoleEffective = staff_role || 'Manager / Supervisor'

      // 6a. In Firestore staff_members collection
      try {
        const { queryCollection, createDocument } = await import('@/lib/firebase/firestore')
        const existingStaff = await queryCollection('staff_members', [
          { field: 'organization_id', operator: '==', value: orgId },
        ])
        const alreadyExists = (existingStaff || []).some(
          (s: any) => s.name?.toLowerCase() === cleanStaffName.toLowerCase()
        )
        if (!alreadyExists) {
          await createDocument('staff_members', {
            organization_id: orgId,
            name: cleanStaffName,
            role: staffRoleEffective,
            phone: staffPhoneClean || targetUser.phone || '',
            shift: 'General (9 AM - 6 PM)',
            monthlySalaryPaise: staffSalaryPaise,
            advanceTakenPaise: 0,
            overtimeHours: 0,
            status: 'active',
            notes: 'Initial on-site staff enrolled during superadmin onboarding',
            created_at: nowIso,
            updated_at: nowIso,
          })
        }
      } catch (stErr: any) {
        console.warn('[Staff Firestore create warning]:', stErr?.message)
      }

      // 6b. In Supabase users table
      if (staffPhoneClean) {
        try {
          const { data: existingStaffUser } = await serviceClient
            .from('users')
            .select('id')
            .eq('phone', staffPhoneClean)
            .maybeSingle()

          if (!existingStaffUser) {
            await serviceClient.from('users').insert({
              organization_id: orgId,
              full_name: cleanStaffName,
              phone: staffPhoneClean,
              email: '',
              role: 'staff',
              is_active: true,
            })
          }
        } catch (sDbErr: any) {
          console.warn('[Staff Supabase user warning]:', sDbErr?.message)
        }
      }
    }

    // 7. Update Firestore owner profile to unlocked & verified
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
            address: propAddress,
            approx_rooms: totalRooms,
            starting_rent: rentRupees,
            electricity_rate: electricityRate,
            electricity_meter_type: meterType,
            building_name: bldgName,
            floor_count: floorsCount,
            staff_name: staff_name?.trim() || null,
            staff_role: staff_role || null,
            unlocked_at: nowIso,
            unlocked_by: admin.email || 'superadmin',
            updated_at: nowIso,
          })
        }
      }
    } catch (fErr: any) {
      console.warn('[Firestore Owner Profile Unlock Warning]:', fErr?.message)
    }

    // 8. Audit Log
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
          approx_rooms: totalRooms,
          building_name: bldgName,
          floor_count: floorsCount,
          electricity_rate: electricityRate,
          staff_name: staff_name?.trim() || null,
        },
      })
    } catch {}

    const successMessage = `PG "${propName}" setup complete with ${totalRooms} rooms across ${floorsCount} floors. Electricity tariff (₹${electricityRate}/unit) and staff configured. ERP unlocked!`

    return NextResponse.json({
      success: true,
      message: successMessage,
      organization,
    })
  } catch (err: any) {
    console.error('[Admin Onboard Owner POST Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to complete owner onboarding' }, { status: 500 })
  }
}
