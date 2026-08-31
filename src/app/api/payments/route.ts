import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/payments
 * Records payment, allocates to oldest open invoices, handles advance/credit balance, logs ledger credit and audit trail
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
      resident_id, amount_paise, payment_method, payment_date,
      transaction_id, reference_no, notes, idempotency_key, invoice_id
    } = body

    if (!resident_id || !amount_paise || amount_paise <= 0 || !payment_method) {
      return NextResponse.json({ error: 'Missing required payment parameters' }, { status: 400 })
    }

    // Check Idempotency to prevent double clicks
    if (idempotency_key) {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, payment_number')
        .eq('organization_id', orgId)
        .eq('idempotency_key', idempotency_key)
        .single()

      if (existingPayment) {
        return NextResponse.json({
          success: true,
          payment_id: existingPayment.id,
          payment_number: existingPayment.payment_number,
          is_duplicate_suppressed: true,
        })
      }
    }

    // Generate Payment Number
    const { data: payNumber } = await supabase.rpc('generate_payment_number', { p_org_id: orgId })
    const paymentNumber = payNumber || `PAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

    // 1. Create Payment record
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .insert({
        organization_id: orgId,
        payment_number: paymentNumber,
        resident_id,
        amount_paise,
        payment_method,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        payment_time: new Date().toISOString(),
        transaction_id: transaction_id || null,
        reference_no: reference_no || null,
        status: 'completed',
        notes: notes || null,
        collected_by: user.id,
        idempotency_key: idempotency_key || null,
      })
      .select()
      .single()

    if (payError || !payment) {
      return NextResponse.json({ error: payError?.message || 'Failed to record payment' }, { status: 500 })
    }

    // 2. Allocate payment to oldest unpaid invoices
    let remainingToAllocate = amount_paise

    // If specific invoice provided
    if (invoice_id) {
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice_id)
        .eq('organization_id', orgId)
        .single()

      if (inv) {
        const allocate = Math.min(remainingToAllocate, inv.balance_paise)
        if (allocate > 0) {
          await supabase.from('payment_allocations').insert({
            organization_id: orgId,
            payment_id: payment.id,
            invoice_id: inv.id,
            allocated_paise: allocate,
          })
          remainingToAllocate -= allocate
        }
      }
    }

    // Otherwise allocate to oldest unpaid invoices of this resident in this org
    if (remainingToAllocate > 0) {
      const { data: unpaidInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', orgId)
        .eq('resident_id', resident_id)
        .gt('balance_paise', 0)
        .not('status', 'in', '(cancelled,draft)')
        .order('due_date', { ascending: true })

      if (unpaidInvoices && unpaidInvoices.length > 0) {
        for (const inv of unpaidInvoices) {
          if (remainingToAllocate <= 0) break
          const allocate = Math.min(remainingToAllocate, inv.balance_paise)
          if (allocate > 0) {
            await supabase.from('payment_allocations').insert({
              organization_id: orgId,
              payment_id: payment.id,
              invoice_id: inv.id,
              allocated_paise: allocate,
            })
            remainingToAllocate -= allocate
          }
        }
      }
    }

    // 3. Post Credit Entry into Resident's Digital Ledger
    await supabase.from('ledger_entries').insert({
      organization_id: orgId,
      resident_id,
      payment_id: payment.id,
      entry_date: payment_date || new Date().toISOString().split('T')[0],
      description: `Payment Received (${payment_method.toUpperCase()}) ${transaction_id ? `- Ref: ${transaction_id}` : ''}`,
      category: null,
      entry_type: 'payment',
      debit_paise: 0,
      credit_paise: amount_paise,
      payment_method,
      reference_no: transaction_id || reference_no || null,
      added_by: user.id,
      notes: remainingToAllocate > 0 ? `Includes ₹${remainingToAllocate / 100} advance credit balance` : null,
    })

    // 4. Audit Log
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: user.id,
      action: 'payment_add',
      entity_type: 'payment',
      entity_id: payment.id,
      entity_label: `${paymentNumber} - ₹${amount_paise / 100} via ${payment_method}`,
      after_data: { resident_id, amount_paise, payment_method, transaction_id },
    })

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      payment_number: paymentNumber,
      advance_credit_paise: Math.max(0, remainingToAllocate),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment recording failed' }, { status: 500 })
  }
}
