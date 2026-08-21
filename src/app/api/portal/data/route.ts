import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPortalSession, verifyPortalToken } from '@/lib/portal-auth'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate via cookie or header
    let session = await getPortalSession()

    if (!session) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        session = verifyPortalToken(authHeader.substring(7))
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Session expired or unauthenticated. Please log in.' }, { status: 401 })
    }

    const { residentId, orgId } = session
    const supabase = await createServiceClient()

    // 2. Fetch Resident Current Status & Stay Info
    const { data: resident, error: resError } = await supabase
      .from('v_resident_current')
      .select('*')
      .eq('resident_id', residentId)
      .single()

    if (resError || !resident) {
      return NextResponse.json({ error: 'Resident record not found.' }, { status: 404 })
    }

    // 3. Fetch Organization & Property Info
    const { data: org } = await supabase
      .from('organizations')
      .select('name, phone, email, address, city, state, pincode, settings')
      .eq('id', orgId)
      .single()

    const { data: prop } = resident.property_id
      ? await supabase.from('properties').select('*').eq('id', resident.property_id).single()
      : { data: null }

    // 4. Fetch Invoices with Items
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('resident_id', residentId)
      .order('due_date', { ascending: false })

    // 5. Fetch Payment Collections
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('resident_id', residentId)
      .order('payment_date', { ascending: false })

    // 6. Fetch Complete Digital Passbook (Ledger Entries)
    const { data: ledger } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('resident_id', residentId)
      .order('entry_date', { ascending: false })

    // 7. Fetch Sub-Meter Electricity Readings (if assigned to a room)
    let electricityReadings: any[] = []
    if (resident.room_id) {
      const { data: meters } = await supabase
        .from('electricity_meters')
        .select('id, meter_number, allocation_method')
        .eq('room_id', resident.room_id)

      if (meters && meters.length > 0) {
        const meterIds = meters.map((m) => m.id)
        const { data: readings } = await supabase
          .from('electricity_readings')
          .select('*')
          .in('meter_id', meterIds)
          .order('reading_date', { ascending: false })
          .limit(10)

        electricityReadings = readings || []
      }
    }

    // 8. Calculate UPI Payment String & Manager Contacts
    const orgSettings = org?.settings || {}
    const managerPhone = prop?.phone || org?.phone || ''
    const upiId = orgSettings.upi_id || 'pgsetu@upi'
    const pgName = prop?.name || org?.name || 'PG-SETU Accommodation'
    const totalDueRupees = Math.max(0, (resident.total_outstanding_paise || 0) / 100)

    // Deep link for instant UPI payment on Android / iOS
    const upiLink = totalDueRupees > 0
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(pgName)}&am=${totalDueRupees.toFixed(2)}&tn=${encodeURIComponent('Rent ' + resident.full_name + ' ' + resident.registration_number)}&cu=INR`
      : ''

    const managerDigits = managerPhone.replace(/\D/g, '')
    const whatsappManagerLink = managerDigits
      ? `https://wa.me/91${managerDigits.slice(-10)}?text=${encodeURIComponent(
          `Hi Manager, I am ${resident.full_name} (Room ${resident.room_number || '—'}, Bed ${resident.bed_label || '—'}). `
        )}`
      : ''

    return NextResponse.json({
      success: true,
      resident: {
        id: resident.resident_id,
        full_name: resident.full_name,
        registration_number: resident.registration_number,
        phone: resident.phone,
        email: resident.email,
        photo_url: resident.photo_url,
        status: resident.status,
        check_in_date: resident.check_in_date,
        monthly_rent_paise: resident.monthly_rent_paise || 0,
        billing_cycle_day: resident.billing_cycle_day || 1,
        // Location
        room_number: resident.room_number,
        room_name: resident.room_name,
        bed_label: resident.bed_label,
        floor_name: resident.floor_name,
        building_name: resident.building_name,
        property_name: pgName,
        property_address: prop?.address || org?.address || '',
        // Financials
        total_outstanding_paise: resident.total_outstanding_paise || 0,
        total_paid_paise: resident.total_paid_paise || 0,
        deposit_held_paise: resident.deposit_held_paise || 0,
      },
      pg_info: {
        name: pgName,
        manager_phone: managerPhone,
        manager_whatsapp_link: whatsappManagerLink,
        upi_id: upiId,
        upi_pay_link: upiLink,
        address: prop?.address || org?.address || '',
        city: prop?.city || org?.city || '',
      },
      invoices: invoices || [],
      payments: payments || [],
      ledger: ledger || [],
      electricity_readings: electricityReadings,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve portal data' },
      { status: 500 }
    )
  }
}
