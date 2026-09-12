import { NextResponse, type NextRequest } from 'next/server'
import { processWhatsAppMessage, normalizePhoneNumber } from '@/lib/whatsapp/bot-engine'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'pgsetu_secure_webhook_token_2026'

/**
 * GET handler for Meta WhatsApp Webhook verification handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WhatsApp Webhook verified successfully!')
    return new Response(challenge || 'VERIFIED', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({ error: 'Verification token mismatch' }, { status: 403 })
}

/**
 * POST handler for processing incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const replies: any[] = []

    // A. Meta WhatsApp Cloud API Payload Structure
    if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {
          const value = change.value
          if (!value || !value.messages) continue

          for (const msg of value.messages) {
            const fromPhone = msg.from
            let messageText = ''

            if (msg.type === 'text' && msg.text?.body) {
              messageText = msg.text.body
            } else if (msg.type === 'interactive') {
              messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || ''
            }

            if (!messageText) continue

            // Find contact profile name if available
            const contact = value.contacts?.find((c: any) => c.wa_id === fromPhone)
            const senderName = contact?.profile?.name

            const result = await processWhatsAppMessage({
              phone: fromPhone,
              message: messageText,
              senderName,
            })

            // Dispatch outbound reply back to sender
            await sendWhatsAppMessage({
              to: fromPhone,
              text: result.replyText,
              organizationId: result.residentData?.organizationId,
              residentId: result.residentData?.id,
            })

            replies.push({
              phone: fromPhone,
              query: messageText,
              reply: result.replyText,
              intent: result.intent,
            })
          }
        }
      }

      return NextResponse.json({ success: true, processedCount: replies.length, replies })
    }

    // B. Direct JSON Developer / Simulator Payload
    const phone = body.phone || body.from || '9876543210'
    const message = body.message || body.text || ''
    const senderName = body.senderName || body.name || undefined
    const residentId = body.residentId || undefined

    const result = await processWhatsAppMessage({
      phone,
      message,
      senderName,
      residentId,
    })

    // Dispatch or record outbound message
    await sendWhatsAppMessage({
      to: phone,
      text: result.replyText,
      organizationId: result.residentData?.organizationId,
      residentId: result.residentData?.id,
    })

    return NextResponse.json({
      success: true,
      senderPhone: result.senderPhone,
      senderRole: result.senderRole,
      intent: result.intent,
      query: message,
      reply: result.replyText,
      ticketCreated: result.ticketCreated,
      timestamp: result.timestamp,
    })
  } catch (error: any) {
    console.error('WhatsApp webhook processing error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to process webhook' }, { status: 500 })
  }
}
