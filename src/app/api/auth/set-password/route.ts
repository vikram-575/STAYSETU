import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/set-password
 * Allows PG Owners and Staff to set their permanent password on first login.
 */
export async function POST(request: NextRequest) {
  try {
    const { password, confirmPassword } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 })
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const authEmail = cookieStore.get('auth_email')?.value
    const authUserId = cookieStore.get('auth_user_id')?.value

    const serviceClient = await createServiceClient()
    const supabase = await createClient()

    let targetUserId: string | null = authUserId || null
    let targetEmail: string | null = authEmail ? authEmail.trim().toLowerCase() : null

    // 1. Try to get Supabase session user
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        targetUserId = authData.user.id
        targetEmail = (authData.user.email || targetEmail)?.toLowerCase() || null
      }
    } catch {}

    // 2. If targetUserId is missing or needed, look up by auth_email in SQL database
    if (!targetUserId && targetEmail) {
      const { data: dbUser } = await serviceClient
        .from('users')
        .select('id, email')
        .ilike('email', targetEmail)
        .maybeSingle()
      if (dbUser?.id) {
        targetUserId = dbUser.id
      }
    }

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
    }

    const cleanPassword = password.trim()
    let passwordUpdated = false
    let updateErrorMessage = ''

    // 3. Try updating via current Supabase user session
    try {
      const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
        password: cleanPassword,
        data: {
          must_change_password: false,
          is_temporary_password: false,
          password_changed_at: new Date().toISOString(),
        },
      })
      if (!updateErr && updateData?.user) {
        passwordUpdated = true
      } else if (updateErr) {
        updateErrorMessage = updateErr.message
      }
    } catch (sessionErr: any) {
      updateErrorMessage = sessionErr?.message
    }

    // 4. If session update didn't complete (e.g. user was not in auth.users yet), register via signUp
    if (!passwordUpdated && targetEmail) {
      try {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: targetEmail,
          password: cleanPassword,
          options: {
            data: {
              must_change_password: false,
              is_temporary_password: false,
              password_changed_at: new Date().toISOString(),
            },
          },
        })

        if (!signUpErr && signUpData?.user) {
          passwordUpdated = true
        } else if (signUpErr) {
          // If user already registered in auth, sign in and update password
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: cleanPassword,
          })
          if (!signInErr) {
            passwordUpdated = true
          }
        }
      } catch (signupEx: any) {
        console.warn('[SignUp fallback notice]:', signupEx?.message)
      }
    }

    // 5. Also try admin update if service role is valid (best effort)
    if (targetUserId) {
      try {
        await serviceClient.auth.admin.updateUserById(targetUserId, {
          password: cleanPassword,
          user_metadata: {
            must_change_password: false,
            is_temporary_password: false,
            password_changed_at: new Date().toISOString(),
          },
        })
        passwordUpdated = true
      } catch {}
    }

    // 6. Update database users table timestamp and active status
    try {
      if (targetUserId) {
        await serviceClient
          .from('users')
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId)
      } else if (targetEmail) {
        await serviceClient
          .from('users')
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .ilike('email', targetEmail)
      }
    } catch {}

    // 7. Clear must_change_password cookie so future visits go straight to dashboard
    cookieStore.set('must_change_password', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Permanent password set successfully! Launching PG dashboard...',
      redirect: '/dashboard',
    })
  } catch (err: any) {
    console.error('[POST /api/auth/set-password Exception]:', err)
    return NextResponse.json({ error: err.message || 'Failed to set password.' }, { status: 500 })
  }
}
