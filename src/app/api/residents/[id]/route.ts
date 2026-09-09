import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

/**
 * GET /api/residents/[id]
 * Retrieves current resident details and active assignment for a given resident ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const serviceClient = await createServiceClient()
    let orgId = user.organization_id

    let query = serviceClient
      .from('v_resident_current')
      .select('*')
      .eq('resident_id', id)

    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    const { data: resident, error } = await query.maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    return NextResponse.json({ resident })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch resident' }, { status: 500 })
  }
}
