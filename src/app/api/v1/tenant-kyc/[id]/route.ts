import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'
import { globalKYCSessions } from '@/lib/kyc/provider'
import { createServiceClient } from '@/lib/supabase/server'
import { getKYCAuditLogs } from '@/lib/kyc/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/tenant-kyc/[id]
 * Fetches KYC verification details, itemized checks, and audit history
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: identifier } = await params
    const user = await getAuthenticatedUser()
    const supabase = await createServiceClient()

    const orgId: string = (await resolveEffectiveOrgId(user)) || ''

    // 1. Check in-memory transient session
    const session = globalKYCSessions.get(identifier)
    if (session) {
      return NextResponse.json({
        success: true,
        verification_id: session.verification_id,
        status: session.status === 'authenticated' ? 'verified' : session.status,
        masked_identifier: session.masked_aadhaar,
        extracted_data: session.extracted_data,
        checks: session.checks || [],
        expires_at: session.expires_at,
        created_at: session.created_at,
      })
    }

    // 2. Query Supabase tenant_kyc table by verification_id or id
    const { data: kycRecord } = await supabase
      .from('tenant_kyc')
      .select('*')
      .or(`verification_id.eq.${identifier},id.eq.${identifier}`)
      .eq('organization_id', orgId)
      .single()

    if (kycRecord) {
      const auditLogs = await getKYCAuditLogs(kycRecord.verification_id, orgId)
      return NextResponse.json({
        success: true,
        record: kycRecord,
        audit_logs: auditLogs,
      })
    }

    return NextResponse.json({ error: 'KYC Verification record not found' }, { status: 404 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch KYC record' }, { status: 500 })
  }
}
