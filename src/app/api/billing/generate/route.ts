import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'

/**
 * POST /api/billing/generate
 * Bulk monthly invoice generation for all active residents in an organization.
 * Automatically avoids duplicating invoices for the same billing period.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['owner', 'manager', 'accountant', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Owner or Manager role required.' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const now = new Date()

    // Default period: Current Month (1st to last day of current month)
    const targetYear = Number(body.year) || now.getFullYear()
    const targetMonth = Number(body.month) || (now.getMonth() + 1) // 1-indexed (1 to 12)

    const periodStart = new Date(targetYear, targetMonth - 1, 1).toISOString().split('T')[0]
    const periodEnd = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0]

    // Default due date: 5th of target month
    const dueDay = Math.min(28, Math.max(1, Number(body.due_day) || 5))
    const dueDate = new Date(targetYear, targetMonth - 1, dueDay).toISOString().split('T')[0]

    // 1. Fetch all active residents for this organization
    const { data: activeResidents, error: resError } = await serviceClient
      .from('v_resident_current')
      .select('*')
      .eq('organization_id', orgId)
      .eq('status', 'active')

    if (resError) {
      return NextResponse.json({ error: 'Failed to fetch active residents: ' + resError.message }, { status: 500 })
    }

    if (!activeResidents || activeResidents.length === 0) {
      return NextResponse.json({
        success: true,
        generated_count: 0,
        skipped_count: 0,
        total_billed_paise: 0,
        message: 'No active residents found in organization to bill.',
      })
    }

    // 2. Fetch existing invoices in this period to avoid double billing
    const { data: existingInvoices } = await serviceClient
      .from('invoices')
      .select('resident_id')
      .eq('organization_id', orgId)
      .eq('period_start', periodStart)
      .not('status', 'in', '(cancelled,draft)')

    const alreadyBilledSet = new Set(existingInvoices?.map((i) => i.resident_id) || [])

    let generatedCount = 0
    let skippedCount = 0
    let totalBilledPaise = 0

    for (const resident of activeResidents) {
      // If resident already has invoice for this period, skip
      if (alreadyBilledSet.has(resident.resident_id)) {
        skippedCount++
        continue
      }

      // Rent amount from resident current view or assignment
      const rentPaise = Number(resident.monthly_rent_paise) || 0
      if (rentPaise <= 0) {
        skippedCount++
        continue
      }

      // Generate invoice number
      const { data: invSeq } = await serviceClient.rpc('generate_invoice_number', { p_org_id: orgId })
      const invoiceNumber =
        invSeq || `INV-${targetYear}${String(targetMonth).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

      // 3. Create Invoice
      const { data: newInvoice, error: invCreateErr } = await serviceClient
        .from('invoices')
        .insert({
          organization_id: orgId,
          invoice_number: invoiceNumber,
          resident_id: resident.resident_id,
          period_start: periodStart,
          period_end: periodEnd,
          due_date: dueDate,
          subtotal_paise: rentPaise,
          gst_paise: 0,
          total_paise: rentPaise,
          paid_paise: 0,
          balance_paise: rentPaise,
          status: 'sent',
          notes: `Monthly Rent (${periodStart} to ${periodEnd})`,
          generated_by: user.id,
        })
        .select('id')
        .single()

      if (invCreateErr || !newInvoice) {
        console.error('[Bulk Invoicing Error for resident]:', resident.resident_id, invCreateErr)
        continue
      }

      // 4. Create Invoice Item
      const roomDesc = resident.room_number ? `Room ${resident.room_number}` : 'Bed'
      const bedDesc = resident.bed_label ? `Bed ${resident.bed_label}` : ''
      const itemDesc = `Monthly Bed Rent - ${roomDesc} ${bedDesc}`.trim()

      await serviceClient.from('invoice_items').insert({
        organization_id: orgId,
        invoice_id: newInvoice.id,
        description: itemDesc,
        category: 'rent',
        quantity: 1,
        unit_price_paise: rentPaise,
        total_paise: rentPaise,
        sort_order: 0,
      })

      // 5. Create Ledger Entry
      await serviceClient.from('ledger_entries').insert({
        organization_id: orgId,
        resident_id: resident.resident_id,
        invoice_id: newInvoice.id,
        entry_date: periodStart,
        description: `Monthly Rent Invoice: ${invoiceNumber}`,
        category: 'rent',
        entry_type: 'charge',
        debit_paise: rentPaise,
        credit_paise: 0,
        added_by: user.id,
        notes: `Auto-generated for period ${periodStart} - ${periodEnd}`,
      })

      generatedCount++
      totalBilledPaise += rentPaise
    }

    return NextResponse.json({
      success: true,
      generated_count: generatedCount,
      skipped_count: skippedCount,
      total_billed_paise: totalBilledPaise,
      period: { start: periodStart, end: periodEnd, due_date: dueDate },
      message: `Generated ${generatedCount} invoices successfully (${skippedCount} skipped as already billed or zero rent).`,
    })
  } catch (err: any) {
    console.error('[POST /api/billing/generate Exception]:', err)
    return NextResponse.json({ error: err.message || 'Bulk billing generation failed' }, { status: 500 })
  }
}
