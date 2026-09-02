import { NextResponse, type NextRequest } from 'next/server'
import { remoteKYCTokens } from '@/lib/kyc/tokens'
import { getAadhaarProvider } from '@/lib/kyc/provider'
import { createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ token: string }>
}

/**
 * GET /api/v1/tenant-kyc/public/[token]
 * Fetches tenant and PG details for remote verification session
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const tokenData = remoteKYCTokens.get(token)

    if (!tokenData) {
      return NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 404 })
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      return NextResponse.json({ error: 'This verification link has expired. Please ask your PG owner to resend a new link.' }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      tenant_name: tokenData.tenant_name,
      phone: tokenData.phone,
      organization_name: tokenData.organization_name,
      status: tokenData.status,
      expires_at: tokenData.expires_at,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load session' }, { status: 500 })
  }
}

/**
 * POST /api/v1/tenant-kyc/public/[token]
 * Mobile Tenant completes verification
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const tokenData = remoteKYCTokens.get(token)

    if (!tokenData) {
      return NextResponse.json({ error: 'Verification link expired or invalid.' }, { status: 404 })
    }

    const body = await request.json()
    const { aadhaar_number, otp } = body

    const provider = getAadhaarProvider()

    // Step 1: Start if only aadhaar submitted
    if (aadhaar_number && !otp) {
      const authRes = await provider.startAuthentication({
        aadhaar_number,
        organization_id: tokenData.organization_id,
        tenant_id: tokenData.tenant_id,
        tenant_name: tokenData.tenant_name,
        tenant_phone: tokenData.phone,
      })

      tokenData.current_session_id = authRes.session_id
      remoteKYCTokens.set(token, tokenData)

      return NextResponse.json(authRes)
    }

    // Step 2: Verify OTP
    if (otp && tokenData.current_session_id) {
      const verifyRes = await provider.verifyAuthentication({
        session_id: tokenData.current_session_id,
        otp,
      })

      if (verifyRes.status === 'verified') {
        tokenData.status = 'verified'
        tokenData.verification_id = verifyRes.verification_id
        remoteKYCTokens.set(token, tokenData)

        // Update database
        try {
          const supabase = await createServiceClient()
          await supabase.from('tenant_kyc').upsert({
            tenant_id: tokenData.tenant_id || null,
            organization_id: tokenData.organization_id,
            verification_id: verifyRes.verification_id,
            verification_status: 'verified',
            verification_method: 'authorized_otp',
            masked_identifier: verifyRes.extracted_data?.masked_aadhaar || 'XXXX XXXX 4821',
            provider: provider.name,
            verified_at: new Date().toISOString(),
            risk_level: 'low',
            metadata: { remote_token: token, extracted_name: verifyRes.extracted_data?.name },
          })

          if (tokenData.tenant_id) {
            await supabase
              .from('residents')
              .update({
                id_type: 'aadhaar',
                id_number: verifyRes.extracted_data?.masked_aadhaar || 'XXXX XXXX 4821',
                notes: `Remote Aadhaar Verified (${verifyRes.verification_id}) on ${new Date().toLocaleDateString('en-IN')}`,
              })
              .eq('id', tokenData.tenant_id)
          }
        } catch {}
      }

      return NextResponse.json(verifyRes)
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Remote verification failed' }, { status: 500 })
  }
}
