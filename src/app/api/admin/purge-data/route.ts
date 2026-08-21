import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/purge-data
 * Allows super admins or organization owners to purge mock / test transaction and resident data
 * while preserving properties, buildings, floors, rooms, and beds for clean production operations.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || !['owner', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only Organization Owners or Super Admins can purge data.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const targetOrgId = body.organization_id || profile.organization_id
    const wipeAll = body.wipe_all === true // if true, also deletes rooms and buildings

    const serviceClient = await createServiceClient()

    // 1. Delete transactional data in correct dependency order
    await serviceClient.from('ledger_entries').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('payment_allocations').delete().filter('payment_id', 'in', `(select id from payments where organization_id = '${targetOrgId}')`)
    await serviceClient.from('payments').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('invoice_items').delete().filter('invoice_id', 'in', `(select id from invoices where organization_id = '${targetOrgId}')`)
    await serviceClient.from('invoices').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('deposit_adjustments').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('deposits').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('resident_documents').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('complaints').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('message_logs').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('electricity_readings').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('expenses').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('resident_assignments').delete().eq('organization_id', targetOrgId)
    await serviceClient.from('residents').delete().eq('organization_id', targetOrgId)

    // Reset all beds to available
    await serviceClient.from('beds').update({ status: 'available' }).eq('organization_id', targetOrgId)

    if (wipeAll) {
      await serviceClient.from('electricity_meters').delete().eq('organization_id', targetOrgId)
      await serviceClient.from('beds').delete().eq('organization_id', targetOrgId)
      await serviceClient.from('rooms').delete().eq('organization_id', targetOrgId)
      await serviceClient.from('floors').delete().eq('organization_id', targetOrgId)
      await serviceClient.from('buildings').delete().eq('organization_id', targetOrgId)
      await serviceClient.from('properties').delete().eq('organization_id', targetOrgId)
    }

    // Reset sequences
    await serviceClient.from('organization_sequences').update({ last_seq: 0 }).eq('organization_id', targetOrgId)
    await serviceClient.from('invoice_sequences').update({ last_seq: 0 }).eq('organization_id', targetOrgId)
    await serviceClient.from('payment_sequences').update({ last_seq: 0 }).eq('organization_id', targetOrgId)

    return NextResponse.json({
      success: true,
      message: wipeAll
        ? 'All test data, properties, rooms, and transactions successfully purged. Organization is clean.'
        : 'All test residents, invoices, and payment transactions successfully wiped. Rooms and beds are now 100% vacant and ready for live check-ins.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to purge data' }, { status: 500 })
  }
}
