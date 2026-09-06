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

    // Clean phone number: take digits only (last 10 digits for Indian standard numbers)
    const digitsOnly = String(phone).replace(/\D/g, '')
    const searchPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly

    if (searchPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // 1. First, search for the resident by phone number
    const { data: residents, error: queryError } = await supabase
      .from('residents')
      .select('id, organization_id, full_name, registration_number, phone, alternate_phone, date_of_birth, status')
      .or(`phone.ilike.%${searchPhone}%,alternate_phone.ilike.%${searchPhone}%`)

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
            'No resident record found with this mobile number. Please check the number or contact your PG owner.',
        },
        { status: 404 }
      )
    }

    // 2. Verify date of birth with robust format normalization
    function cleanDate(d: string): string {
      if (!d) return ''
      const trimmed = d.trim()
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

    const matchedResident = residents.find((r) => {
      if (!r.date_of_birth) {
        // If resident has no DOB in DB and is the only record matching this phone, permit login
        return residents.length === 1
      }
      const recordDob = cleanDate(r.date_of_birth)
      return recordDob === inputDob
    })

    if (!matchedResident) {
      return NextResponse.json(
        {
          error:
            'Date of birth does not match our records. Please check the date format or contact your PG owner.',
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
