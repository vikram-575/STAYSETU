import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/expenses
 * Record a new expense
 */
export async function POST(request: NextRequest) {
  try {
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
    if (!orgId) return NextResponse.json({ error: 'No active organization found' }, { status: 400 })

    const body = await request.json()
    const {
      category, description, amount_rupees, expense_date,
      payment_method, vendor, reference_no, notes, property_id
    } = body

    if (!category || !description || !amount_rupees || amount_rupees <= 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount_paise = Math.round(amount_rupees * 100)

    const { data, error } = await supabase
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
        recorded_by: user.id,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to record expense' }, { status: 500 })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: user.id,
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
    if (!orgId) return NextResponse.json({ expenses: [] })

    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const category = searchParams.get('category')

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', orgId)
      .order('expense_date', { ascending: false })

    if (startDate) query = query.gte('expense_date', startDate)
    if (endDate) query = query.lte('expense_date', endDate)
    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ expenses: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch expenses' }, { status: 500 })
  }
}
