import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId') || user?.organization_id

    let query = supabase
      .from('message_logs')
      .select('*, residents(full_name, registration_number, room_number)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    const { data: logs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      count: logs?.length || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch logs' }, { status: 500 })
  }
}
