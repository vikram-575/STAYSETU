import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

/**
 * POST /api/admin/impersonate
 * Super Admin 1-Click Impersonation:
 * Switches the active session context to the target PG organization
 * and redirects straight to /dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const isSuperAdmin = isSuperAdminFromRequest(request)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin access required for PG Impersonation.' }, { status: 403 })
    }

    const { organization_id } = await request.json()
    if (!organization_id) {
      return NextResponse.json({ error: 'Target Organization ID is required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, slug, phone, email')
      .eq('id', organization_id)
      .single()

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
    }

    // Set cookie so getAuthenticatedUser or client components can operate in context of this org
    const cookieStore = await cookies()
    cookieStore.set('impersonated_org_id', org.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: `Now managing "${org.name}" as Master Admin.`,
      redirect: '/dashboard',
      organization: org,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to impersonate PG' }, { status: 500 })
  }
}
