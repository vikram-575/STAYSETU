import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { updateDocument, getDocument, createDocument } from '@/lib/firebase/firestore'
import { cleanMobile } from '@/lib/profiles'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in' }, { status: 401 })
    }

    const body = await request.json()
    const {
      full_name,
      email,
      phone,
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

    // 1. Update Supabase users table
    const userUpdates: Record<string, any> = {
      updated_at: now,
    }
    if (full_name) userUpdates.full_name = full_name.trim()
    if (email) userUpdates.email = email.trim().toLowerCase()
    if (cleanedMobile) userUpdates.phone = cleanedMobile

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

    // 2. Update Supabase residents table if resident record matches user or phone
    if (cleanedMobile.length >= 10) {
      try {
        const residentUpdates: Record<string, any> = {
          updated_at: now,
        }
        if (full_name) residentUpdates.full_name = full_name.trim()
        if (email) residentUpdates.email = email.trim().toLowerCase()
        if (gender) residentUpdates.gender = gender
        if (emergency_name) residentUpdates.emergency_name = emergency_name.trim()
        if (emergency_phone) residentUpdates.emergency_phone = cleanMobile(emergency_phone)
        if (emergency_relation) residentUpdates.emergency_relation = emergency_relation.trim()
        if (permanent_address) residentUpdates.permanent_address = permanent_address.trim()
        if (permanent_city) residentUpdates.permanent_city = permanent_city.trim()

        await serviceClient
          .from('residents')
          .update(residentUpdates)
          .or(`phone.ilike.%${cleanedMobile}%,alternate_phone.ilike.%${cleanedMobile}%`)
      } catch (err: any) {
        console.warn('[Profile Update] Supabase residents table update warning:', err?.message)
      }
    }

    // 3. Update or Upsert in Firestore Profiles
    const profileCollection = user.role === 'owner' ? 'owner_profiles' : 'tenant_profiles'
    const profilePayload: Record<string, any> = {
      updated_at: now,
      full_name: full_name?.trim() || user.full_name,
      email: email?.trim().toLowerCase() || user.email,
      mobile: cleanedMobile,
      gender: gender || undefined,
      age: age ? Number(age) : undefined,
      profession: profession?.trim() || undefined,
      college_or_company: college_or_company?.trim() || undefined,
      emergency_name: emergency_name?.trim() || undefined,
      emergency_phone: emergency_phone ? cleanMobile(emergency_phone) : undefined,
      emergency_relation: emergency_relation?.trim() || undefined,
      permanent_address: permanent_address?.trim() || undefined,
      permanent_city: permanent_city?.trim() || undefined,
    }

    if (aadhaar_verified !== undefined) {
      profilePayload.aadhaar_verified = Boolean(aadhaar_verified)
      if (aadhaar_last4) profilePayload.aadhaar_last4 = aadhaar_last4
      profilePayload.aadhaar_verified_date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }

    // Attempt firestore update with short timeout guard
    try {
      const targetDocId = (user as any).registration_number || targetUserId
      const existingDoc = await Promise.race([
        getDocument(profileCollection, targetDocId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1000)),
      ]).catch(() => null)

      if (existingDoc) {
        await updateDocument(profileCollection, targetDocId, profilePayload)
      } else {
        await createDocument(profileCollection, {
          id: targetDocId,
          type: user.role === 'owner' ? 'owner' : 'tenant',
          created_at: now,
          ...profilePayload,
        })
      }
    } catch (err: any) {
      console.warn('[Profile Update] Firestore update non-critical fallback:', err?.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully across systems',
      user: {
        ...user,
        ...userUpdates,
      },
      profile: profilePayload,
    })
  } catch (err: any) {
    console.error('[Profile Update Route Error]:', err)
    return NextResponse.json({ error: err?.message || 'Failed to update profile' }, { status: 500 })
  }
}
