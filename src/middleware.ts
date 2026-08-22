import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast-path bypass for static files, favicon, manifest, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({ request })
  }

  // Session cookies
  const authEmail = request.cookies.get('auth_email')?.value?.toLowerCase()
  const authRole = request.cookies.get('auth_role')?.value
  const authToken = request.cookies.get('auth_token')?.value
  const firebaseUserId = request.cookies.get('firebase_user_id')?.value

  const isAuthenticated = Boolean(authEmail || authToken || firebaseUserId)
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
    return NextResponse.next({ request })
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
    return NextResponse.next({ request })
  }

  // Protect /dashboard routes (All authenticated staff/owners)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next({ request })
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
