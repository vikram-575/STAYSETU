import { createServiceClient } from '@/lib/supabase/server'
import type { AadhaarExtractedData } from './types'
import { normalizeDobToIso, formatMaskedAadhaar } from './formatters'

export { normalizeDobToIso, formatMaskedAadhaar }

export interface ApplyKYCParams {
  residentId: string
  organizationId: string
  verificationId: string
  maskedAadhaar: string
  extractedData?: AadhaarExtractedData | null
  provider?: string
  actorUserId?: string | null
  photoUrl?: string | null
}

/**
 * Centrally synchronizes verified Aadhaar KYC data:
 * 1. Updates residents table (demographics, address, id_number, photo_url)
 * 2. Upserts tenant_kyc table record with verification_status = 'verified'
 * 3. Creates/Upserts resident_documents (e-Aadhaar Card and Live Photo)
 * 4. Updates linked user profile avatar_url
 */
export async function applyVerifiedKYCToResident(params: ApplyKYCParams) {
  const {
    residentId,
    organizationId,
    verificationId,
    maskedAadhaar,
    extractedData,
    provider = 'UIDAI Official Aadhaar e-KYC',
    actorUserId = null,
    photoUrl = null,
  } = params

  const supabase = await createServiceClient()
  const now = new Date().toISOString()
  const cleanMasked = formatMaskedAadhaar(maskedAadhaar)
  const effectivePhoto = photoUrl || extractedData?.photo_base64 || null

  // 1. Fetch current resident
  const { data: resident } = await supabase
    .from('residents')
    .select('*')
    .eq('id', residentId)
    .maybeSingle()

  if (!resident) {
    throw new Error(`Resident ${residentId} not found`)
  }

  const effectiveOrgId = organizationId || resident.organization_id

  // 2. Prepare resident demographics update
  const isoDob = normalizeDobToIso(extractedData?.date_of_birth) || resident.date_of_birth
  let effectiveGender = resident.gender || 'male'
  if (extractedData?.gender) {
    const g = extractedData.gender.toUpperCase()
    effectiveGender = g === 'F' ? 'female' : g === 'M' ? 'male' : 'other'
  }

  const address = extractedData?.address
  const fullAddress = address?.full_address || [
    address?.house,
    address?.street,
    address?.locality,
    address?.district,
    address?.state,
    address?.pincode,
  ].filter(Boolean).join(', ') || resident.permanent_address

  const residentUpdatePayload: Record<string, any> = {
    id_type: 'aadhaar',
    id_number: cleanMasked,
    date_of_birth: isoDob,
    gender: effectiveGender,
    permanent_address: fullAddress,
    permanent_city: address?.district || address?.locality || resident.permanent_city,
    permanent_state: address?.state || resident.permanent_state,
    permanent_pincode: address?.pincode || resident.permanent_pincode,
    updated_at: now,
  }

  if (extractedData?.name) {
    residentUpdatePayload.full_name = extractedData.name
  }

  if (effectivePhoto) {
    residentUpdatePayload.photo_url = effectivePhoto
  }

  const { data: updatedResident, error: resErr } = await supabase
    .from('residents')
    .update(residentUpdatePayload)
    .eq('id', residentId)
    .select()
    .single()

  if (resErr) {
    console.warn('[applyVerifiedKYCToResident] Failed to update resident demographics:', resErr.message)
  }

  // 3. Upsert into tenant_kyc
  const { data: kycRecord, error: kycErr } = await supabase
    .from('tenant_kyc')
    .upsert(
      {
        tenant_id: residentId,
        organization_id: effectiveOrgId,
        verification_id: verificationId,
        verification_status: 'verified',
        verification_method: 'authorized_otp',
        masked_identifier: cleanMasked,
        provider,
        name_match_status: 'match',
        dob_match_status: 'match',
        gender_match_status: 'match',
        verified_at: now,
        risk_level: 'low',
        metadata: {
          extracted_name: extractedData?.name || resident.full_name,
          extracted_dob: isoDob,
          extracted_gender: effectiveGender,
          extracted_address: address || null,
          care_of: extractedData?.care_of || null,
          verified_source: 'Official UIDAI OKYC',
          verified_at: now,
        },
        updated_at: now,
      },
      { onConflict: 'verification_id' }
    )
    .select()
    .single()

  if (kycErr) {
    console.warn('[applyVerifiedKYCToResident] tenant_kyc upsert warning:', kycErr.message)
  }

  // 4. Ensure Aadhaar document exists in resident_documents
  const { data: existingAadhaarDoc } = await supabase
    .from('resident_documents')
    .select('id')
    .eq('resident_id', residentId)
    .eq('doc_type', 'aadhaar')
    .maybeSingle()

  if (!existingAadhaarDoc) {
    await supabase.from('resident_documents').insert({
      id: crypto.randomUUID(),
      organization_id: effectiveOrgId,
      resident_id: residentId,
      doc_type: 'aadhaar',
      doc_name: 'UIDAI e-Aadhaar Verification Card',
      file_url: `/api/residents/${residentId}/documents/aadhaar-card`,
      status: 'verified',
      verified_by: actorUserId,
      verified_at: now,
      notes: `Cryptographically verified via ${provider} (${verificationId})`,
      created_at: now,
      updated_at: now,
    })
  } else {
    await supabase
      .from('resident_documents')
      .update({
        status: 'verified',
        verified_at: now,
        file_url: `/api/residents/${residentId}/documents/aadhaar-card`,
        notes: `Cryptographically verified via ${provider} (${verificationId})`,
        updated_at: now,
      })
      .eq('id', existingAadhaarDoc.id)
  }

  // 5. If Photo exists, ensure photo document exists in resident_documents
  if (effectivePhoto) {
    const { data: existingPhotoDoc } = await supabase
      .from('resident_documents')
      .select('id')
      .eq('resident_id', residentId)
      .eq('doc_type', 'photo')
      .maybeSingle()

    if (!existingPhotoDoc) {
      await supabase.from('resident_documents').insert({
        id: crypto.randomUUID(),
        organization_id: effectiveOrgId,
        resident_id: residentId,
        doc_type: 'photo',
        doc_name: 'Resident Live Photo (Profile)',
        file_url: effectivePhoto,
        status: 'verified',
        verified_by: actorUserId,
        verified_at: now,
        notes: 'Captured and verified during Aadhaar KYC',
        created_at: now,
        updated_at: now,
      })
    } else {
      await supabase
        .from('resident_documents')
        .update({
          file_url: effectivePhoto,
          status: 'verified',
          verified_at: now,
          updated_at: now,
        })
        .eq('id', existingPhotoDoc.id)
    }

    // 6. Update users table avatar_url and name
    try {
      if (resident.phone) {
        const cleanPhone = resident.phone.replace(/\D/g, '').slice(-10)
        const userUpdatePayload: Record<string, any> = { avatar_url: effectivePhoto, updated_at: now }
        if (extractedData?.name) {
          userUpdatePayload.full_name = extractedData.name
        }
        await supabase
          .from('users')
          .update(userUpdatePayload)
          .or(`phone.ilike.%${cleanPhone}%,resident_id.eq.${residentId}`)
      }
    } catch (userErr: any) {
      console.warn('[applyVerifiedKYCToResident] users avatar update warning:', userErr?.message)
    }
  }

  return {
    success: true,
    resident: updatedResident || resident,
    kycRecord,
    photoUrl: effectivePhoto,
  }
}
