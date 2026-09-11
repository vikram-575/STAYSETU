import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPortalSession, verifyPortalToken } from '@/lib/portal-auth'
import { getAuthenticatedUser } from '@/lib/auth-session'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate via cookie, header, token query param, or staff session
    let session = await getPortalSession()
    let tokenFromParam = request.nextUrl.searchParams.get('token')

    if (!session && tokenFromParam) {
      session = verifyPortalToken(tokenFromParam)
    }

    if (!session) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const hToken = authHeader.substring(7)
        session = verifyPortalToken(hToken)
        if (session && !tokenFromParam) tokenFromParam = hToken
      }
    }

    // Allow logged-in PG owner/staff to view resident passbook
    if (!session) {
      const authUser = await getAuthenticatedUser()
      if (authUser) {
        const residentParam = request.nextUrl.searchParams.get('resident_id') || request.nextUrl.searchParams.get('id')
        if (residentParam) {
          session = {
            residentId: residentParam,
            orgId: authUser.organization_id || '',
            phone: '',
            exp: Math.floor(Date.now() / 1000) + 86400,
          }
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Session expired or unauthenticated. Please log in.' }, { status: 401 })
    }

    const { residentId, orgId } = session
    const supabase = await createServiceClient()

    // 2. Fetch Resident Current Status & Stay Info
    let { data: resident } = await supabase
      .from('v_resident_current')
      .select('*')
      .eq('resident_id', residentId)
      .maybeSingle()

    if (!resident) {
      const { data: rawRes } = await supabase
        .from('residents')
        .select('*')
        .eq('id', residentId)
        .single()

      if (!rawRes) {
        // If resident is not in PostgreSQL 'residents' table, check if this is a self-registered tenant or new user
        const { getDocument, queryCollection } = await import('@/lib/firebase/firestore')
        let tenantProfile: any = null
        try {
          tenantProfile = await getDocument('tenant_profiles', residentId)
          if (!tenantProfile && session.phone) {
            const profiles = await queryCollection('tenant_profiles', [['mobile', '==', session.phone]])
            tenantProfile = profiles[0] || null
          }
        } catch {}

        const profileName = tenantProfile?.full_name || 'New Resident'
        const profilePhone = tenantProfile?.mobile || session.phone || ''

        const newUserData = {
          success: true,
          is_new_user: true,
          resident: {
            id: residentId,
            full_name: profileName,
            registration_number: residentId,
            phone: profilePhone,
            email: tenantProfile?.email || null,
            photo_url: null,
            status: 'new_user',
            check_in_date: null,
            monthly_rent_paise: 0,
            billing_cycle_day: 1,
            room_number: null,
            room_name: null,
            bed_label: null,
            floor_name: null,
            building_name: null,
            property_name: 'Pending PG Check-In',
            property_address: 'Not currently checked into an active PG property',
            total_outstanding_paise: 0,
            total_paid_paise: 0,
            deposit_held_paise: 0,
          },
          pg_info: {
            name: 'PG-Setu Resident Network',
            manager_phone: '',
            manager_whatsapp_link: '',
            upi_id: '',
            upi_pay_link: '',
            address: 'India',
            city: tenantProfile?.current_city || 'India',
            is_new_user: true,
          },
          invoices: [],
          payments: [],
          ledger: [],
          electricity_readings: [],
        }

        const res = NextResponse.json(newUserData)
        if (tokenFromParam) {
          res.cookies.set('resident_portal_token', tokenFromParam, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400 * 30,
            path: '/',
          })
        }
        return res
      }

      resident = {
        resident_id: rawRes.id,
        full_name: rawRes.full_name,
        phone: rawRes.phone,
        registration_number: rawRes.registration_number,
        status: rawRes.status,
        total_outstanding_paise: 0,
        total_paid_paise: 0,
        deposit_held_paise: 0,
        room_number: null,
        bed_label: null,
        building_name: null,
        floor_name: null,
      }
    }

    const effectiveOrgId = orgId || resident.organization_id

    // 3. Fetch Organization & Property Info
    const { data: org } = await supabase
      .from('organizations')
      .select('name, phone, email, address, city, state, pincode, settings')
      .eq('id', effectiveOrgId)
      .maybeSingle()

    const { data: prop } = resident.property_id
      ? await supabase.from('properties').select('*').eq('id', resident.property_id).maybeSingle()
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
    let { data: ledger } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('resident_id', residentId)
      .order('entry_date', { ascending: false })
      .order('entry_time', { ascending: false })

    // If no ledger entries exist yet, auto-provision initial rent & deposit charges
    if (!ledger || ledger.length === 0) {
      if (resident.monthly_rent_paise && resident.monthly_rent_paise > 0) {
        const checkIn = resident.check_in_date || new Date().toISOString().split('T')[0]
        const depositAmount = resident.deposit_held_paise || (resident.monthly_rent_paise * 2)

        const defaultEntries = [
          {
            organization_id: effectiveOrgId,
            resident_id: residentId,
            entry_date: checkIn,
            description: 'Security Deposit Held (Bank / UPI)',
            category: 'security_deposit',
            entry_type: 'deposit',
            debit_paise: 0,
            credit_paise: depositAmount,
            running_balance_paise: 0,
            payment_method: 'upi',
          },
          {
            organization_id: effectiveOrgId,
            resident_id: residentId,
            entry_date: checkIn,
            description: `Monthly Bed Rent (${checkIn})`,
            category: 'rent',
            entry_type: 'charge',
            debit_paise: resident.monthly_rent_paise,
            credit_paise: 0,
            running_balance_paise: resident.monthly_rent_paise,
          },
        ]

        await supabase.from('ledger_entries').insert(defaultEntries)

        const { data: freshLedger } = await supabase
          .from('ledger_entries')
          .select('*')
          .eq('resident_id', residentId)
          .order('entry_date', { ascending: false })

        ledger = freshLedger || []
      }
    }

    // Normalize ledger entries with explicit amount_paise and balance_after_paise
    const formattedLedger = (ledger || []).map((entry: any) => {
      const isDebit = entry.debit_paise > 0 || entry.entry_type === 'charge' || entry.entry_type === 'debit'
      const amount = entry.debit_paise > 0 ? entry.debit_paise : (entry.credit_paise > 0 ? entry.credit_paise : entry.amount_paise || 0)
      const balance = entry.running_balance_paise !== undefined ? entry.running_balance_paise : (entry.balance_after_paise || 0)
      return {
        ...entry,
        is_debit: isDebit,
        amount_paise: amount,
        debit_paise: isDebit ? amount : 0,
        credit_paise: !isDebit ? amount : 0,
        running_balance_paise: balance,
        balance_after_paise: balance,
      }
    })

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
    const upiId = orgSettings.upi_id || orgSettings.bank_settlement?.upi_id || (org as any)?.upi_id || 'pgsetu@upi'
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

    const response = NextResponse.json({
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
      ledger: formattedLedger,
      electricity_readings: electricityReadings,
    })

    if (tokenFromParam) {
      response.cookies.set('resident_portal_token', tokenFromParam, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 * 30,
        path: '/',
      })
    }

    return response
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve portal data' },
      { status: 500 }
    )
  }
}
