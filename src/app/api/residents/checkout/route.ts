import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'

/**
 * POST /api/residents/checkout
 * Closes active bed assignment, marks bed available, processes deposit deductions/refunds, updates resident status
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'staff', 'accountant', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const {
      resident_id, exit_date, damage_charges_paise, damage_reason,
      other_charges_paise, deposit_deduction_paise, refund_amount_paise, notes
    } = body

    if (!resident_id || !exit_date) {
      return NextResponse.json({ error: 'Resident ID and exit date are required' }, { status: 400 })
    }

    // Resolve valid user ID for audit and ledger
    let validUserId: string | null = null
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)
    if (isUuid) {
      const { data: dbU } = await serviceClient.from('users').select('id').eq('id', user.id).maybeSingle()
      if (dbU) validUserId = dbU.id
    }
    if (!validUserId && user.email) {
      const { data: dbU } = await serviceClient.from('users').select('id').ilike('email', user.email).maybeSingle()
      if (dbU) validUserId = dbU.id
    }

    // 1. Get active assignment scoped to organization
    const { data: assignment } = await serviceClient
      .from('resident_assignments')
      .select('*, beds(id, bed_label)')
      .eq('organization_id', orgId)
      .eq('resident_id', resident_id)
      .is('check_out_date', null)
      .single()

    if (assignment) {
      // Close assignment
      await serviceClient
        .from('resident_assignments')
        .update({ check_out_date: exit_date, updated_at: new Date().toISOString() })
        .eq('id', assignment.id)
        .eq('organization_id', orgId)

      // Mark bed available
      await serviceClient
        .from('beds')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', assignment.bed_id)
        .eq('organization_id', orgId)
    }

    // 2. Add damage charge to ledger if applicable
    if (damage_charges_paise && damage_charges_paise > 0) {
      await serviceClient.from('ledger_entries').insert({
        organization_id: orgId,
        resident_id,
        entry_date: exit_date,
        description: `Damage / Repair Charge: ${damage_reason || 'Checkout Settlement'}`,
        category: 'damage',
        entry_type: 'charge',
        debit_paise: damage_charges_paise,
        credit_paise: 0,
        added_by: validUserId,
        notes,
      })
    }

    // 3. Add other charges to ledger if applicable
    if (other_charges_paise && other_charges_paise > 0) {
      await serviceClient.from('ledger_entries').insert({
        organization_id: orgId,
        resident_id,
        entry_date: exit_date,
        description: 'Checkout Settlement Additional Charges',
        category: 'other',
        entry_type: 'charge',
        debit_paise: other_charges_paise,
        credit_paise: 0,
        added_by: validUserId,
      })
    }

    // 4. Record Deposit Adjustment or Refund
    if (deposit_deduction_paise && deposit_deduction_paise > 0) {
      await serviceClient.from('ledger_entries').insert({
        organization_id: orgId,
        resident_id,
        entry_date: exit_date,
        description: 'Deposit Adjusted Against Outstanding Dues',
        category: 'security_deposit',
        entry_type: 'adjustment',
        debit_paise: 0,
        credit_paise: deposit_deduction_paise,
        added_by: validUserId,
      })
    }

    if (refund_amount_paise && refund_amount_paise > 0) {
      await serviceClient.from('ledger_entries').insert({
        organization_id: orgId,
        resident_id,
        entry_date: exit_date,
        description: 'Security Deposit Refund Paid to Resident',
        category: 'security_deposit',
        entry_type: 'refund',
        debit_paise: 0,
        credit_paise: 0, // Refund settlement entry
        added_by: validUserId,
        notes: 'Final deposit refund at checkout',
      })
    }

    // Mark all deposits for resident as refunded in this organization
    await serviceClient
      .from('deposits')
      .update({ is_refunded: true, refunded_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('resident_id', resident_id)

    // 5. Update resident status to checked_out
    await serviceClient
      .from('residents')
      .update({ status: 'checked_out', updated_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('id', resident_id)

    // 6. Audit Log
    try {
      await serviceClient.from('audit_logs').insert({
        organization_id: orgId,
        user_id: validUserId,
        action: 'checkout',
        entity_type: 'resident',
        entity_id: resident_id,
        entity_label: `Checkout on ${exit_date}`,
        after_data: { exit_date, damage_charges_paise, refund_amount_paise },
      })
    } catch {}

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Checkout failed' }, { status: 500 })
  }
}
