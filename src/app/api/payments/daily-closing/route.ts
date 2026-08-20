import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/payments/daily-closing
 * Locks daily cash closing and logs any discrepancies
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'manager', 'accountant'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = profile.organization_id
  const body = await request.json()
  const { closing_date, expected_cash_paise, recorded_cash_paise, explanation, property_id } = body

  if (!closing_date) {
    return NextResponse.json({ error: 'Closing date is required' }, { status: 400 })
  }

  // Upsert daily closing
  const { data: closing, error: closeError } = await supabase
    .from('daily_closings')
    .upsert({
      organization_id: orgId,
      property_id: property_id || null,
      closing_date,
      expected_cash_paise: expected_cash_paise || 0,
      recorded_cash_paise: recorded_cash_paise || 0,
      explanation: explanation || null,
      closed_by: user.id,
    }, {
      onConflict: 'organization_id,property_id,closing_date',
    })
    .select()
    .single()

  if (closeError) {
    return NextResponse.json({ error: closeError.message }, { status: 500 })
  }

  // Audit Log
  await supabase.from('audit_logs').insert({
    organization_id: orgId,
    user_id: user.id,
    action: 'update',
    entity_type: 'daily_closing',
    entity_id: closing.id,
    entity_label: `Cash Closing for ${closing_date}`,
    after_data: { expected_cash_paise, recorded_cash_paise, explanation },
  })

  return NextResponse.json({ success: true, closing_id: closing.id })
}
