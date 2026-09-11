import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId } from '@/lib/org-helper'

/**
 * GET /api/residents
 * Queries residents strictly belonging to the authenticated user's organization.
 * Prevents cross-tenant data leakage and ensures clean single-PG scope in UI dropdowns.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId) {
      return NextResponse.json({ residents: [], total: 0 })
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status') || 'active'
    const q = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    let query = serviceClient
      .from('v_resident_current')
      .select('*')
      .eq('organization_id', orgId)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (q && q.trim().length > 0) {
      const trimmed = q.trim()
      query = query.or(`full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,registration_number.ilike.%${trimmed}%`)
    }

    query = query.order('full_name', { ascending: true }).limit(limit)

    const { data: residents, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ residents: residents || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch residents' }, { status: 500 })
  }
}
