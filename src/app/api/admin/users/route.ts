import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createDoc, COLLECTIONS } from '@/lib/firebase/db'

export async function GET(request: NextRequest) {
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
 */
export async function POST(request: NextRequest) {
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
      // If user exists in Auth, update password
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const found = existingUsers?.users?.find((u) => u.email?.toLowerCase() === cleanEmail)
      if (found) {
        userId = found.id
        await supabase.auth.admin.updateUserById(userId, {
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

    // Sync to Firestore
    createDoc(COLLECTIONS.USERS, {
      email: cleanEmail,
      full_name: full_name || cleanEmail.split('@')[0],
      role,
      organization_id: organization_id || null,
      phone: phone || null,
      is_active: true,
    }, userId || undefined).catch(() => {})

    return NextResponse.json({
      success: true,
      message: `User ${cleanEmail} created successfully with role ${role}.`,
      user: profile || { email: cleanEmail, role, full_name },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 })
  }
}
