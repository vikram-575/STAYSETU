import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cookieStore = await cookies()
    const serviceClient = await createServiceClient()

    // 1. Try creating user in Supabase Auth Admin
    let supabaseUserId: string | null = null
    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || cleanEmail.split('@')[0], role: 'owner' },
    })

    if (!createError && newUser?.user) {
      supabaseUserId = newUser.user.id
    } else {
      // If user exists or admin API disabled, try standard signUp
      const supabase = await createClient()
      const { data: signUpData } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name } },
      })
      supabaseUserId = signUpData.user?.id || null
    }

    // 2. Set Session Cookies
    cookieStore.set('auth_email', cleanEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    cookieStore.set('auth_role', 'owner', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    cookieStore.set('auth_token', supabaseUserId ? `user_${supabaseUserId}` : 'session_active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    // 3. Create or upsert user profile in SQL DB
    if (supabaseUserId) {
      await serviceClient.from('users').upsert({
        id: supabaseUserId,
        email: cleanEmail,
        full_name: full_name || cleanEmail.split('@')[0],
        role: 'owner',
        is_active: true,
      }, { onConflict: 'id' })
    }

    return NextResponse.json({
      success: true,
      redirect: '/onboarding',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 })
  }
}
