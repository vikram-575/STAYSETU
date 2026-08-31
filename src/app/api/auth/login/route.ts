import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  signAdminToken,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD,
} from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cookieStore = await cookies()

    // ── 1. MASTER COMPANY SUPER ADMIN AUTHENTICATION ───────────────────────
    if (
      cleanEmail === SUPER_ADMIN_EMAIL &&
      password === SUPER_ADMIN_PASSWORD
    ) {
      const adminToken = await signAdminToken(cleanEmail)

      // Set secure HTTP-Only SuperAdmin token
      cookieStore.set('superadmin_token', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      cookieStore.set('auth_email', cleanEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_role', 'superadmin', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      // Ensure profile exists in SQL DB (best effort)
      try {
        const serviceClient = await createServiceClient()
        await serviceClient.from('users').upsert({
          email: cleanEmail,
          full_name: 'Vikram Tomar (Super Admin)',
          role: 'superadmin',
          is_active: true,
        }, { onConflict: 'email' })
      } catch {}

      return NextResponse.json({
        success: true,
        role: 'superadmin',
        redirect: '/superman',
      })
    }

    // ── 2. SUPABASE AUTHENTICATION (PG Owners, Managers, Staff) ───────────
    try {
      const supabase = await createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (!authError && authData?.user) {
        const serviceClient = await createServiceClient()
        const { data: profile } = await serviceClient
          .from('users')
          .select('role, organization_id')
          .eq('id', authData.user.id)
          .single()

        const role = profile?.role || 'owner'
        const isSuperAdmin = role === 'superadmin'

        cookieStore.set('auth_email', cleanEmail, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })
        cookieStore.set('auth_role', role, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })

        if (isSuperAdmin) {
          const adminToken = await signAdminToken(cleanEmail)
          cookieStore.set('superadmin_token', adminToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
          })
        }

        // Update last_login_at
        serviceClient
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', authData.user.id)
          .then(() => {})

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

      if (authError) {
        return NextResponse.json(
          { error: authError.message || 'Invalid email or password.' },
          { status: 401 }
        )
      }
    } catch (sbErr: any) {
      console.warn('[Supabase Auth Exception]:', sbErr?.message)
      return NextResponse.json(
        { error: sbErr?.message || 'Authentication service error. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 })
  }
}
