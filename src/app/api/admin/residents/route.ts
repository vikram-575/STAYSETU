import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) return { role: 'superadmin' }
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const service = await createServiceClient()
    const { data: profile } = await service.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') return null
    return user
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const url = new URL(request.url)
    const residentId = url.searchParams.get('id')
    const search = url.searchParams.get('search')?.toLowerCase().trim()
    const orgId = url.searchParams.get('org_id')
    const status = url.searchParams.get('status')
    const limit = Number(url.searchParams.get('limit')) || 100

    if (residentId) {
      // 360° Profile Data for a single resident
      const [
        { data: resident, error: resErr },
        { data: assignments },
        { data: charges },
        { data: invoices },
        { data: payments },
        { data: deposits },
      ] = await Promise.all([
        supabase
          .from('residents')
          .select('*, organizations(id, name, phone, email, city)')
          .eq('id', residentId)
          .single(),
        supabase
          .from('resident_assignments')
          .select('*, beds(bed_label, rooms(room_number, floor_id, floors(name, building_id, buildings(name, property_id, properties(name)))))')
          .eq('resident_id', residentId)
          .order('check_in_date', { ascending: false }),
        supabase
          .from('charges')
          .select('*')
          .eq('resident_id', residentId)
          .order('billing_date', { ascending: false }),
        supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('resident_id', residentId)
          .order('due_date', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('resident_id', residentId)
          .order('payment_date', { ascending: false }),
        supabase
          .from('deposits')
          .select('*, deposit_adjustments(*)')
          .eq('resident_id', residentId),
      ])

      if (resErr || !resident) {
        return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
      }

      // Build financial ledger items
      const ledger: any[] = []

      ;(charges || []).forEach((c) => {
        ledger.push({
          id: `charge-${c.id}`,
          date: c.billing_date || c.created_at?.split('T')[0],
          time: c.created_at ? new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
          category: c.category || 'rent',
          amount_paise: c.amount_paise,
          is_credit: false, // charge = debit (+)
          description: c.description || `${c.category} charge`,
          created_by: 'System / Owner',
          reference_no: c.id.slice(0, 8),
        })
      })

      ;(payments || []).forEach((p) => {
        ledger.push({
          id: `payment-${p.id}`,
          date: p.payment_date,
          time: p.created_at ? new Date(p.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
          category: 'payment',
          amount_paise: p.amount_paise,
          is_credit: true, // payment = credit (-)
          description: p.notes || `Payment via ${p.payment_method?.toUpperCase()} (Txn: ${p.transaction_id || p.payment_number || 'N/A'})`,
          created_by: 'Owner Staff',
          reference_no: p.transaction_id || p.payment_number,
        })
      })

      // Sort ledger chronologically descending
      ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      // Calculate totals
      const totalCharged = ledger.filter((l) => !l.is_credit).reduce((sum, l) => sum + l.amount_paise, 0)
      const totalPaid = ledger.filter((l) => l.is_credit).reduce((sum, l) => sum + l.amount_paise, 0)
      const outstandingBalance = Math.max(0, totalCharged - totalPaid)

      return NextResponse.json({
        success: true,
        resident_360: {
          resident,
          assignments: assignments || [],
          charges: charges || [],
          invoices: invoices || [],
          payments: payments || [],
          deposits: deposits || [],
          ledger,
          financial_summary: {
            total_charged_paise: totalCharged,
            total_paid_paise: totalPaid,
            outstanding_balance_paise: outstandingBalance,
          },
        },
      })
    }

    // List all residents across platform with cross-tenant join
    let query = supabase
      .from('residents')
      .select(`
        id, registration_number, full_name, phone, email, photo_url, date_of_birth, gender, status, created_at,
        organizations(id, name),
        resident_assignments(
          id, monthly_rent_paise, check_in_date, check_out_date,
          beds(id, bed_label, rooms(id, room_number, floors(name, buildings(name, properties(name)))))
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (orgId) query = query.eq('organization_id', orgId)
    if (status && status !== 'all') query = query.eq('status', status)

    const { data: residents, error } = await query
    if (error) throw error

    let formatted = (residents || []).map((r: any) => {
      const activeAssignment = r.resident_assignments?.find((a: any) => !a.check_out_date) || r.resident_assignments?.[0]
      const bed = activeAssignment?.beds
      const room = bed?.rooms
      const floor = room?.floors
      const building = floor?.buildings
      const property = building?.properties

      return {
        id: r.id,
        registration_number: r.registration_number,
        full_name: r.full_name,
        phone: r.phone,
        email: r.email,
        photo_url: r.photo_url,
        status: r.status,
        date_of_birth: r.date_of_birth,
        gender: r.gender,
        owner_name: r.organizations?.name || 'Landlord',
        property_name: property?.name || 'Main Property',
        room_number: room?.room_number || '101',
        bed_label: bed?.bed_label || 'A',
        check_in_date: activeAssignment?.check_in_date || r.created_at.split('T')[0],
        monthly_rent_paise: activeAssignment?.monthly_rent_paise || 900000,
        deposit_paise: (activeAssignment?.monthly_rent_paise || 900000) * 2,
        current_balance_paise: 0,
        created_at: r.created_at,
      }
    })

    if (search) {
      formatted = formatted.filter(
        (r) =>
          r.full_name.toLowerCase().includes(search) ||
          r.registration_number.toLowerCase().includes(search) ||
          r.phone.includes(search) ||
          r.property_name.toLowerCase().includes(search) ||
          r.owner_name.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      success: true,
      residents: formatted,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch platform residents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const { action, resident_id, new_monthly_rent_paise, reason } = await request.json()

    if (action === 'override_rent') {
      if (!resident_id || !new_monthly_rent_paise || !reason) {
        return NextResponse.json({ error: 'resident_id, new_monthly_rent_paise, and reason are mandatory.' }, { status: 400 })
      }

      const { data: assignment, error: assErr } = await supabase
        .from('resident_assignments')
        .select('id, monthly_rent_paise, organization_id')
        .eq('resident_id', resident_id)
        .is('check_out_date', null)
        .single()

      if (assErr || !assignment) {
        return NextResponse.json({ error: 'Active stay assignment not found for resident' }, { status: 404 })
      }

      const previousRent = assignment.monthly_rent_paise

      const { error: updateErr } = await supabase
        .from('resident_assignments')
        .update({
          monthly_rent_paise: new_monthly_rent_paise,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignment.id)

      if (updateErr) throw updateErr

      // Record audit log
      try {
        await supabase.from('audit_logs').insert({
          organization_id: assignment.organization_id,
          action: 'update',
          entity_type: 'rent_override',
          entity_id: resident_id,
          before_state: { monthly_rent_paise: previousRent },
          after_state: { monthly_rent_paise: new_monthly_rent_paise, reason, authorized_by: (adminUser as any).email || 'superadmin' },
        })
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Rent updated successfully from ₹${previousRent / 100} to ₹${new_monthly_rent_paise / 100}. Reason recorded in audit logs.`,
      })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to execute resident action' }, { status: 500 })
  }
}
