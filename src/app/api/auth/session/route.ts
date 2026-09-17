import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateTrustScore } from '@/lib/trust-score'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      )
    }

    const serviceClient = await createServiceClient()
    const cookieStore = await cookies()
    const authMobile = cookieStore.get('auth_mobile')?.value || user.phone || ''
    const cleanMobile = authMobile.replace(/\D/g, '').slice(-10)

    let staffUsers: any[] = []
    let hostedProperties: any[] = []
    let propertyStats = {
      total_residents: 0,
      total_rooms: 0,
      total_beds: 0,
      available_beds: 0,
      expected_revenue_paise: 0,
    }

    if (user.organization_id) {
      const { data } = await serviceClient
        .from('users')
        .select('id, full_name, email, phone, role, created_at')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
      staffUsers = data || []

      // If user has host/owner privileges, query hosted properties & capacity stats
      const isOwnerOrStaff = ['superadmin', 'owner', 'manager', 'accountant', 'staff'].includes(user.role)
      if (isOwnerOrStaff) {
        try {
          const orgId = user.organization_id
          const [propsRes, residentsCountRes, roomsRes, bedsRes, invoicesRes] = await Promise.allSettled([
            serviceClient
              .from('properties')
              .select('*')
              .eq('organization_id', orgId)
              .order('created_at', { ascending: false }),
            serviceClient
              .from('residents')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', orgId)
              .eq('status', 'active'),
            serviceClient
              .from('rooms')
              .select('id, base_rent_paise, capacity')
              .eq('organization_id', orgId),
            serviceClient
              .from('beds')
              .select('id, status')
              .eq('organization_id', orgId),
            serviceClient
              .from('invoices')
              .select('total_paise')
              .eq('organization_id', orgId)
              .not('status', 'in', '(cancelled,draft)'),
          ])

          const props = propsRes.status === 'fulfilled' ? (propsRes.value.data || []) : []
          const activeResidents = residentsCountRes.status === 'fulfilled' ? (residentsCountRes.value.count || 0) : 0
          const rooms = roomsRes.status === 'fulfilled' ? (roomsRes.value.data || []) : []
          const beds = bedsRes.status === 'fulfilled' ? (bedsRes.value.data || []) : []
          const invoices = invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data || []) : []

          const totalBeds = beds.length > 0 ? beds.length : rooms.reduce((sum: number, r: any) => sum + (r.capacity || 0), 0)
          const availableBeds = beds.length > 0 ? beds.filter((b: any) => b.status === 'available').length : Math.max(0, totalBeds - activeResidents)
          const expectedRev = invoices.reduce((sum: number, inv: any) => sum + (inv.total_paise || 0), 0) || rooms.reduce((sum: number, r: any) => sum + (r.base_rent_paise || 0), 0)

          propertyStats = {
            total_residents: activeResidents,
            total_rooms: rooms.length,
            total_beds: totalBeds,
            available_beds: availableBeds,
            expected_revenue_paise: expectedRev,
          }

          const org = (user.organizations as any) || {}
          if (props && props.length > 0) {
            hostedProperties = props.map((p: any) => ({
              id: p.id,
              organization_id: p.organization_id,
              name: p.name || org.name || 'PG Property',
              phone: p.phone || org.phone || user.phone || '',
              email: p.email || org.email || user.email || '',
              address: p.address || org.address || '',
              city: p.city || org.city || '',
              state: p.state || org.state || '',
              pincode: p.pincode || org.pincode || '',
              description: p.description || '',
              settings: p.settings || org.settings || {},
              stats: propertyStats,
            }))
          } else {
            hostedProperties = []
          }
        } catch (err: any) {
          console.warn('[Session Route Hosted Properties Lookup Error]:', err?.message)
        }
      }
    }

    // ── 1. Fetch stays / PG history for this user ──
    let userStays: any[] = []
    if (cleanMobile.length >= 10) {
      try {
        const { data: dbResidents } = await serviceClient
          .from('residents')
          .select(`
            id, organization_id, registration_number, full_name, phone, email,
            status, created_at, updated_at,
            organizations ( id, name, slug, address, city, phone )
          `)
          .or(`phone.ilike.%${cleanMobile}%,alternate_phone.ilike.%${cleanMobile}%`)
          .order('created_at', { ascending: false })

        if (dbResidents && dbResidents.length > 0) {
          for (const res of dbResidents) {
            const { data: currentView } = await serviceClient
              .from('v_resident_current')
              .select('*')
              .eq('resident_id', res.id)
              .maybeSingle()

            const org: any = res.organizations

            // CRITICAL CHECK: An actual stay exists ONLY if resident has an allotted room or is checked out.
            // If room_number is null and status is not checked_out, this is an unallotted profile, not an active stay.
            const hasRoomAllotment = Boolean(currentView?.room_number)
            const isCompletedStay = res.status === 'checked_out'

            if (!hasRoomAllotment && !isCompletedStay) {
              // Unallotted tenant - skip adding as an active stay
              continue
            }

            userStays.push({
              id: res.id,
              registration_number: res.registration_number,
              property_name: currentView?.property_name || org?.name || 'PG Property',
              city: org?.city || '',
              address: org?.address || '',
              room_number: currentView?.room_number || null,
              bed_label: currentView?.bed_label || null,
              check_in_date: currentView?.check_in_date || (res.created_at ? res.created_at.split('T')[0] : null),
              check_out_date: res.status === 'checked_out' ? (res.updated_at ? res.updated_at.split('T')[0] : null) : null,
              status: res.status === 'checked_out' ? 'completed' : 'active',
              monthly_rent_paise: currentView?.monthly_rent_paise || 0,
              deposit_held_paise: currentView?.deposit_held_paise || 0,
              deposit_status: res.status === 'checked_out' ? 'Refunded via UPI' : (currentView?.deposit_held_paise ? 'Held in Escrow Trust' : 'Allotted'),
              total_paid_paise: currentView?.total_paid_paise || 0,
              total_outstanding_paise: currentView?.total_outstanding_paise || 0,
            })
          }
        }
      } catch (err: any) {
        console.warn('[Session GET resident stays lookup warning]:', err?.message)
      }
    }

    // ── 2. Passbook Ledger Metrics & Dynamic 0-100 Trust Score ──
    const trustScore = calculateTrustScore(userStays)

    const totalRentPaidPaise = userStays.reduce((acc, s) => acc + (s.total_paid_paise || 0), 0)
    const activeDepositsPaise = userStays.filter((s) => s.status === 'active').reduce((acc, s) => acc + (s.deposit_held_paise || 0), 0)
    const totalDuePaise = userStays.reduce((acc, s) => acc + (s.total_outstanding_paise || 0), 0)

    const passbookSummary = {
      total_rent_paid_paise: totalRentPaidPaise,
      active_deposits_paise: activeDepositsPaise,
      total_due_paise: totalDuePaise,
      total_stays_count: userStays.length,
      on_time_payment_rate: trustScore.onTimePaymentRate,
      renter_credit_score: trustScore.scoreFormatted,
      renter_tier: trustScore.tier,
    }

    // ── 3. Recent Transactions Ledger (Queried from Supabase) ──
    let transactions: any[] = []
    const residentIds = userStays.map((s) => s.id)
    if (residentIds.length > 0) {
      try {
        const { data: dbPayments } = await serviceClient
          .from('payments')
          .select('id, amount_paise, payment_mode, payment_date, status, transaction_reference, notes, resident_id')
          .in('resident_id', residentIds)
          .order('payment_date', { ascending: false })
          .limit(20)

        if (dbPayments && dbPayments.length > 0) {
          transactions = dbPayments.map((p) => ({
            id: p.id,
            date: p.payment_date ? p.payment_date.split('T')[0] : 'Recent',
            description: p.notes || 'Rent / Stay Payment',
            amount_paise: p.amount_paise || 0,
            payment_mode: p.payment_mode || 'UPI / Bank',
            status: p.status === 'success' || p.status === 'completed' ? 'Paid & Verified' : p.status || 'Verified',
            receipt_id: p.transaction_reference || `RCP-${p.id.slice(0, 8).toUpperCase()}`,
            property: userStays.find((s) => s.id === p.resident_id)?.property_name || 'PG-Setu Co-Living',
          }))
        }
      } catch (err: any) {
        console.warn('[Session Route Payments lookup warning]:', err?.message)
      }
    }

    // ── 4. Resolve Profile Metadata from Supabase residents table ──
    let profileData: any = null
    try {
      let residentRow: any = null

      if (user.resident_id) {
        const { data } = await serviceClient
          .from('residents')
          .select('*')
          .eq('id', user.resident_id)
          .maybeSingle()
        residentRow = data
      }

      if (!residentRow && cleanMobile.length >= 10) {
        const { data } = await serviceClient
          .from('residents')
          .select('*')
          .or(`phone.ilike.%${cleanMobile}%,alternate_phone.ilike.%${cleanMobile}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        residentRow = data
      }

      if (residentRow) {
        let notesObj: Record<string, any> = {}
        if (residentRow.notes) {
          try {
            notesObj = JSON.parse(residentRow.notes)
          } catch {}
        }

        profileData = {
          id: residentRow.registration_number || `TN-${cleanMobile.slice(-4) || '2026'}`,
          full_name: residentRow.full_name || user.full_name,
          email: residentRow.email || user.email,
          mobile: residentRow.phone || cleanMobile,
          gender: residentRow.gender || 'male',
          age: notesObj.age || null,
          profession: notesObj.profession || '',
          college_or_company: notesObj.college_or_company || '',
          emergency_name: residentRow.emergency_name || '',
          emergency_phone: residentRow.emergency_phone || '',
          emergency_relation: residentRow.emergency_relation || '',
          permanent_address: residentRow.permanent_address || '',
          permanent_city: residentRow.permanent_city || '',
          aadhaar_verified: notesObj.aadhaar_verified ?? Boolean(residentRow.id_number),
          aadhaar_last4: notesObj.aadhaar_last4 || residentRow.id_number || '',
          aadhaar_verified_date: notesObj.aadhaar_verified_date || '',
        }
      } else {
        // Synthesize fallback profile for user from users table
        profileData = {
          id: (user as any).registration_number || `TN-${cleanMobile.slice(-4) || '2026'}`,
          full_name: user.full_name || 'PG-Setu Member',
          email: user.email,
          mobile: cleanMobile,
          gender: (user as any).gender || 'male',
          age: (user as any).age || null,
          profession: (user as any).profession || '',
          college_or_company: '',
          emergency_name: '',
          emergency_phone: '',
          emergency_relation: '',
          permanent_address: '',
          permanent_city: '',
          aadhaar_verified: false,
          aadhaar_last4: '',
          aadhaar_verified_date: '',
        }
      }
    } catch (err: any) {
      console.warn('[Session Route Profile Resolution Warning]:', err?.message)
    }

    return NextResponse.json(
      {
        user,
        organization: user.organizations,
        staffUsers,
        hostedProperties,
        propertyStats,
        stays: userStays,
        passbookSummary,
        transactions,
        profile: profileData,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, userId, email, role } = await request.json()
    const cookieStore = await cookies()

    if (token) {
      cookieStore.set('firebase_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    }

    if (userId) {
      cookieStore.set('firebase_user_id', userId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to set session' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('firebase_token')
  cookieStore.delete('firebase_user_id')
  return NextResponse.json({ success: true })
}
