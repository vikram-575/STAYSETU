import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

/**
 * POST /api/residents/transfer
 * Archives current bed assignment and creates new bed assignment without deleting history
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!['owner', 'manager', 'staff', 'superadmin', 'accountant'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = await createServiceClient()
    let orgId = user.organization_id

    const body = await request.json()
    const { resident_id, new_bed_id, transfer_date, new_rent_paise, reason, notes } = body

    if (!resident_id || !new_bed_id || !transfer_date || !new_rent_paise) {
      return NextResponse.json({ error: 'Missing required transfer fields' }, { status: 400 })
    }

    // 1. Verify new bed belongs to organization and is available
    const { data: newBed } = await serviceClient
      .from('beds')
      .select('id, status, organization_id')
      .eq('id', new_bed_id)
      .single()

    if (!newBed || newBed.status !== 'available') {
      return NextResponse.json({ error: 'Selected bed is not available' }, { status: 400 })
    }

    if (!orgId) {
      orgId = newBed.organization_id
    }

    // Resolve valid user ID for foreign keys
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

    // 2. Get current active assignment for this organization
    const { data: currentAssignment } = await serviceClient
      .from('resident_assignments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('resident_id', resident_id)
      .is('check_out_date', null)
      .single()

    if (currentAssignment) {
      // Close current assignment
      await serviceClient
        .from('resident_assignments')
        .update({ check_out_date: transfer_date, updated_at: new Date().toISOString() })
        .eq('id', currentAssignment.id)
        .eq('organization_id', orgId)

      // Mark previous bed available
      await serviceClient
        .from('beds')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', currentAssignment.bed_id)
        .eq('organization_id', orgId)
    }

    // 3. Create new assignment
    const { data: newAssignment, error: assignError } = await serviceClient
      .from('resident_assignments')
      .insert({
        organization_id: orgId,
        resident_id,
        bed_id: new_bed_id,
        check_in_date: transfer_date,
        monthly_rent_paise: new_rent_paise,
        transfer_from_assignment_id: currentAssignment ? currentAssignment.id : null,
        transfer_reason: reason || 'other',
        transfer_notes: notes || null,
        authorized_by: validUserId,
      })
      .select()
      .single()

    if (assignError || !newAssignment) {
      return NextResponse.json({ error: assignError?.message || 'Failed to create new assignment' }, { status: 500 })
    }

    // 4. Mark new bed occupied
    await serviceClient
      .from('beds')
      .update({ status: 'occupied', updated_at: new Date().toISOString() })
      .eq('id', new_bed_id)
      .eq('organization_id', orgId)

    // 5. Audit Log
    await serviceClient.from('audit_logs').insert({
      organization_id: orgId,
      user_id: validUserId,
      action: 'transfer',
      entity_type: 'resident_assignment',
      entity_id: newAssignment.id,
      entity_label: `Bed transfer on ${transfer_date}`,
      before_data: { bed_id: currentAssignment?.bed_id, rent: currentAssignment?.monthly_rent_paise },
      after_data: { bed_id: new_bed_id, rent: new_rent_paise, reason },
    })

    return NextResponse.json({ success: true, assignment_id: newAssignment.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Transfer failed' }, { status: 500 })
  }
}
