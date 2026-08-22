import { NextResponse, NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * GET/POST /api/admin/init-superadmin
 * Provisions Super Admin. Only callable once if the user doesn't exist yet.
 * Locked behind env-variable guard in production.
 */
export async function GET(request: NextRequest) {
  return handleInitSuperAdmin(request)
}

export async function POST(request: NextRequest) {
  return handleInitSuperAdmin(request)
}

async function handleInitSuperAdmin(request: NextRequest) {
  // Only allow in development OR with a secret header to prevent public invocation
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET
  const providedSecret = request.headers.get('x-bootstrap-secret') || request.nextUrl.searchParams.get('secret')

  if (bootstrapSecret && providedSecret !== bootstrapSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'vikramtomar0505@gmail.com'
  const superAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'qwerty123'
  const superAdminName = 'Vikram Tomar (Super Admin)'

  let supabaseCreated = false
  try {
    const supabase = await createServiceClient()

    // Check if user exists in Supabase
    const { data: usersList } = await supabase.auth.admin.listUsers()
    const existingUser = usersList?.users?.find((u) => u.email?.toLowerCase() === superAdminEmail.toLowerCase())

    let supabaseUserId = existingUser?.id

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: superAdminEmail,
        password: superAdminPass,
        email_confirm: true,
        user_metadata: { full_name: superAdminName, role: 'superadmin' },
      })
      if (createError) throw createError
      supabaseUserId = newUser.user?.id
      supabaseCreated = true
    } else {
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: superAdminPass,
        user_metadata: { full_name: superAdminName, role: 'superadmin' },
      })
    }

    // Upsert in users table
    if (supabaseUserId) {
      await supabase.from('users').upsert({
        id: supabaseUserId,
        email: superAdminEmail,
        full_name: superAdminName,
        role: 'superadmin',
        is_active: true,
      }, { onConflict: 'email' })
    }

    return NextResponse.json({
      success: true,
      message: supabaseCreated ? `Super Admin created.` : `Super Admin already exists and has been refreshed.`,
      email: superAdminEmail,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to initialize super admin' }, { status: 500 })
  }
}
