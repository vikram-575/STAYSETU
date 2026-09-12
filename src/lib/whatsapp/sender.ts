import { createServiceClient } from '@/lib/supabase/server'
import { normalizePhoneNumber, toWhatsAppWaId } from './bot-engine'

export interface SendWhatsAppParams {
  to: string
  text: string
  organizationId?: string | null
  residentId?: string | null
  templateName?: string
  variables?: Record<string, string>
}

export interface SendWhatsAppResult {
  success: boolean
  messageId: string
  mode: 'live' | 'simulator'
  to: string
  timestamp: string
  error?: string
}

/**
 * Dispatches outbound WhatsApp message via Meta Cloud API with graceful Sandbox fallback
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const normPhone = normalizePhoneNumber(params.to)
  const waId = toWhatsAppWaId(params.to)
  const now = new Date().toISOString()

  const apiToken = process.env.WHATSAPP_API_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  let messageId = `wamid_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  let mode: 'live' | 'simulator' = 'simulator'
  let deliveryError: string | undefined = undefined

  // 1. Check if Meta Cloud API is configured
  if (apiToken && phoneId) {
    try {
      const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: waId,
          type: 'text',
          text: { preview_url: true, body: params.text },
        }),
      })

      const metaData = await metaRes.json()
      if (metaRes.ok && metaData.messages?.[0]?.id) {
        messageId = metaData.messages[0].id
        mode = 'live'
      } else {
        deliveryError = metaData?.error?.message || 'Meta API error'
        console.warn('Meta WhatsApp Cloud API dispatch warning (falling back to sandbox):', deliveryError)
      }
    } catch (err: any) {
      deliveryError = err?.message || 'Network failure to Meta API'
      console.warn('Meta WhatsApp Cloud API dispatch exception:', deliveryError)
    }
  }

  // 2. Persist audit log in Supabase message_logs
  try {
    const supabase = await createServiceClient()
    await supabase.from('message_logs').insert({
      organization_id: params.organizationId || null,
      resident_id: params.residentId || null,
      channel: 'whatsapp',
      recipient_phone: normPhone,
      message_body: params.text,
      status: deliveryError ? 'failed' : 'delivered',
      wa_link: `https://wa.me/${waId}?text=${encodeURIComponent(params.text)}`,
      created_at: now,
    })
  } catch (dbErr) {
    console.error('Failed to log WhatsApp message to database:', dbErr)
  }

  return {
    success: !deliveryError,
    messageId,
    mode,
    to: normPhone,
    timestamp: now,
    error: deliveryError,
  }
}
