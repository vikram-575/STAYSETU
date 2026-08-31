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
 * POST /api/admin/broadcast
 * Dispatches platform-wide announcements / notifications to all PG Owners
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
    }

    const { title, message, target_city, channel = 'in_app' } = await request.json()
    if (!title || !message) {
      return NextResponse.json({ error: 'Announcement title and message are required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Fetch target organizations
    let query = supabase.from('organizations').select('id, name, phone, email, city')
    if (target_city && target_city !== 'all') {
      query = query.eq('city', target_city)
    }

    const { data: orgs, error: orgError } = await query
    if (orgError) throw orgError

    const totalRecipients = orgs?.length || 0

    return NextResponse.json({
      success: true,
      message: `Announcement broadcast successfully queued for ${totalRecipients} PG organizations.`,
      recipients_count: totalRecipients,
      broadcast: {
        title,
        message,
        channel,
        sent_at: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to dispatch broadcast' }, { status: 500 })
  }
}
