import { NextResponse, type NextRequest } from 'next/server'
import { createDiditSession } from '@/lib/didit'

/**
 * POST /api/v1/didit/create-session
 * Initiates a Didit identity verification session for a resident
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { resident_name, phone, tenant_id, callback_url } = body

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '')
    const vendorData = tenant_id || (cleanPhone ? `resident_${cleanPhone}` : `resident_${Date.now()}`)

    const session = await createDiditSession({
      vendorData,
      callbackUrl: callback_url,
    })

    // Pre-build WhatsApp sharing link if phone is provided
    let whatsappLink = ''
    if (cleanPhone.length >= 10) {
      const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
      const nameGreeting = resident_name ? `Hello ${resident_name}` : 'Hello'
      const text = `${nameGreeting},\n\nPlease complete your digital identity verification for PG-SETU stay:\n👉 ${session.url}\n\nTakes less than 2 minutes. Thank you!`
      whatsappLink = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
    }

    return NextResponse.json({
      success: true,
      session_id: session.sessionId,
      session_token: session.sessionToken,
      url: session.url,
      status: session.status,
      whatsapp_link: whatsappLink,
    })
  } catch (err: any) {
    console.error('[Didit Create Session Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create Didit verification session' },
      { status: 500 }
    )
  }
}
