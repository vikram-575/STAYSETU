import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * POST /api/expenses
 * Record a new operational expense
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'accountant', 'staff', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    let orgId = user.organization_id
    if (!orgId) {
      const { data: defaultOrg } = await serviceClient.from('organizations').select('id').limit(1).single()
      orgId = defaultOrg?.id || 'primary'
    }

    const body = await request.json()
    const {
      category, description, amount_rupees, expense_date,
      payment_method, vendor, reference_no, notes, property_id
    } = body

    if (!category || !description || !amount_rupees || amount_rupees <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount_paise = Math.round(amount_rupees * 100)
    const validUserId = isUuid(user.id) ? user.id : null

    const { data, error } = await serviceClient
      .from('expenses')
      .insert({
        organization_id: orgId,
        property_id: property_id ?? null,
        category,
        description,
        amount_paise,
        expense_date: expense_date ?? new Date().toISOString().split('T')[0],
        payment_method: payment_method ?? null,
        vendor: vendor ?? null,
        reference_no: reference_no ?? null,
        notes: notes ?? null,
        recorded_by: validUserId,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to record expense' }, { status: 500 })
    }

    // Audit log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: 'create',
      entity_type: 'expense',
      entity_id: data.id,
      entity_label: description,
      after_data: { amount_paise, category, description },
    })

    return NextResponse.json({ success: true, expense_id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Expense creation failed' }, { status: 500 })
  }
}

/**
 * GET /api/expenses
 * List expenses with filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'accountant', 'staff', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    let orgId = user.organization_id
    if (!orgId) {
      const { data: defaultOrg } = await serviceClient.from('organizations').select('id').limit(1).single()
      orgId = defaultOrg?.id || 'primary'
    }

    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const category = searchParams.get('category')

    let query = serviceClient
      .from('expenses')
      .select('*')
      .eq('organization_id', orgId)
      .order('expense_date', { ascending: false })

    if (startDate) query = query.gte('expense_date', startDate)
    if (endDate) query = query.lte('expense_date', endDate)
    if (category && category !== 'all') query = query.eq('category', category)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ expenses: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch expenses' }, { status: 500 })
  }
}
