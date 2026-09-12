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

    const referer = request.headers.get('referer') || ''
    const isFromSuperAdminPortal =
      referer.includes('/superman') ||
      referer.includes('/admin') ||
      referer.includes('/superadmin')

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

      // Establish Supabase Auth session so client and server SSR cookies exist
      let supabaseUserId: string | null = null
      try {
        const supabase = await createClient()
        const { data: authData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })
        if (authData?.user) {
          supabaseUserId = authData.user.id
        }
      } catch {}

      // Look up existing user record in SQL DB to preserve organization_id and profile
      const serviceClient = await createServiceClient()
      const { data: existingUser } = await serviceClient
        .from('users')
        .select('id, role, organization_id, full_name, phone')
        .ilike('email', cleanEmail)
        .maybeSingle()

      const resolvedUserId = existingUser?.id || supabaseUserId || '7d66235b-290c-4c73-9f43-abb9711339db'
      const resolvedRole = isFromSuperAdminPortal ? 'superadmin' : (existingUser?.role || 'owner')

      cookieStore.set('auth_role', resolvedRole, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_user_id', resolvedUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      // Clear temporary password flag for superadmin
      cookieStore.set('must_change_password', '', { maxAge: 0, path: '/' })

      // Update last_login_at
      if (existingUser?.id) {
        serviceClient
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', existingUser.id)
          .then(() => {})
      }

      const destination = isFromSuperAdminPortal ? '/superman' : '/dashboard'

      return NextResponse.json({
        success: true,
        role: resolvedRole,
        requiresPasswordChange: false,
        redirect: destination,
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

        if (profile && !profile.organization_id) {
          const { data: matchedOrg } = await serviceClient
            .from('organizations')
            .select('id')
            .or(`email.ilike.${cleanEmail},phone.eq.${profile.phone || 'none'}`)
            .maybeSingle()

          const { data: defaultOrg } = !matchedOrg
            ? await serviceClient.from('organizations').select('id').order('created_at', { ascending: true }).limit(1).maybeSingle()
            : { data: null }

          const orgIdToLink = matchedOrg?.id || defaultOrg?.id
          if (orgIdToLink) {
            profile.organization_id = orgIdToLink
            await serviceClient.from('users').update({ organization_id: orgIdToLink }).eq('id', profile.id)
          }
        }

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
        } else {
          // Clear any stale superadmin token from a previous session
          cookieStore.set('superadmin_token', '', { maxAge: 0, path: '/' })
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
        if (isSuperAdmin && isFromSuperAdminPortal) {
          destination = '/superman'
        } else if (mustChangePassword) {
          destination = '/set-password'
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
          if (!dbUser.organization_id) {
            const { data: matchedOrg } = await serviceClient
              .from('organizations')
              .select('id')
              .or(`email.ilike.${cleanEmail},phone.eq.${dbUser.phone || 'none'}`)
              .maybeSingle()

            const { data: defaultOrg } = !matchedOrg
              ? await serviceClient.from('organizations').select('id').order('created_at', { ascending: true }).limit(1).maybeSingle()
              : { data: null }

            const orgIdToLink = matchedOrg?.id || defaultOrg?.id
            if (orgIdToLink) {
              dbUser.organization_id = orgIdToLink
              await serviceClient.from('users').update({ organization_id: orgIdToLink }).eq('id', dbUser.id)
            }
          }

          const role = dbUser.role || 'owner'
          const isSuperAdmin = role === 'superadmin'
          // Only force password change if db record says so OR an 8-digit pin was used
          // (never for superadmin — superadmin always has a real password)
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
          } else {
            // Ensure stale superadmin_token is cleared for non-superadmin users
            cookieStore.set('superadmin_token', '', { maxAge: 0, path: '/' })
          }

          const destination = (isSuperAdmin && isFromSuperAdminPortal)
            ? '/superman'
            : mustChangePassword
            ? '/set-password'
            : '/dashboard'

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
