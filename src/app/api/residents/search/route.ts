import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/residents/search
 * Fast resident search for autocomplete dropdowns
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json({ residents: [] })

  const { data } = await supabase
    .from('v_resident_current')
    .select('resident_id, full_name, phone, registration_number, room_number, bed_label, total_outstanding_paise, status, monthly_rent_paise')
    .eq('organization_id', profile.organization_id)
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,registration_number.ilike.%${q}%`)
    .limit(10)

  return NextResponse.json({ residents: data ?? [] })
}
