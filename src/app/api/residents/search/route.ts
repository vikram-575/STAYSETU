import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

/**
 * GET /api/residents/search
 * Fast resident search for autocomplete dropdowns
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = await createServiceClient()
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json({ residents: [] })

  let query = serviceClient
    .from('v_resident_current')
    .select('resident_id, full_name, phone, registration_number, room_number, bed_label, total_outstanding_paise, status, monthly_rent_paise')

  if (user.organization_id) {
    query = query.eq('organization_id', user.organization_id)
  }

  const { data, error } = await query
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,registration_number.ilike.%${q}%`)
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ residents: data ?? [] })
}
