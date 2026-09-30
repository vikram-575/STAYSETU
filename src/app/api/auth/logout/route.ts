import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const KNOWN_AUTH_COOKIES = [
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
  'erp_unlocked',
  'firebase_token',
  'firebase_user_id',
]

async function clearAllAuthCookies() {
  const cookieStore = await cookies()

  // 1. Purge all dynamic cookies in the cookie store
  try {
    const allCookies = cookieStore.getAll()
    allCookies.forEach((c) => {
      try {
        cookieStore.delete(c.name)
        cookieStore.set(c.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      } catch {}
    })
  } catch {}

  // 2. Explicitly wipe every known PG-Setu auth and ERP cookie
  KNOWN_AUTH_COOKIES.forEach((c) => {
    try {
      cookieStore.delete(c)
      cookieStore.set(c, '', {
        maxAge: 0,
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
    } catch {}
  })

  // 3. Fast-timeout Supabase Auth SignOut (does not block or hang logout if remote network lags)
  try {
    const supabase = await createClient()
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ])
  } catch (err) {
    console.warn('[Supabase SignOut Warning]:', err)
  }
}

export async function POST() {
  await clearAllAuthCookies()

  const response = NextResponse.json(
    { success: true, redirect: '/login?logout=true' },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  )

  // Explicitly append Set-Cookie headers with expired cookies for all known names
  KNOWN_AUTH_COOKIES.forEach((c) => {
    response.cookies.set(c, '', { maxAge: 0, path: '/' })
  })

  return response
}

export async function GET(request: NextRequest) {
  await clearAllAuthCookies()

  const loginUrl = new URL('/login?logout=true', request.url)
  const response = NextResponse.redirect(loginUrl)

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  KNOWN_AUTH_COOKIES.forEach((c) => {
    response.cookies.set(c, '', { maxAge: 0, path: '/' })
  })

  return response
}
