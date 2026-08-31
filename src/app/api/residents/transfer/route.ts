import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/residents/transfer
 * Archives current bed assignment and creates new bed assignment without deleting history
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

    if (!profile || !['owner', 'manager', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orgId = profile.organization_id
    if (!orgId) return NextResponse.json({ error: 'No active organization found' }, { status: 400 })

    const body = await request.json()
    const { resident_id, new_bed_id, transfer_date, new_rent_paise, reason, notes } = body

    if (!resident_id || !new_bed_id || !transfer_date || !new_rent_paise) {
      return NextResponse.json({ error: 'Missing required transfer fields' }, { status: 400 })
    }

    // 1. Verify new bed belongs to organization and is available
    const { data: newBed } = await supabase
      .from('beds')
      .select('id, status')
      .eq('id', new_bed_id)
      .eq('organization_id', orgId)
      .single()

    if (!newBed || newBed.status !== 'available') {
      return NextResponse.json({ error: 'Selected bed is not available' }, { status: 400 })
    }

    // 2. Get current active assignment for this organization
    const { data: currentAssignment } = await supabase
      .from('resident_assignments')
      .select('*')
      .eq('organization_id', orgId)
      .eq('resident_id', resident_id)
      .is('check_out_date', null)
      .single()

    if (currentAssignment) {
      // Close current assignment
      await supabase
        .from('resident_assignments')
        .update({ check_out_date: transfer_date, updated_at: new Date().toISOString() })
        .eq('id', currentAssignment.id)
        .eq('organization_id', orgId)

      // Mark previous bed available
      await supabase
        .from('beds')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', currentAssignment.bed_id)
        .eq('organization_id', orgId)
    }

    // 3. Create new assignment
    const { data: newAssignment, error: assignError } = await supabase
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
        authorized_by: user.id,
      })
      .select()
      .single()

    if (assignError || !newAssignment) {
      return NextResponse.json({ error: assignError?.message || 'Failed to create new assignment' }, { status: 500 })
    }

    // 4. Mark new bed occupied
    await supabase
      .from('beds')
      .update({ status: 'occupied', updated_at: new Date().toISOString() })
      .eq('id', new_bed_id)
      .eq('organization_id', orgId)

    // 5. Audit Log
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: user.id,
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
