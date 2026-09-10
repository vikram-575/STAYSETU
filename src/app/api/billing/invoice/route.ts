import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * POST /api/billing/invoice
 * Creates an invoice, inserts invoice_items, and automatically logs debit entries into the ledger
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
    const { resident_id, period_start, period_end, due_date, items, notes } = body

    if (!resident_id || !period_start || !period_end || !due_date || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required invoice parameters' }, { status: 400 })
    }

    // Calculate totals in paise
    const subtotalPaise = items.reduce((sum: number, it: any) => sum + (it.total_paise || 0), 0)
    const gstPaise = 0
    const totalPaise = subtotalPaise + gstPaise

    // Generate invoice number
    const { data: invNumber } = await serviceClient.rpc('generate_invoice_number', { p_org_id: orgId })
    const invoiceNumber = invNumber || `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

    const validUserId = isUuid(user.id) ? user.id : null

    // 1. Create Invoice
    const { data: invoice, error: invError } = await serviceClient
      .from('invoices')
      .insert({
        organization_id: orgId,
        invoice_number: invoiceNumber,
        resident_id,
        period_start,
        period_end,
        due_date,
        subtotal_paise: subtotalPaise,
        gst_paise: gstPaise,
        total_paise: totalPaise,
        paid_paise: 0,
        balance_paise: totalPaise,
        status: 'sent',
        notes: notes || null,
        generated_by: validUserId,
      })
      .select()
      .single()

    if (invError || !invoice) {
      return NextResponse.json({ error: invError?.message || 'Failed to create invoice' }, { status: 500 })
    }

    // 2. Create Invoice Items
    const itemInserts = items.map((it: any, idx: number) => ({
      organization_id: orgId,
      invoice_id: invoice.id,
      description: it.description,
      category: it.category || 'other',
      quantity: it.quantity || 1,
      unit_price_paise: it.unit_price_paise,
      total_paise: it.total_paise,
      sort_order: idx,
    }))

    await serviceClient.from('invoice_items').insert(itemInserts)

    // 3. Create Ledger Entry for each charge or consolidated invoice debit
    await serviceClient.from('ledger_entries').insert({
      organization_id: orgId,
      resident_id,
      invoice_id: invoice.id,
      entry_date: period_start,
      description: `Monthly Statement: ${invoiceNumber}`,
      category: 'rent',
      entry_type: 'charge',
      debit_paise: totalPaise,
      credit_paise: 0,
      added_by: validUserId,
      notes: `Billed for ${period_start} to ${period_end}`,
    })

    // 4. Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: 'invoice_generate',
      entity_type: 'invoice',
      entity_id: invoice.id,
      entity_label: invoiceNumber,
      after_data: { totalPaise, resident_id, period_start, period_end },
    })

    return NextResponse.json({ success: true, invoice_id: invoice.id, invoice_number: invoiceNumber })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invoice generation failed' }, { status: 500 })
  }
}
