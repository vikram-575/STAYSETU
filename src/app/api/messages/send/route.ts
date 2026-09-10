import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

/**
 * POST /api/messages/send
 * Log a message send attempt and return wa.me / sms: links
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'staff', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    let orgId = user.organization_id
    if (!orgId) {
      const { data: defaultOrg } = await serviceClient.from('organizations').select('id').limit(1).single()
      orgId = defaultOrg?.id || 'primary'
    }

    const body = await request.json()
    const { resident_ids, template_id, custom_message } = body

    if (!resident_ids || resident_ids.length === 0) {
      return NextResponse.json({ error: 'No residents selected' }, { status: 400 })
    }

    // Get residents
    const { data: residents } = await serviceClient
      .from('v_resident_current')
      .select('resident_id, full_name, phone, registration_number, room_number, bed_label, total_outstanding_paise')
      .in('resident_id', resident_ids)
      .eq('organization_id', orgId)

    if (!residents || residents.length === 0) {
      return NextResponse.json({ error: 'No valid residents found' }, { status: 400 })
    }

    // Get template if provided
    let templateBody = custom_message || 'Hello {{resident_name}}, your PG outstanding balance is ₹{{amount_due}}. Reg No: {{registration_number}}. Please pay at the earliest.'

    if (template_id) {
      const { data: template } = await serviceClient
        .from('message_templates')
        .select('body_template')
        .eq('id', template_id)
        .eq('organization_id', orgId)
        .single()
      if (template) templateBody = template.body_template
    }

    const orgName = user.organizations?.name ?? 'PG'

    // Build links for each resident
    const links = residents.map((r) => {
      // Replace template variables
      const amount = Math.round(r.total_outstanding_paise / 100)
      const message = templateBody
        .replace(/\{\{resident_name\}\}/g, r.full_name)
        .replace(/\{\{registration_no\}\}/g, r.registration_number)
        .replace(/\{\{registration_number\}\}/g, r.registration_number)
        .replace(/\{\{room_no\}\}/g, r.room_number ?? '')
        .replace(/\{\{bed_no\}\}/g, r.bed_label ?? '')
        .replace(/\{\{amount_due\}\}/g, amount.toLocaleString('en-IN'))
        .replace(/\{\{pg_name\}\}/g, orgName)

      // Normalize phone
      let phone = (r.phone ?? '').replace(/\D/g, '')
      if (phone.startsWith('0')) phone = phone.substring(1)
      if (!phone.startsWith('91') && phone.length === 10) phone = '91' + phone

      const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      const smsPhone = phone.startsWith('91') ? phone.substring(2) : phone
      const smsLink = `sms:${smsPhone}?body=${encodeURIComponent(message)}`

      return {
        resident_id: r.resident_id,
        resident_name: r.full_name,
        phone: r.phone,
        message,
        wa_link: waLink,
        sms_link: smsLink,
      }
    })

    // Log all message attempts
    const logInserts = links.map((l) => ({
      organization_id: orgId,
      resident_id: l.resident_id,
      template_id: template_id ?? null,
      channel: 'whatsapp' as const,
      recipient_phone: l.phone,
      message_body: l.message,
      status: 'queued' as const,
      wa_link: l.wa_link,
      sms_link: l.sms_link,
    }))

    await serviceClient.from('message_logs').insert(logInserts)

    return NextResponse.json({ success: true, links })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process messages' }, { status: 500 })
  }
}
