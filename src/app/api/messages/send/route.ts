import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/messages/send
 * Log a message send attempt and return wa.me / sms: links
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role, organizations(name)')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'manager', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { resident_ids, template_id, custom_message } = body

  if (!resident_ids || resident_ids.length === 0) {
    return NextResponse.json({ error: 'No residents selected' }, { status: 400 })
  }

  // Get residents
  const { data: residents } = await supabase
    .from('v_resident_current')
    .select('resident_id, full_name, phone, registration_number, room_number, bed_label, total_outstanding_paise')
    .in('resident_id', resident_ids)
    .eq('organization_id', profile.organization_id)

  if (!residents || residents.length === 0) {
    return NextResponse.json({ error: 'No valid residents found' }, { status: 400 })
  }

  // Get template if provided
  let templateBody = custom_message || 'Hello {{resident_name}}, your PG outstanding balance is ₹{{amount_due}}. Reg No: {{registration_number}}. Please pay at the earliest.'

  if (template_id) {
    const { data: template } = await supabase
      .from('message_templates')
      .select('body_template')
      .eq('id', template_id)
      .eq('organization_id', profile.organization_id)
      .single()
    if (template) templateBody = template.body_template
  }

  const orgName = (profile.organizations as any)?.name ?? 'PG'

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
    organization_id: profile.organization_id,
    resident_id: l.resident_id,
    template_id: template_id ?? null,
    channel: 'whatsapp' as const,
    recipient_phone: l.phone,
    message_body: l.message,
    status: 'queued' as const,
    wa_link: l.wa_link,
    sms_link: l.sms_link,
  }))

  await supabase.from('message_logs').insert(logInserts)

  return NextResponse.json({ success: true, links })
}
