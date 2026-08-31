import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/residents/checkin
 * Creates new resident, assigns bed, creates deposit and initial ledger entries
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

    const {
      full_name, phone, alternate_phone, email, date_of_birth, gender,
      permanent_address, permanent_city, permanent_state,
      emergency_name, emergency_phone, emergency_relation,
      id_type, id_number, notes,
      bed_id, check_in_date, monthly_rent_paise, billing_cycle_day, proration_policy,
      deposit_amount_paise, deposit_payment_method
    } = body

    if (!full_name || !phone || !bed_id || !monthly_rent_paise) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    // Verify bed is available and belongs to this organization
    const { data: bed } = await supabase
      .from('beds')
      .select('id, status, room_id')
      .eq('id', bed_id)
      .eq('organization_id', orgId)
      .single()

    if (!bed || bed.status !== 'available') {
      return NextResponse.json({ error: 'Selected bed is not available' }, { status: 400 })
    }

    // Generate Registration Number via PostgreSQL RPC
    const { data: regNumber } = await supabase.rpc('generate_registration_number', {
      p_org_id: orgId,
    })

    const registrationNumber = regNumber || `PG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

    // 1. Create Resident
    const { data: resident, error: residentError } = await supabase
      .from('residents')
      .insert({
        organization_id: orgId,
        registration_number: registrationNumber,
        full_name,
        phone,
        alternate_phone: alternate_phone || null,
        email: email || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        permanent_address: permanent_address || null,
        permanent_city: permanent_city || null,
        permanent_state: permanent_state || null,
        emergency_name: emergency_name || null,
        emergency_phone: emergency_phone || null,
        emergency_relation: emergency_relation || null,
        id_type: id_type || null,
        id_number: id_number || null,
        status: 'active',
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (residentError || !resident) {
      return NextResponse.json({ error: residentError?.message || 'Failed to create resident record' }, { status: 500 })
    }

    // 2. Create Assignment
    const { data: assignment, error: assignError } = await supabase
      .from('resident_assignments')
      .insert({
        organization_id: orgId,
        resident_id: resident.id,
        bed_id,
        check_in_date: check_in_date || new Date().toISOString().split('T')[0],
        monthly_rent_paise,
        billing_cycle_day: billing_cycle_day || 1,
        proration_policy: proration_policy || 'daily',
        authorized_by: user.id,
      })
      .select()
      .single()

    if (assignError || !assignment) {
      return NextResponse.json({ error: assignError?.message || 'Failed to assign bed' }, { status: 500 })
    }

    // Update bed status to occupied
    await supabase
      .from('beds')
      .update({ status: 'occupied' })
      .eq('id', bed_id)
      .eq('organization_id', orgId)

    // 3. Create Security Deposit if specified
    if (deposit_amount_paise && deposit_amount_paise > 0) {
      await supabase
        .from('deposits')
        .insert({
          organization_id: orgId,
          resident_id: resident.id,
          assignment_id: assignment.id,
          amount_paise: deposit_amount_paise,
          received_date: check_in_date || new Date().toISOString().split('T')[0],
          payment_method: deposit_payment_method || 'cash',
          notes: 'Initial check-in security deposit',
          created_by: user.id,
        })

      // Add to ledger
      await supabase.from('ledger_entries').insert({
        organization_id: orgId,
        resident_id: resident.id,
        entry_date: check_in_date || new Date().toISOString().split('T')[0],
        description: `Security Deposit Received (${deposit_payment_method?.toUpperCase() || 'CASH'})`,
        category: 'security_deposit',
        entry_type: 'deposit',
        debit_paise: 0,
        credit_paise: deposit_amount_paise,
        payment_method: deposit_payment_method || 'cash',
        added_by: user.id,
      })
    }

    // 4. Audit Log
    await supabase.from('audit_logs').insert({
      organization_id: orgId,
      user_id: user.id,
      action: 'checkin',
      entity_type: 'resident',
      entity_id: resident.id,
      entity_label: `${full_name} (${registrationNumber})`,
      after_data: { full_name, phone, bed_id, monthly_rent_paise },
    })

    return NextResponse.json({
      success: true,
      resident_id: resident.id,
      registration_number: registrationNumber,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Check-in failed' }, { status: 500 })
  }
}
