import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'
import { getAadhaarProvider } from '@/lib/kyc/provider'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/v1/tenant-kyc/start
 * Initiates an authorized Aadhaar verification session
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createServiceClient()

    const orgId: string = (await resolveEffectiveOrgId(user)) || ''

    const body = await request.json()
    const { aadhaar_number, tenant_id, tenant_name, tenant_phone, tenant_dob, tenant_gender } = body

    if (!aadhaar_number) {
      return NextResponse.json({ error: 'Aadhaar number is required' }, { status: 400 })
    }

    const provider = getAadhaarProvider()
    const result = await provider.startAuthentication({
      aadhaar_number,
      organization_id: orgId,
      tenant_id,
      tenant_name,
      tenant_phone,
      tenant_dob,
      tenant_gender,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[KYC Start Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to initiate verification' }, { status: 500 })
  }
}
