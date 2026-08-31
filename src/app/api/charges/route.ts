import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/charges
 * Records arbitrary consumption charges (food, drinks, laundry, damages, etc.) directly into resident ledger
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

    if (!profile || !['owner', 'manager', 'accountant', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orgId = profile.organization_id
    if (!orgId) return NextResponse.json({ error: 'No active organization found' }, { status: 400 })

    const body = await request.json()
    const { resident_id, description, category, quantity, unit_price_paise, total_paise, notes, invoice_id } = body

    if (!resident_id || !description || !total_paise) {
      return NextResponse.json({ error: 'Missing required charge parameters' }, { status: 400 })
    }

    // 1. If linked to an invoice, verify invoice belongs to same org, insert as invoice_item and update invoice balance
    if (invoice_id) {
      const { data: inv } = await supabase
        .from('invoices')
        .select('total_paise, balance_paise')
        .eq('id', invoice_id)
        .eq('organization_id', orgId)
        .single()

      if (inv) {
        await supabase.from('invoice_items').insert({
          organization_id: orgId,
          invoice_id,
          description,
          category: category || 'other',
          quantity: quantity || 1,
          unit_price_paise: unit_price_paise || total_paise,
          total_paise,
          notes: notes || null,
        })

        await supabase
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
    const { data: ledgerEntry, error: ledgerError } = await supabase
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
        added_by: user.id,
      })
      .select()
      .single()

    if (ledgerError || !ledgerEntry) {
      return NextResponse.json({ error: ledgerError?.message || 'Failed to add charge to ledger' }, { status: 500 })
    }

    // 3. Audit Log
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: user.id,
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
