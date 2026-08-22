import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cookieStore = await cookies()

    // ── Supabase Auth (Primary) ────────────────────────────────────────────
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (!authError && authData.user) {
      const serviceClient = await createServiceClient()
      const { data: profile } = await serviceClient
        .from('users')
        .select('role, organization_id')
        .eq('id', authData.user.id)
        .single()

      const role = profile?.role || 'owner'
      const isSuperAdmin = role === 'superadmin'

      // Set minimal, secure session cookie (Supabase handles its own JWT cookies)
      cookieStore.set('auth_email', cleanEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      cookieStore.set('auth_role', role, {
        httpOnly: true, // ← httpOnly so client can't tamper
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      // Update last_login_at
      serviceClient.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', authData.user.id).then(() => {})

      let destination: string
      if (isSuperAdmin) {
        destination = '/superman'
      } else if (profile?.organization_id) {
        destination = '/dashboard'
      } else {
        destination = '/onboarding'
      }

      return NextResponse.json({ success: true, role, redirect: destination })
    }

    // Auth failed — return Supabase error, no fallback bypass
    return NextResponse.json(
      { error: authError?.message || 'Invalid email or password.' },
      { status: 401 }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 })
  }
}
