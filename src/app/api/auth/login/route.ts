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

    const rawInput = (email || '').trim()
    let cleanEmail = rawInput.toLowerCase()
    const cookieStore = await cookies()

    // Support Login via Registered Mobile Number or Email
    if (!cleanEmail.includes('@')) {
      const phoneDigits = rawInput.replace(/[^0-9]/g, '')
      try {
        const serviceClient = await createServiceClient()
        let query = serviceClient
          .from('users')
          .select('email, id, phone')
        
        if (phoneDigits.length >= 10) {
          query = query.or(`phone.eq.${rawInput},phone.ilike.%${phoneDigits.slice(-10)}%`)
        } else {
          query = query.eq('phone', rawInput)
        }
        
        const { data: matchedUser } = await query.maybeSingle()
        if (matchedUser?.email) {
          cleanEmail = matchedUser.email.toLowerCase()
        }
      } catch {}
    }

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
      // Clear temporary password flag for superadmin
      cookieStore.set('must_change_password', '', { maxAge: 0, path: '/' })

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
        requiresPasswordChange: false,
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
          .select('id, role, organization_id, email, full_name, phone')
          .or(`id.eq.${authData.user.id},email.ilike.${cleanEmail}`)
          .maybeSingle()

        const role = profile?.role || (authData.user.user_metadata?.role as string) || 'owner'
        const isSuperAdmin = role === 'superadmin'

        // Check if user is logging in with a temporary password
        const metadata = authData.user.user_metadata || {}
        const is8DigitPin = /^\d{8}$/.test(password.trim())
        const mustChangePassword =
          !isSuperAdmin &&
          (metadata.must_change_password === true ||
           metadata.is_temporary_password === true ||
           (is8DigitPin && metadata.must_change_password !== false))

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
        cookieStore.set('auth_user_id', profile?.id || authData.user.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })

        if (mustChangePassword) {
          cookieStore.set('must_change_password', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })
        } else {
          cookieStore.set('must_change_password', '', { maxAge: 0, path: '/' })
        }

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
        if (profile?.id) {
          serviceClient
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', profile.id)
            .then(() => {})
        }

        let destination: string
        if (isSuperAdmin) {
          destination = '/superman'
        } else if (mustChangePassword) {
          destination = '/set-password'
        } else if (profile?.organization_id) {
          destination = '/dashboard'
        } else {
          destination = '/dashboard'
        }

        return NextResponse.json({
          success: true,
          role,
          requiresPasswordChange: mustChangePassword,
          redirect: destination,
        })
      }

      if (authError) {
        // Fallback: Check if user exists in database `users` table
        const serviceClient = await createServiceClient()
        const { data: dbUser } = await serviceClient
          .from('users')
          .select('id, role, organization_id, email, full_name, phone')
          .ilike('email', cleanEmail)
          .maybeSingle()

        if (dbUser) {
          const role = dbUser.role || 'owner'
          const isSuperAdmin = role === 'superadmin'
          const is8DigitPin = /^\d{8}$/.test(password.trim())
          const mustChangePassword = !isSuperAdmin && is8DigitPin

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
          cookieStore.set('auth_user_id', dbUser.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })

          if (mustChangePassword) {
            cookieStore.set('must_change_password', 'true', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
            })
          } else {
            cookieStore.set('must_change_password', '', { maxAge: 0, path: '/' })
          }

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

          const destination = isSuperAdmin
            ? '/superman'
            : mustChangePassword
            ? '/set-password'
            : dbUser.organization_id
            ? '/dashboard'
            : '/onboarding'

          return NextResponse.json({
            success: true,
            role,
            requiresPasswordChange: mustChangePassword,
            redirect: destination,
          })
        }

        return NextResponse.json(
          { error: authError.message || 'Invalid email, phone number, or password.' },
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
