import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * GET /api/payments/daily-closing
 * Fetches cash collections summary and closing status for a given date
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ expectedCashPaise: 0, isClosed: false })
    }

    const { searchParams } = request.nextUrl
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    const [{ data: cashPayments }, { data: existingClosing }] = await Promise.all([
      serviceClient
        .from('payments')
        .select('amount_paise')
        .eq('organization_id', orgId)
        .eq('payment_date', date)
        .eq('payment_method', 'cash')
        .eq('status', 'completed'),
      serviceClient
        .from('daily_closings')
        .select('*')
        .eq('organization_id', orgId)
        .eq('closing_date', date)
        .maybeSingle(),
    ])

    const expectedCashPaise = cashPayments?.reduce((s, p) => s + p.amount_paise, 0) || 0

    return NextResponse.json({
      date,
      expectedCashPaise,
      closing: existingClosing || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch daily closing' }, { status: 500 })
  }
}

/**
 * POST /api/payments/daily-closing
 * Locks daily cash closing and logs any discrepancies
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'accountant', 'staff', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const { closing_date, expected_cash_paise, recorded_cash_paise, explanation, property_id } = body

    if (!closing_date) {
      return NextResponse.json({ error: 'Closing date is required' }, { status: 400 })
    }

    const validUserId = isUuid(user.id) ? user.id : null

    // Upsert daily closing
    const { data: closing, error: closeError } = await serviceClient
      .from('daily_closings')
      .upsert({
        organization_id: orgId,
        property_id: property_id || null,
        closing_date,
        expected_cash_paise: expected_cash_paise || 0,
        recorded_cash_paise: recorded_cash_paise || 0,
        explanation: explanation || null,
        closed_by: validUserId,
      }, {
        onConflict: 'organization_id,property_id,closing_date',
      })
      .select()
      .single()

    if (closeError) {
      return NextResponse.json({ error: closeError.message }, { status: 500 })
    }

    // Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: 'update',
      entity_type: 'daily_closing',
      entity_id: closing.id,
      entity_label: `Cash Closing for ${closing_date}`,
      after_data: { expected_cash_paise, recorded_cash_paise, explanation },
    })

    return NextResponse.json({ success: true, closing_id: closing.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Daily closing failed' }, { status: 500 })
  }
}
