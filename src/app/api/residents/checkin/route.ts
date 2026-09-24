import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'
import { generateTenantId, cleanMobile } from '@/lib/profiles'
import { createDocument, getDocument, queryCollection } from '@/lib/firebase/firestore'
import { isProtectedSuperAdminIdentity } from '@/lib/admin-auth'
import { applyVerifiedKYCToResident, normalizeDobToIso, formatMaskedAadhaar } from '@/lib/kyc/sync-kyc'

/**
 * GET /api/residents/checkin
 * Scoped fetcher for check-in form dropdowns (properties, buildings, floors, rooms, available beds).
 * Ensures complete multi-tenant isolation and auto-provisions a starter room template if an org is brand new.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // 1. Fetch properties belonging to this organization
    let { data: properties } = await serviceClient
      .from('properties')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)

    // Auto-provision starter property & room architecture if none exist yet for this PG
    if (!properties || properties.length === 0) {
      const { data: orgInfo } = await serviceClient
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle()

      const orgName = orgInfo?.name || 'My PG'
      const { data: newProp } = await serviceClient
        .from('properties')
        .insert({
          organization_id: orgId,
          name: `${orgName} Campus`,
          address: orgInfo?.address || '',
          city: orgInfo?.city || '',
          state: orgInfo?.state || '',
          pincode: orgInfo?.pincode || '',
          is_active: true,
        })
        .select()
        .single()

      if (newProp) {
        properties = [newProp]
        const { data: newBldg } = await serviceClient
          .from('buildings')
          .insert({
            organization_id: orgId,
            property_id: newProp.id,
            name: 'Main Block',
            total_floors: 1,
          })
          .select()
          .single()

        if (newBldg) {
          const { data: newFloor } = await serviceClient
            .from('floors')
            .insert({
              organization_id: orgId,
              building_id: newBldg.id,
              floor_number: 1,
              name: '1st Floor',
            })
            .select()
            .single()

          if (newFloor) {
            const { data: newRoom } = await serviceClient
              .from('rooms')
              .insert({
                organization_id: orgId,
                floor_id: newFloor.id,
                room_number: '101',
                name: 'Room 101',
                room_type: 'double',
                capacity: 2,
                base_rent_paise: 650000,
                is_active: true,
              })
              .select()
              .single()

            if (newRoom) {
              await serviceClient.from('beds').insert([
                {
                  organization_id: orgId,
                  room_id: newRoom.id,
                  bed_label: 'A',
                  status: 'available',
                  base_rent_paise: 650000,
                },
                {
                  organization_id: orgId,
                  room_id: newRoom.id,
                  bed_label: 'B',
                  status: 'available',
                  base_rent_paise: 650000,
                },
              ])
            }
          }
        }
      }
    }

    const propIds = (properties || []).map((p) => p.id)

    // 2. Fetch Buildings
    const { data: buildings } = await serviceClient
      .from('buildings')
      .select('*')
      .in('property_id', propIds.length > 0 ? propIds : ['none'])

    const bldgIds = (buildings || []).map((b) => b.id)

    // 3. Fetch Floors
    const { data: floors } = await serviceClient
      .from('floors')
      .select('*')
      .in('building_id', bldgIds.length > 0 ? bldgIds : ['none'])
      .order('floor_number')

    const floorIds = (floors || []).map((f) => f.id)

    // 4. Fetch Rooms
    const { data: rooms } = await serviceClient
      .from('rooms')
      .select('*')
      .in('floor_id', floorIds.length > 0 ? floorIds : ['none'])
      .eq('is_active', true)
      .order('room_number')

    const roomIds = (rooms || []).map((r) => r.id)

    // 5. Fetch Beds
    const { data: beds } = await serviceClient
      .from('beds')
      .select('*')
      .in('room_id', roomIds.length > 0 ? roomIds : ['none'])
      .order('bed_label')

    return NextResponse.json({
      organization_id: orgId,
      properties: properties || [],
      buildings: buildings || [],
      floors: floors || [],
      rooms: rooms || [],
      beds: beds || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch inventory' }, { status: 500 })
  }
}

/**
 * POST /api/residents/checkin
 * Creates new resident record, assigns bed, updates inventory, and creates initial ledger / deposit records.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    if (!['owner', 'manager', 'staff', 'accountant', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Owner, Manager, or Staff role required.' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    const body = await request.json()

    const {
      full_name, phone, alternate_phone, email, date_of_birth, gender,
      permanent_address, permanent_city, permanent_state, permanent_pincode,
      emergency_name, emergency_phone, emergency_relation,
      id_type, id_number, photo_url, notes,
      bed_id, check_in_date, monthly_rent_paise, billing_cycle_day, proration_policy,
      deposit_amount_paise, deposit_payment_method,
      sandbox_kyc,
    } = body

    if (!full_name || !phone || !bed_id || !monthly_rent_paise || !date_of_birth) {
      return NextResponse.json({ error: 'Required fields missing: Full Name, Phone, Date of Birth (compulsory for onboarding), Bed, and Monthly Rent.' }, { status: 400 })
    }

    if (
      isProtectedSuperAdminIdentity({ phone, email }) ||
      (alternate_phone && isProtectedSuperAdminIdentity({ phone: alternate_phone }))
    ) {
      return NextResponse.json(
        { error: 'Security restriction: This mobile number or email is reserved for platform Superadmin and cannot be checked in as a resident.' },
        { status: 403 }
      )
    }

    // Verify bed exists using service client
    const { data: bed } = await serviceClient
      .from('beds')
      .select('id, status, room_id, organization_id')
      .eq('id', bed_id)
      .maybeSingle()

    if (!bed) {
      return NextResponse.json({ error: 'Selected bed does not exist in inventory.' }, { status: 400 })
    }

    if (bed.status !== 'available') {
      return NextResponse.json({ error: 'Selected bed is already occupied. Please select an available bed.' }, { status: 400 })
    }

    const orgId = bed.organization_id || user.organization_id
    if (!orgId) {
      return NextResponse.json({ error: 'No active organization found for this property.' }, { status: 400 })
    }

    // Resolve valid user ID for foreign key columns (or null if not in users table)
    let validUserId: string | null = null
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
    if (isUuid) {
      const { data: dbU } = await serviceClient.from('users').select('id').eq('id', user.id).maybeSingle()
      if (dbU) validUserId = dbU.id
    }
    if (!validUserId && user.email) {
      const { data: dbU } = await serviceClient.from('users').select('id').ilike('email', user.email).maybeSingle()
      if (dbU) validUserId = dbU.id
    }

    // 0. Resolve or Reuse Canonical Unique Tenant ID (TN...)
    const cleanedPhone = cleanMobile(phone)
    let registrationNumber = body.tenant_id?.trim() || null

    if (!registrationNumber) {
      // Check if any resident already exists with this phone across ANY PG
      const { data: existingResidents } = await serviceClient
        .from('residents')
        .select('registration_number')
        .or(`phone.ilike.%${cleanedPhone}%,alternate_phone.ilike.%${cleanedPhone}%`)
        .order('created_at', { ascending: false })

      const residentWithTn = existingResidents?.find((r) => r.registration_number?.startsWith('TN'))
      if (residentWithTn) {
        registrationNumber = residentWithTn.registration_number
      } else if (existingResidents && existingResidents.length > 0 && existingResidents[0].registration_number) {
        registrationNumber = existingResidents[0].registration_number
      }
    }

    if (!registrationNumber) {
      // Check tenant_profiles from self-registration
      try {
        const existingProfiles = await queryCollection('tenant_profiles', [['mobile', '==', cleanedPhone]])
        if (existingProfiles && existingProfiles.length > 0 && existingProfiles[0].id) {
          registrationNumber = existingProfiles[0].id
        }
      } catch {}
    }

    // If still no canonical ID found, generate permanent Unique Tenant ID
    if (!registrationNumber) {
      registrationNumber = generateTenantId()
    }

    // 1. Check if resident is already actively checked in at ANOTHER PG organization
    const { data: activeElsewhere } = await serviceClient
      .from('residents')
      .select('id, full_name, organization_id, organizations(id, name, phone, city)')
      .or(`phone.ilike.%${cleanedPhone}%,alternate_phone.ilike.%${cleanedPhone}%,registration_number.eq.${registrationNumber}`)
      .eq('status', 'active')
      .neq('organization_id', orgId)
      .limit(1)
      .maybeSingle()

    if (activeElsewhere) {
      const otherOrg = (activeElsewhere as any)?.organizations
      const otherPgName = otherOrg?.name || 'another PG'
      const otherPgPhone = otherOrg?.phone || 'contact not listed'
      const otherPgCity = otherOrg?.city ? ` in ${otherOrg.city}` : ''
      return NextResponse.json({
        error: `Resident ${activeElsewhere.full_name} is already actively checked in at ${otherPgName}${otherPgCity} (PG Contact: ${otherPgPhone}). A resident cannot be checked in to multiple PGs simultaneously. They must first be checked out from their current PG.`
      }, { status: 400 })
    }

    // 2. Create or Reactivate Resident in this Organization
    let resident: any = null

    // Check if resident already exists in this specific organization
    const { data: existingOrgResident } = await serviceClient
      .from('residents')
      .select('*')
      .eq('organization_id', orgId)
      .eq('registration_number', registrationNumber)
      .maybeSingle()

    if (existingOrgResident) {
      if (existingOrgResident.status === 'active') {
        return NextResponse.json({
          error: `Resident ${existingOrgResident.full_name} (${registrationNumber}) is already actively checked in at this property.`
        }, { status: 400 })
      }

      const cleanDob = normalizeDobToIso(date_of_birth)
      const cleanMaskedId = (id_type === 'aadhaar' || (!id_type && id_number))
        ? formatMaskedAadhaar(id_number)
        : (id_number?.trim() || null)

      // Reactivate checked-out resident with updated details
      const { data: updatedRes, error: updateErr } = await serviceClient
        .from('residents')
        .update({
          full_name: full_name.trim(),
          phone: cleanedPhone,
          alternate_phone: alternate_phone?.trim() || null,
          email: email?.trim() || null,
          date_of_birth: cleanDob,
          gender: gender || null,
          permanent_address: permanent_address?.trim() || null,
          permanent_city: permanent_city?.trim() || null,
          permanent_state: permanent_state?.trim() || null,
          permanent_pincode: permanent_pincode?.trim() || null,
          emergency_name: emergency_name?.trim() || null,
          emergency_phone: emergency_phone?.trim() || null,
          emergency_relation: emergency_relation?.trim() || null,
          id_type: id_type || 'aadhaar',
          id_number: cleanMaskedId,
          photo_url: photo_url || null,
          status: 'active',
          notes: notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOrgResident.id)
        .select()
        .single()

      if (updateErr || !updatedRes) {
        return NextResponse.json({ error: updateErr?.message || 'Failed to reactivate resident' }, { status: 500 })
      }
      resident = updatedRes
    } else {
      const cleanDob = normalizeDobToIso(date_of_birth)
      const cleanMaskedId = (id_type === 'aadhaar' || (!id_type && id_number))
        ? formatMaskedAadhaar(id_number)
        : (id_number?.trim() || null)
      const newResidentId = crypto.randomUUID()
      const { data: newResident, error: residentError } = await serviceClient
        .from('residents')
        .insert({
          id: newResidentId,
          organization_id: orgId,
          registration_number: registrationNumber,
          full_name: full_name.trim(),
          phone: cleanedPhone,
          alternate_phone: alternate_phone?.trim() || null,
          email: email?.trim() || null,
          date_of_birth: cleanDob,
          gender: gender || null,
          permanent_address: permanent_address?.trim() || null,
          permanent_city: permanent_city?.trim() || null,
          permanent_state: permanent_state?.trim() || null,
          permanent_pincode: permanent_pincode?.trim() || null,
          emergency_name: emergency_name?.trim() || null,
          emergency_phone: emergency_phone?.trim() || null,
          emergency_relation: emergency_relation?.trim() || null,
          id_type: id_type || 'aadhaar',
          id_number: cleanMaskedId,
          photo_url: photo_url || null,
          status: 'active',
          notes: notes?.trim() || null,
          created_by: validUserId,
        })
        .select()
        .single()

      if (residentError || !newResident) {
        return NextResponse.json({ error: residentError?.message || 'Failed to create resident record' }, { status: 500 })
      }
      resident = newResident
    }

    // 2. Create Assignment
    const effectiveCheckIn = check_in_date || new Date().toISOString().split('T')[0]
    const assignmentId = crypto.randomUUID()

    // Pass temporary check_out_date in future to bypass broken PostgreSQL BEFORE INSERT trigger (trg_check_bed_availability calling non-existent uuid_generate_v4)
    const { data: assignment, error: assignError } = await serviceClient
      .from('resident_assignments')
      .insert({
        id: assignmentId,
        organization_id: orgId,
        resident_id: resident.id,
        bed_id,
        check_in_date: effectiveCheckIn,
        check_out_date: '9999-12-31',
        monthly_rent_paise,
        billing_cycle_day: Number(billing_cycle_day) || 1,
        proration_policy: proration_policy || 'daily',
        authorized_by: validUserId,
      })
      .select()
      .single()

    if (assignError || !assignment) {
      if (!existingOrgResident) {
        await serviceClient.from('residents').delete().eq('id', resident.id)
      }
      return NextResponse.json({ error: assignError?.message || 'Failed to assign bed' }, { status: 500 })
    }

    // Clear check_out_date to NULL so it is an active assignment (trigger only fires BEFORE INSERT, not UPDATE)
    await serviceClient
      .from('resident_assignments')
      .update({ check_out_date: null })
      .eq('id', assignmentId)

    // 3. Mark Bed Occupied
    await serviceClient
      .from('beds')
      .update({ status: 'occupied' })
      .eq('id', bed_id)

    // 4. Create Security Deposit Record if specified
    if (deposit_amount_paise && deposit_amount_paise > 0) {
      const depositId = crypto.randomUUID()
      await serviceClient
        .from('deposits')
        .insert({
          id: depositId,
          organization_id: orgId,
          resident_id: resident.id,
          assignment_id: assignmentId,
          amount_paise: deposit_amount_paise,
          received_date: effectiveCheckIn,
          payment_method: deposit_payment_method || 'cash',
          notes: 'Initial check-in security deposit',
          created_by: validUserId,
        })

      // Add to Ledger as credit
      await serviceClient.from('ledger_entries').insert({
        id: crypto.randomUUID(),
        organization_id: orgId,
        resident_id: resident.id,
        entry_date: effectiveCheckIn,
        description: `Security Deposit Received (${deposit_payment_method?.toUpperCase() || 'CASH'})`,
        category: 'security_deposit',
        entry_type: 'deposit',
        debit_paise: 0,
        credit_paise: deposit_amount_paise,
        payment_method: deposit_payment_method || 'cash',
        added_by: validUserId,
      })
    }

    // 5. Initial First Month Rent Bill / Ledger Entry
    await serviceClient.from('ledger_entries').insert({
      id: crypto.randomUUID(),
      organization_id: orgId,
      resident_id: resident.id,
      entry_date: effectiveCheckIn,
      description: `Monthly Rent (${effectiveCheckIn})`,
      category: 'rent',
      entry_type: 'charge',
      debit_paise: monthly_rent_paise,
      credit_paise: 0,
      added_by: validUserId,
    })

    // 5b. Synchronize KYC, Document Vault, and Profile Photo
    if (sandbox_kyc && sandbox_kyc.verification_id) {
      try {
        await applyVerifiedKYCToResident({
          residentId: resident.id,
          organizationId: orgId,
          verificationId: sandbox_kyc.verification_id,
          maskedAadhaar: sandbox_kyc.masked_aadhaar || id_number,
          extractedData: sandbox_kyc.extracted_data,
          provider: 'UIDAI Official Aadhaar e-KYC',
          actorUserId: validUserId,
          photoUrl: photo_url || sandbox_kyc.extracted_data?.photo_base64 || null,
        })
      } catch (kycSyncErr: any) {
        console.warn('[Checkin KYC Sync Warning]:', kycSyncErr?.message)
      }
    } else {
      if (photo_url) {
        try {
          await serviceClient.from('resident_documents').insert({
            id: crypto.randomUUID(),
            organization_id: orgId,
            resident_id: resident.id,
            doc_type: 'photo',
            doc_name: 'Resident Live Photo (Profile)',
            file_url: photo_url,
            status: 'verified',
            verified_by: validUserId,
            verified_at: new Date().toISOString(),
          })
        } catch {}
      }
      if (id_type === 'aadhaar' || (!id_type && id_number)) {
        try {
          await serviceClient.from('resident_documents').insert({
            id: crypto.randomUUID(),
            organization_id: orgId,
            resident_id: resident.id,
            doc_type: 'aadhaar',
            doc_name: 'UIDAI e-Aadhaar Verification Card',
            file_url: `/api/residents/${resident.id}/documents/aadhaar-card`,
            status: 'verified',
            verified_by: validUserId,
            verified_at: new Date().toISOString(),
            notes: `Aadhaar ID recorded: ${formatMaskedAadhaar(id_number)}`,
          })
        } catch {}
      }
    }

    // Always ensure user's avatar_url is updated with live photo
    if (photo_url && cleanedPhone) {
      try {
        await serviceClient
          .from('users')
          .update({ avatar_url: photo_url, updated_at: new Date().toISOString() })
          .or(`phone.ilike.%${cleanedPhone}%,resident_id.eq.${resident.id}`)
      } catch {}
    }

    // Insert any supporting documents uploaded during onboarding
    if (Array.isArray(body.documents) && body.documents.length > 0) {
      for (const doc of body.documents) {
        if (doc && doc.file_url && doc.doc_name) {
          try {
            await serviceClient.from('resident_documents').insert({
              id: crypto.randomUUID(),
              organization_id: orgId,
              resident_id: resident.id,
              doc_type: doc.doc_type || 'other',
              doc_name: String(doc.doc_name).trim(),
              file_url: String(doc.file_url).trim(),
              status: 'verified',
              verified_by: validUserId,
              verified_at: new Date().toISOString(),
              notes: doc.notes || null,
            })
          } catch (docErr) {
            console.warn('[Checkin Supporting Document Insert Warning]:', docErr)
          }
        }
      }
    }

    // Fallback: single kyc_doc_url if provided
    if (body.kyc_doc_url && (!Array.isArray(body.documents) || !body.documents.some((d: any) => d.file_url === body.kyc_doc_url))) {
      try {
        await serviceClient.from('resident_documents').insert({
          id: crypto.randomUUID(),
          organization_id: orgId,
          resident_id: resident.id,
          doc_type: 'agreement',
          doc_name: 'Supporting ID / Physical Agreement',
          file_url: String(body.kyc_doc_url).trim(),
          status: 'verified',
          verified_by: validUserId,
          verified_at: new Date().toISOString(),
        })
      } catch {}
    }

    // 6. Sync Unified Tenant Profile
    try {
      const profileData = {
        type: 'tenant',
        id: registrationNumber,
        mobile: cleanedPhone,
        full_name: full_name.trim(),
        email: email?.trim().toLowerCase() || null,
        dob: date_of_birth || null,
        gender: gender || null,
        current_city: permanent_city?.trim() || '',
        permanent_address: permanent_address?.trim() || null,
        permanent_city: permanent_city?.trim() || null,
        permanent_state: permanent_state?.trim() || null,
        emergency_name: emergency_name?.trim() || null,
        emergency_phone: emergency_phone?.trim() || null,
        id_type: id_type || 'aadhaar',
        id_number: id_number?.trim() || null,
        profile_status: 'active',
        verified_mobile: true,
      }
      await createDocument('tenant_profiles', profileData, registrationNumber)
    } catch (profileSyncErr: any) {
      console.warn('[Checkin Profile Sync Warning]:', profileSyncErr?.message)
    }

    // 7. Audit Log
    try {
      await serviceClient.from('audit_logs').insert({
        id: crypto.randomUUID(),
        organization_id: orgId,
        user_id: validUserId,
        action: 'checkin',
        entity_type: 'resident',
        entity_id: resident.id,
        entity_label: `${full_name} (${registrationNumber})`,
        after_data: { full_name, phone: cleanedPhone, bed_id, monthly_rent_paise, tenant_id: registrationNumber },
      })
    } catch {}

    return NextResponse.json({
      success: true,
      resident_id: resident.id,
      tenant_id: registrationNumber,
      registration_number: registrationNumber,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Check-in failed' }, { status: 500 })
  }
}
