import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  // Create Supabase client for session verification and token refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: { user } } = await supabase.auth.getUser()

  // Session cookies fallback
  const authEmail = (request.cookies.get('auth_email')?.value || user?.email)?.toLowerCase()
  const authRole = request.cookies.get('auth_role')?.value
  const authToken = request.cookies.get('auth_token')?.value

  const isAuthenticated = Boolean(user || authEmail || authToken)
  const isSuperAdmin = authRole === 'superadmin' || authEmail === 'vikramtomar0505@gmail.com'

  // If already logged in and visiting login/register, redirect to appropriate home
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    const targetUrl = request.nextUrl.clone()
    targetUrl.pathname = isSuperAdmin ? '/admin' : '/dashboard'
    return NextResponse.redirect(targetUrl)
  }

  // Public routes allowed without login
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/api/')

  if (isPublicRoute) {
    return response
  }

  // Protect /admin routes (Super Admin only)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    if (!isSuperAdmin) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Protect /dashboard routes (All authenticated staff/owners)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', pathname)
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
