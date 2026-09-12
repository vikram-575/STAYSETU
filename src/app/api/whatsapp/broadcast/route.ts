import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createServiceClient()
    const body = await request.json()
    const {
      audience = 'all',
      roomNumber,
      message,
      orgId = user?.organization_id,
    } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Broadcast message text is required' }, { status: 400 })
    }

    let query = supabase
      .from('v_resident_current')
      .select('resident_id, full_name, phone, room_number, organization_id')
      .eq('status', 'active')

    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    if (audience === 'defaulters') {
      query = query.gt('total_outstanding_paise', 0)
    } else if (audience === 'room' && roomNumber) {
      query = query.eq('room_number', roomNumber)
    }

    const { data: recipients, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = recipients || []
    const results: any[] = []

    for (const r of list) {
      if (!r.phone) continue

      // Variable interpolation
      const personalizedMsg = message
        .replace(/{{name}}/g, r.full_name)
        .replace(/{{room}}/g, r.room_number)

      const sendRes = await sendWhatsAppMessage({
        to: r.phone,
        text: personalizedMsg,
        organizationId: r.organization_id,
        residentId: r.resident_id,
      })

      results.push({
        residentId: r.resident_id,
        name: r.full_name,
        phone: r.phone,
        room: r.room_number,
        success: sendRes.success,
      })
    }

    return NextResponse.json({
      success: true,
      audience,
      targetedCount: list.length,
      dispatchedCount: results.length,
      results,
    })
  } catch (err: any) {
    console.error('Failed executing broadcast:', err)
    return NextResponse.json({ error: err?.message || 'Broadcast failed' }, { status: 500 })
  }
}
