import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { getAadhaarProvider, globalKYCSessions } from '@/lib/kyc/provider'
import { createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v1/tenant-kyc/[id]/otp
 * Validates OTP with authorized provider and executes verification engine
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: sessionId } = await params
    const body = await request.json()
    const { otp } = body

    if (!otp || String(otp).trim().length !== 6) {
      return NextResponse.json({ error: 'Valid 6-digit OTP is required' }, { status: 400 })
    }

    const provider = getAadhaarProvider()
    const verificationResult = await provider.verifyAuthentication({
      session_id: sessionId,
      otp: String(otp).trim(),
    })

    if (!verificationResult.success && verificationResult.status === 'not_verified') {
      return NextResponse.json(verificationResult, { status: 400 })
    }

    // Persist verified KYC record in Supabase
    const session = globalKYCSessions.get(sessionId)
    if (session && verificationResult.status === 'verified') {
      try {
        const supabase = await createServiceClient()
        const user = await getAuthenticatedUser()
        const effectiveOrgId = await resolveEffectiveOrgId(user)
        const orgId = (session.organization_id && isValidUUID(session.organization_id)) ? session.organization_id : effectiveOrgId

        // 1. Insert/Upsert into tenant_kyc
        const { data: kycRecord, error: kycErr } = await supabase
          .from('tenant_kyc')
          .upsert({
            tenant_id: session.tenant_id || null,
            organization_id: orgId,
            verification_id: verificationResult.verification_id,
            verification_status: 'verified',
            verification_method: 'authorized_otp',
            masked_identifier: session.masked_aadhaar,
            provider: provider.name,
            verified_at: new Date().toISOString(),
            risk_level: 'low',
            metadata: {
              extracted_name: verificationResult.extracted_data?.name,
              extracted_dob: verificationResult.extracted_data?.date_of_birth,
              extracted_gender: verificationResult.extracted_data?.gender,
              checks_summary: verificationResult.checks.map((c) => ({ type: c.check_type, status: c.status })),
            },
          }, { onConflict: 'verification_id' })
          .select()
          .single()

        if (kycRecord) {
          verificationResult.kyc_record = kycRecord
        }

        // 2. If a tenant_id exists, update resident's KYC status directly in Supabase
        if (session.tenant_id) {
          await supabase
            .from('residents')
            .update({
              id_type: 'aadhaar',
              id_number: session.masked_aadhaar,
              notes: `Aadhaar Verified (${verificationResult.verification_id}) on ${new Date().toLocaleDateString('en-IN')}`,
            })
            .eq('id', session.tenant_id)
            .eq('organization_id', orgId)
        }
      } catch (dbErr) {
        console.warn('[KYC DB Persist Warning]:', dbErr)
      }
    }

    return NextResponse.json(verificationResult)
  } catch (err: any) {
    console.error('[KYC OTP Verify Error]:', err)
    return NextResponse.json({ error: err.message || 'OTP verification failed' }, { status: 500 })
  }
}
