import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

const isUuid = (id: string | null | undefined): boolean => {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * POST /api/charges
 * Records arbitrary consumption charges (food, drinks, laundry, damages, etc.) directly into resident ledger
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
    const { resident_id, description, category, quantity, unit_price_paise, total_paise, notes, invoice_id } = body

    if (!resident_id || !description || !total_paise) {
      return NextResponse.json({ error: 'Missing required charge parameters' }, { status: 400 })
    }

    const validUserId = isUuid(user.id) ? user.id : null

    // 1. If linked to an invoice, verify invoice belongs to same org, insert as invoice_item and update invoice balance
    if (invoice_id) {
      const { data: inv } = await serviceClient
        .from('invoices')
        .select('total_paise, balance_paise')
        .eq('id', invoice_id)
        .eq('organization_id', orgId)
        .single()

      if (inv) {
        await serviceClient.from('invoice_items').insert({
          organization_id: orgId,
          invoice_id,
          description,
          category: category || 'other',
          quantity: quantity || 1,
          unit_price_paise: unit_price_paise || total_paise,
          total_paise,
          notes: notes || null,
        })

        await serviceClient
          .from('invoices')
          .update({
            total_paise: inv.total_paise + total_paise,
            balance_paise: inv.balance_paise + total_paise,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoice_id)
          .eq('organization_id', orgId)
      }
    }

    // 2. Post Debit Entry to Resident's Append-Only Ledger
    const { data: ledgerEntry, error: ledgerError } = await serviceClient
      .from('ledger_entries')
      .insert({
        organization_id: orgId,
        resident_id,
        invoice_id: invoice_id || null,
        entry_date: new Date().toISOString().split('T')[0],
        description,
        category: category || 'other',
        entry_type: 'charge',
        debit_paise: total_paise,
        credit_paise: 0,
        notes: notes || null,
        added_by: validUserId,
      })
      .select()
      .single()

    if (ledgerError || !ledgerEntry) {
      return NextResponse.json({ error: ledgerError?.message || 'Failed to add charge to ledger' }, { status: 500 })
    }

    // 3. Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: 'charge_add',
      entity_type: 'ledger_entry',
      entity_id: ledgerEntry.id,
      entity_label: `${description} (${total_paise / 100} INR)`,
      after_data: { resident_id, total_paise, category },
    })

    return NextResponse.json({ success: true, ledger_id: ledgerEntry.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Charge creation failed' }, { status: 500 })
  }
}
