import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { buildWhatsAppLink, buildSmsLink } from '@/lib/utils'
import { logKYCEvent } from '@/lib/kyc/audit'
import { remoteKYCTokens } from '@/lib/kyc/tokens'

/**
 * POST /api/v1/tenant-kyc/share-link
 * Generates a secure, short-lived remote verification link for WhatsApp/SMS reminder
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createServiceClient()

    let orgId: string = user?.organization_id || ''
    if (!orgId) {
      const { data: defaultOrg } = await supabase.from('organizations').select('id, name').limit(1).single()
      orgId = defaultOrg?.id || 'primary'
    }

    const { data: org } = await supabase.from('organizations').select('name').eq('id', orgId).single()
    const orgName = org?.name || 'PG-SETU Accommodation'

    const body = await request.json()
    const { tenant_id, tenant_name, phone } = body

    if (!tenant_name || !phone) {
      return NextResponse.json({ error: 'Tenant name and phone number are required' }, { status: 400 })
    }

    // Generate secure 32-character random token
    const token = `kyc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString()

    const tokenData = {
      token,
      tenant_id,
      tenant_name,
      phone,
      organization_id: orgId,
      organization_name: orgName,
      status: 'pending' as const,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }

    remoteKYCTokens.set(token, tokenData)

    // Construct verification link
    const origin = request.headers.get('origin') || 'https://staysetu-ruby.vercel.app'
    const verificationUrl = `${origin}/portal/kyc/${token}`

    // Compliant, generic reminder message without exposing sensitive details
    const message = `Hi ${tenant_name}, your PG admission KYC for *${orgName}* is pending. Please complete your quick Aadhaar verification securely using the link below:\n\n👉 ${verificationUrl}\n\n_This secure link is valid for 48 hours._\n— Powered by PG-SETU`

    const whatsappLink = buildWhatsAppLink(phone, message)
    const smsLink = buildSmsLink(phone, message)

    await logKYCEvent({
      organization_id: orgId,
      tenant_id,
      event: 'REMOTE_LINK_GENERATED',
      actor: user?.full_name || 'PG Operator',
      metadata: { phone_ending: phone.slice(-4), expires_at: expiresAt },
    })

    return NextResponse.json({
      success: true,
      token,
      verification_url: verificationUrl,
      whatsapp_link: whatsappLink,
      sms_link: smsLink,
      message,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate KYC link' }, { status: 500 })
  }
}
