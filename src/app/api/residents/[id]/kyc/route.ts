import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { createServiceClient } from '@/lib/supabase/server'
import { applyVerifiedKYCToResident } from '@/lib/kyc/sync-kyc'
import type { AadhaarExtractedData } from '@/lib/kyc/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/residents/[id]/kyc
 * Updates or completes KYC for an existing resident using verified Sandbox Aadhaar data.
 * Updates resident demographics, tenant_kyc, resident_documents, and user profile avatar.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: residentId } = await params
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'Valid organization required' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data: resident } = await supabase
      .from('residents')
      .select('*')
      .eq('id', residentId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      verification_id,
      masked_aadhaar,
      extracted_data,
      photo_url,
    } = body

    if (!verification_id) {
      return NextResponse.json({ error: 'Verification ID is required' }, { status: 400 })
    }

    const result = await applyVerifiedKYCToResident({
      residentId,
      organizationId: orgId,
      verificationId: verification_id,
      maskedAadhaar: masked_aadhaar || resident.id_number || 'XXXX XXXX 9453',
      extractedData: (extracted_data as AadhaarExtractedData) || null,
      provider: 'Sandbox Live Aadhaar e-KYC',
      actorUserId: user.id,
      photoUrl: photo_url || extracted_data?.photo_base64 || null,
    })

    return NextResponse.json({
      success: true,
      message: 'KYC verified and synchronized successfully.',
      resident: result.resident,
      kyc_record: result.kycRecord,
      photo_url: result.photoUrl,
    })
  } catch (err: any) {
    console.error('[Resident KYC Route Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to apply KYC' }, { status: 500 })
  }
}
