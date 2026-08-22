import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

async function requireSuperAdmin(request: NextRequest) {
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
}

/**
 * GET /api/admin/users
 * List all platform users (Super Admin only)
 */
export async function GET(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request)
  if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
  try {
    const supabase = await createServiceClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, is_active, last_login_at, created_at, organization_id, organizations(name, slug)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      users: users || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch platform users' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Create a new user with password and assign role & organization
 * Super Admin only
 */
export async function POST(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request)
  if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
  try {
    const body = await request.json()
    const { email, password, full_name, role = 'owner', organization_id, phone } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const supabase = await createServiceClient()

    // 1. Create in Supabase Auth
    let userId: string | null = null
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (!authError && authUser?.user) {
      userId = authUser.user.id
    } else {
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const found = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail)
      if (found && found.id) {
        userId = found.id
        await supabase.auth.admin.updateUserById(found.id, {
          password,
          user_metadata: { full_name, role },
        })
      }
    }

    // 2. Save in database users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId || undefined,
        email: cleanEmail,
        full_name: full_name || cleanEmail.split('@')[0],
        role,
        organization_id: organization_id || null,
        phone: phone || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select('*, organizations(name)')
      .single()

    if (profileError && !profile) {
      throw profileError
    }

    return NextResponse.json({
      success: true,
      message: `User ${cleanEmail} created successfully with role ${role}.`,
      user: profile || { email: cleanEmail, role, full_name },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 })
  }
}
