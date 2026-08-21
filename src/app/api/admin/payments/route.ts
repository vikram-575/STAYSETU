import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const url = new URL(request.url)
    const orgId = url.searchParams.get('org_id')
    const limit = Number(url.searchParams.get('limit')) || 50

    let query = supabase
      .from('payments')
      .select('id, payment_number, amount_paise, payment_method, payment_date, transaction_id, status, notes, created_at, organization_id, organizations(name), residents(full_name, registration_number, phone)')
      .order('payment_date', { ascending: false })
      .limit(limit)

    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    const { data: payments, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      payments: payments || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch platform payments' }, { status: 500 })
  }
}
