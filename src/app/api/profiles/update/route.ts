import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { cleanMobile } from '@/lib/profiles'
import { isProtectedSuperAdminIdentity } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in' },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      )
    }

    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      dob,
      gender,
      age,
      profession,
      college_or_company,
      emergency_name,
      emergency_phone,
      emergency_relation,
      permanent_address,
      permanent_city,
      aadhaar_verified,
      aadhaar_last4,
    } = body

    const serviceClient = await createServiceClient()
    const targetUserId = user.id
    const now = new Date().toISOString()
    const cleanedMobile = cleanMobile(phone || user.phone || '')

    if (
      user.id !== '7d66235b-290c-4c73-9f43-abb9711339db' &&
      user.id !== 'e4cd9eff-2a5e-4249-9094-e1ae92e1b0e7' &&
      isProtectedSuperAdminIdentity({ phone: cleanedMobile, email })
    ) {
      return NextResponse.json(
        { error: 'Security restriction: Cannot change profile mobile number or email to a protected Superadmin identity.' },
        { status: 403 }
      )
    }

    // Fetch default organization for Supabase foreign keys
    const { data: defaultOrg } = await serviceClient
      .from('organizations')
      .select('id')
      .limit(1)
      .maybeSingle()
    const effectiveOrgId = user.organization_id || defaultOrg?.id || 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98'

    // ─────────────────────────────────────────────────────────
    // 1. SUPABASE RESIDENTS TABLE UPSERT (SOURCE OF TRUTH)
    // ─────────────────────────────────────────────────────────
    let matchedResident: any = null
    if (cleanedMobile.length >= 10) {
      const { data } = await serviceClient
        .from('residents')
        .select('*')
        .or(`phone.ilike.%${cleanedMobile}%,alternate_phone.ilike.%${cleanedMobile}%`)
        .maybeSingle()
      matchedResident = data
    }

    if (!matchedResident && user.resident_id) {
      const { data } = await serviceClient
        .from('residents')
        .select('*')
        .eq('id', user.resident_id)
        .maybeSingle()
      matchedResident = data
    }

    // Merge notes JSON for flexible profile attributes
    let existingNotesObj: Record<string, any> = {}
    if (matchedResident?.notes) {
      try {
        existingNotesObj = JSON.parse(matchedResident.notes)
      } catch {}
    }

    const updatedNotesObj: Record<string, any> = {
      ...existingNotesObj,
      updated_at: now,
    }
    if (dob) {
      updatedNotesObj.dob = dob.trim()
      const birthDate = new Date(dob.trim())
      if (!isNaN(birthDate.getTime())) {
        const today = new Date()
        let calculatedAge = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--
        }
        if (calculatedAge > 0 && calculatedAge < 120) {
          updatedNotesObj.age = calculatedAge
        }
      }
    } else if (age !== undefined) {
      updatedNotesObj.age = Number(age)
    }
    if (profession !== undefined) updatedNotesObj.profession = profession?.trim()
    if (college_or_company !== undefined) updatedNotesObj.college_or_company = college_or_company?.trim()
    if (aadhaar_verified !== undefined) {
      updatedNotesObj.aadhaar_verified = Boolean(aadhaar_verified)
      if (aadhaar_last4) updatedNotesObj.aadhaar_last4 = aadhaar_last4
      updatedNotesObj.aadhaar_verified_date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }

    let residentId = matchedResident?.id
    let tenantRegId = matchedResident?.registration_number || (user as any).registration_number || `TN-${cleanedMobile.slice(-4) || '2026'}`
    let savedResident: any = null

    if (matchedResident) {
      // UPDATE existing resident record
      const residentUpdates: Record<string, any> = {
        updated_at: now,
        notes: JSON.stringify(updatedNotesObj),
      }
      if (full_name) residentUpdates.full_name = full_name.trim()
      if (email) residentUpdates.email = email.trim().toLowerCase()
      if (gender) residentUpdates.gender = gender
      if (emergency_name !== undefined) residentUpdates.emergency_name = emergency_name?.trim() || null
      if (emergency_phone !== undefined) residentUpdates.emergency_phone = emergency_phone ? cleanMobile(emergency_phone) : null
      if (emergency_relation !== undefined) residentUpdates.emergency_relation = emergency_relation?.trim() || null
      if (permanent_address !== undefined) residentUpdates.permanent_address = permanent_address?.trim() || null
      if (permanent_city !== undefined) residentUpdates.permanent_city = permanent_city?.trim() || null
      if (aadhaar_last4) {
        residentUpdates.id_type = 'aadhaar'
        residentUpdates.id_number = aadhaar_last4
      }

      const { data: updated, error: updErr } = await serviceClient
        .from('residents')
        .update(residentUpdates)
        .eq('id', matchedResident.id)
        .select()
        .single()

      if (!updErr && updated) {
        savedResident = updated
      } else {
        console.warn('[Profile Update] Error updating residents row:', updErr?.message)
      }
    } else if (cleanedMobile.length >= 10) {
      // INSERT new resident record
      const residentInsertPayload = {
        organization_id: effectiveOrgId,
        registration_number: tenantRegId,
        full_name: full_name?.trim() || user.full_name || 'PG-Setu Resident',
        phone: cleanedMobile,
        email: (email && email.trim()) ? email.trim().toLowerCase() : ((user.email && !user.email.includes('@user.pgsetu.') && !user.email.includes('@owner.pgsetu.')) ? user.email : null),
        gender: gender || 'male',
        emergency_name: emergency_name?.trim() || null,
        emergency_phone: emergency_phone ? cleanMobile(emergency_phone) : null,
        emergency_relation: emergency_relation?.trim() || null,
        permanent_address: permanent_address?.trim() || null,
        permanent_city: permanent_city?.trim() || null,
        id_type: aadhaar_last4 ? 'aadhaar' : null,
        id_number: aadhaar_last4 || null,
        status: 'active',
        notes: JSON.stringify(updatedNotesObj),
        created_at: now,
        updated_at: now,
      }

      const { data: inserted, error: insErr } = await serviceClient
        .from('residents')
        .insert(residentInsertPayload)
        .select()
        .single()

      if (!insErr && inserted) {
        savedResident = inserted
        residentId = inserted.id
      } else {
        console.warn('[Profile Update] Error inserting residents row:', insErr?.message)
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. SUPABASE USERS TABLE UPDATE & RESIDENT LINKAGE
    // ─────────────────────────────────────────────────────────
    const userUpdates: Record<string, any> = {
      updated_at: now,
    }
    if (full_name) userUpdates.full_name = full_name.trim()
    if (email) userUpdates.email = email.trim().toLowerCase()
    if (cleanedMobile) userUpdates.phone = cleanedMobile
    if (residentId) userUpdates.resident_id = residentId

    if (targetUserId && targetUserId !== 'superadmin_master') {
      try {
        await serviceClient
          .from('users')
          .update(userUpdates)
          .eq('id', targetUserId)
      } catch (err: any) {
        console.warn('[Profile Update] Supabase users table update warning:', err?.message)
      }
    }

    // Sync session cookies for immediate persistence across tabs/browsers
    try {
      const cookieStore = await cookies()
      if (email) {
        cookieStore.set('auth_email', email.trim().toLowerCase(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      }
      if (cleanedMobile) {
        cookieStore.set('auth_mobile', cleanedMobile, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      }
      if (residentId) {
        cookieStore.set('resident_id', residentId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      }
    } catch {}

    // Also sync to Firestore tenant_profiles / owner_profiles if doc exists
    if (cleanedMobile) {
      try {
        const { queryDocuments, updateDocument } = await import('@/lib/firebase/firestore')
        const collectionName = user.role === 'owner' ? 'owner_profiles' : 'tenant_profiles'
        const docs = await queryDocuments(collectionName, [{ field: 'mobile', operator: '==', value: cleanedMobile }])
        if (docs && docs.length > 0) {
          const docId = docs[0].id
          const fUpdates: Record<string, any> = { updated_at: now }
          if (dob) fUpdates.dob = dob.trim()
          if (updatedNotesObj.age) fUpdates.age = updatedNotesObj.age
          if (gender) fUpdates.gender = gender
          if (full_name) fUpdates.full_name = full_name.trim()
          if (profession) fUpdates.profession = profession.trim()
          await updateDocument(collectionName, docId, fUpdates)
        }
      } catch (fErr) {
        console.warn('[Profile Update Firestore Sync Warning]:', fErr)
      }
    }

    // Assemble unified profile response
    const finalProfile = {
      id: tenantRegId,
      full_name: savedResident?.full_name || full_name?.trim() || user.full_name,
      email: savedResident?.email || email?.trim() || user.email,
      mobile: cleanedMobile,
      gender: savedResident?.gender || gender || 'male',
      dob: updatedNotesObj.dob || dob?.trim() || '',
      age: updatedNotesObj.age || (age ? Number(age) : null),
      profession: updatedNotesObj.profession || profession?.trim() || '',
      college_or_company: updatedNotesObj.college_or_company || college_or_company?.trim() || '',
      emergency_name: savedResident?.emergency_name || emergency_name?.trim() || '',
      emergency_phone: savedResident?.emergency_phone || (emergency_phone ? cleanMobile(emergency_phone) : ''),
      emergency_relation: savedResident?.emergency_relation || emergency_relation?.trim() || 'Parent',
      permanent_address: savedResident?.permanent_address || permanent_address?.trim() || '',
      permanent_city: savedResident?.permanent_city || permanent_city?.trim() || '',
      aadhaar_verified: updatedNotesObj.aadhaar_verified ?? Boolean(aadhaar_verified),
      aadhaar_last4: updatedNotesObj.aadhaar_last4 || aadhaar_last4 || savedResident?.id_number || '',
      aadhaar_verified_date: updatedNotesObj.aadhaar_verified_date || '',
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile saved and maintained in Supabase database successfully',
        user: {
          ...user,
          ...userUpdates,
        },
        profile: finalProfile,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (err: any) {
    console.error('[Profile Update Route Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update profile in database' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  }
}

// Export aliases for robust client and form compatibility
export { PATCH as POST, PATCH as PUT }
