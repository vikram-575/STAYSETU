import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const AUTH_COOKIE_NAMES = [
  'auth_email',
  'auth_role',
  'auth_token',
  'auth_user_id',
  'auth_mobile',
  'auth_name',
  'org_id',
  'organization_id',
  'impersonated_org_id',
  'superadmin_token',
  'admin_token',
  'must_change_password',
  'resident_id',
  'pgsetu_profile_id',
  'verified_mobile',
  'erp_locked',
  'firebase_token',
  'firebase_user_id',
]

async function clearAllAuthCookies() {
  const cookieStore = await cookies()

  AUTH_COOKIE_NAMES.forEach((c) => {
    cookieStore.delete(c)
    cookieStore.set(c, '', {
      maxAge: 0,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  })

  // Sign out from Supabase Auth
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('[Supabase SignOut Warning]:', err)
  }
}

export async function POST() {
  await clearAllAuthCookies()

  const response = NextResponse.json({ success: true, redirect: '/login?logout=true' })

  // Explicitly set Set-Cookie headers with expired cookies
  AUTH_COOKIE_NAMES.forEach((c) => {
    response.cookies.set(c, '', { maxAge: 0, path: '/' })
  })

  return response
}

export async function GET(request: NextRequest) {
  await clearAllAuthCookies()

  const loginUrl = new URL('/login?logout=true', request.url)
  const response = NextResponse.redirect(loginUrl)

  AUTH_COOKIE_NAMES.forEach((c) => {
    response.cookies.set(c, '', { maxAge: 0, path: '/' })
  })

  return response
}
