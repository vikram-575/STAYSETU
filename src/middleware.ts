import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSuperAdminFromRequestAsync } from '@/lib/admin-auth'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Fast-path bypass for static files, favicon, manifest, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return response
  }

  // 1. Check SuperAdmin token with cryptographic HMAC verification
  const isSuperAdmin = await isSuperAdminFromRequestAsync(request)

  // 2. Check Supabase session
  let sbUser: any = null
  try {
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data } = await supabase.auth.getUser()
    sbUser = data?.user || null
  } catch {}

  const authUserId = request.cookies.get('auth_user_id')?.value
  const authEmail = request.cookies.get('auth_email')?.value
  const isAuthenticated = Boolean(isSuperAdmin || sbUser || (authUserId && authEmail))

  const mustChangePassword = request.cookies.get('must_change_password')?.value === 'true'

  // Anti-loop protection: if request has redirectTo or error, do NOT bounce back to protected pages
  const hasRedirectTo = request.nextUrl.searchParams.has('redirectTo')
  const hasError = request.nextUrl.searchParams.has('error')
  const shouldBypassLoginRedirect = hasRedirectTo || hasError

  // If already logged in and visiting login pages, redirect to home (unless recovering or errored)
  if (
    isAuthenticated &&
    !shouldBypassLoginRedirect &&
    (pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/superman/login' ||
      pathname === '/admin/login' ||
      pathname === '/superadmin/login')
  ) {
    const isSuperAdminLoginPage =
      pathname === '/superman/login' ||
      pathname === '/admin/login' ||
      pathname === '/superadmin/login'

    const targetUrl = request.nextUrl.clone()
    targetUrl.pathname = mustChangePassword
      ? '/set-password'
      : isSuperAdmin && isSuperAdminLoginPage
      ? '/superman'
      : '/dashboard'
    return NextResponse.redirect(targetUrl)
  }

  // Force redirect to /set-password if temporary password must be changed
  if (isAuthenticated && mustChangePassword && pathname.startsWith('/dashboard')) {
    const targetUrl = request.nextUrl.clone()
    targetUrl.pathname = '/set-password'
    return NextResponse.redirect(targetUrl)
  }

  // If user visits /set-password but does not have a temporary password
  if (isAuthenticated && !mustChangePassword && pathname === '/set-password') {
    const targetUrl = request.nextUrl.clone()
    targetUrl.pathname = '/dashboard'
    return NextResponse.redirect(targetUrl)
  }

  // Public routes allowed without login (including root landing page)
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/superman/login') ||
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/superadmin/login') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/set-password') ||
    pathname.startsWith('/api/')

  if (isPublicRoute) {
    return response
  }

  // Protect /superman, /admin, and /superadmin routes (Super Admin only)
  if (pathname.startsWith('/superman') || pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
    if (!isSuperAdmin && (!sbUser || sbUser.user_metadata?.role !== 'superadmin')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/superman/login'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Protect /dashboard and /onboarding routes (All authenticated staff/owners/superadmins)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      if (pathname.startsWith('/dashboard')) {
        redirectUrl.searchParams.set('redirectTo', pathname)
      }
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
