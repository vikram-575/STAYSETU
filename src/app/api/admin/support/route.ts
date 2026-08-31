import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

/**
 * Helper to require Super Admin
 */
async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) return { role: 'superadmin' }
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const service = await createServiceClient()
    const { data: profile } = await service.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') return null
    return user
  } catch {
    return null
  }
}

/**
 * GET /api/admin/support
 * List support tickets, maintenance escalations & complaints across all PGs
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
    }

    const supabase = await createServiceClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const orgId = url.searchParams.get('org_id')
    const limit = Number(url.searchParams.get('limit')) || 50

    let query = supabase
      .from('complaints')
      .select('*, organizations(name, phone, city), residents(full_name, phone, room_id)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    const { data: tickets, error } = await query

    if (error) {
      // If complaints table is empty or error, fallback gracefully
      return NextResponse.json({
        success: true,
        tickets: [],
        stats: { open: 0, in_progress: 0, resolved: 0, total: 0 },
      })
    }

    const stats = {
      open: tickets?.filter((t) => t.status === 'open').length || 0,
      in_progress: tickets?.filter((t) => t.status === 'in_progress').length || 0,
      resolved: tickets?.filter((t) => t.status === 'resolved').length || 0,
      total: tickets?.length || 0,
    }

    return NextResponse.json({
      success: true,
      tickets: tickets || [],
      stats,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch support tickets' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/support
 * Update ticket status or resolution notes
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
    }

    const { id, status, admin_notes } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const updatePayload: any = {}

    if (status) updatePayload.status = status
    if (status === 'resolved') updatePayload.resolved_at = new Date().toISOString()
    if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes

    const { data: updated, error } = await supabase
      .from('complaints')
      .update(updatePayload)
      .eq('id', id)
      .select('*, organizations(name, phone), residents(full_name, phone)')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      ticket: updated,
      message: 'Support ticket updated successfully.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update support ticket' }, { status: 500 })
  }
}
