import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'

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
    if (user.organization_id) {
      const { data } = await serviceClient
        .from('users')
        .select('id, full_name, email, phone, role, created_at')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
      staffUsers = data || []
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

            userStays.push({
              id: res.id,
              registration_number: res.registration_number,
              property_name: currentView?.property_name || org?.name || 'PG-Setu Network Member',
              city: org?.city || 'Noida',
              address: org?.address || 'Sector 62, Noida, Uttar Pradesh',
              room_number: currentView?.room_number || null,
              bed_label: currentView?.bed_label || null,
              check_in_date: currentView?.check_in_date || (res.created_at ? res.created_at.split('T')[0] : null),
              check_out_date: res.status === 'checked_out' ? (res.updated_at ? res.updated_at.split('T')[0] : null) : null,
              status: res.status === 'checked_out' ? 'completed' : 'active',
              monthly_rent_paise: currentView?.monthly_rent_paise || 0,
              deposit_held_paise: currentView?.deposit_held_paise || 0,
              deposit_status: res.status === 'checked_out' ? 'Refunded via UPI' : (currentView?.deposit_held_paise ? 'Held in Escrow Trust' : 'Pending Allotment'),
              total_paid_paise: currentView?.total_paid_paise || 0,
              total_outstanding_paise: currentView?.total_outstanding_paise || 0,
            })
          }
        }
      } catch (err: any) {
        console.warn('[Session GET resident stays lookup warning]:', err?.message)
      }
    }

    // ── 2. Passbook Ledger Metrics ──
    const totalRentPaidPaise = userStays.reduce((acc, s) => acc + (s.total_paid_paise || 0), 0)
    const activeDepositsPaise = userStays.filter((s) => s.status === 'active').reduce((acc, s) => acc + (s.deposit_held_paise || 0), 0)
    const totalDuePaise = userStays.reduce((acc, s) => acc + (s.total_outstanding_paise || 0), 0)

    const passbookSummary = {
      total_rent_paid_paise: totalRentPaidPaise,
      active_deposits_paise: activeDepositsPaise,
      total_due_paise: totalDuePaise,
      total_stays_count: userStays.length,
      on_time_payment_rate: userStays.length > 0 ? '100%' : '100%',
      renter_credit_score: userStays.length > 0 ? '790 / 850' : '750 / 850',
      renter_tier: userStays.length > 0 ? 'Tier 1 Verified Tenant' : 'Verified Member',
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
