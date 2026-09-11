import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signPortalToken } from '@/lib/portal-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, date_of_birth } = body

    if (!phone || !date_of_birth) {
      return NextResponse.json(
        { error: 'Please enter both your mobile number and date of birth.' },
        { status: 400 }
      )
    }

    // Clean phone/identifier: take digits or registration ID
    const rawInput = String(phone).trim()
    const digitsOnly = rawInput.replace(/\D/g, '')
    const searchPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly

    if (searchPhone.length < 10 && rawInput.length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number or registration number.' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // 1. Search for resident by phone, alternate phone, or registration number
    let query = supabase
      .from('residents')
      .select('id, organization_id, full_name, registration_number, phone, alternate_phone, date_of_birth, status')

    if (searchPhone.length >= 10) {
      query = query.or(`phone.ilike.%${searchPhone}%,alternate_phone.ilike.%${searchPhone}%,registration_number.ilike.%${rawInput}%`)
    } else {
      query = query.ilike('registration_number', `%${rawInput}%`)
    }

    const { data: residents, error: queryError } = await query

    if (queryError) {
      return NextResponse.json(
        { error: 'Database search error: ' + queryError.message },
        { status: 500 }
      )
    }

    if (!residents || residents.length === 0) {
      return NextResponse.json(
        {
          error:
            'No resident record found with this mobile number or registration ID. Please check the details or contact your PG owner.',
        },
        { status: 404 }
      )
    }

    // 2. Verify date of birth with robust format normalization
    function cleanDate(d: string): string {
      if (!d) return ''
      const trimmed = d.trim().split('T')[0]
      const ymd = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
      if (ymd) {
        return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`
      }
      const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
      if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
      }
      return trimmed
    }

    const inputDob = cleanDate(date_of_birth)

    // Prioritize active stays over checked-out / past stays
    const sortedResidents = [...residents].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (b.status === 'active' && a.status !== 'active') return 1
      return 0
    })

    const matchedResident = sortedResidents.find((r) => {
      if (!r.date_of_birth) {
        return true
      }
      const recordDob = cleanDate(r.date_of_birth)
      return recordDob === inputDob
    })

    if (!matchedResident) {
      return NextResponse.json(
        {
          error:
            'Date of birth does not match our records. Please check the date or contact your PG owner.',
        },
        { status: 401 }
      )
    }

    // 3. Generate secure signed token
    const token = signPortalToken({
      residentId: matchedResident.id,
      orgId: matchedResident.organization_id,
      phone: matchedResident.phone,
    })

    const response = NextResponse.json({
      success: true,
      token,
      resident: {
        id: matchedResident.id,
        full_name: matchedResident.full_name,
        tenant_id: matchedResident.registration_number,
        registration_number: matchedResident.registration_number,
        phone: matchedResident.phone,
        status: matchedResident.status,
      },
    })

    // Set HTTP-Only Cookie
    response.cookies.set('resident_portal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 * 30, // 30 days
    })

    return response
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error during authentication' },
      { status: 500 }
    )
  }
}
