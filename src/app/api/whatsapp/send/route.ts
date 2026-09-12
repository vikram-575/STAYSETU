import { NextResponse, type NextRequest } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'
import { normalizePhoneNumber } from '@/lib/whatsapp/bot-engine'
import { getAuthenticatedUser } from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const body = await request.json()
    const { to, text, residentId, organizationId } = body

    if (!to || !text) {
      return NextResponse.json({ error: 'Recipient phone ("to") and message text ("text") are required.' }, { status: 400 })
    }

    const effectiveOrgId = organizationId || user?.organization_id || null

    const result = await sendWhatsAppMessage({
      to,
      text,
      organizationId: effectiveOrgId,
      residentId,
    })

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Failed to dispatch WhatsApp message:', err)
    return NextResponse.json({ error: err?.message || 'Failed to dispatch message' }, { status: 500 })
  }
}
