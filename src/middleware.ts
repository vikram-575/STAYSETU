import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast-path bypass for static files, landing page, and public routes
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

  // Check Firebase and session cookies
  const authEmail = request.cookies.get('auth_email')?.value
  const authToken = request.cookies.get('auth_token')?.value
  const firebaseUserId = request.cookies.get('firebase_user_id')?.value

  if (authEmail || authToken || firebaseUserId) {
    return NextResponse.next({ request })
  }

  // Not authenticated -> redirect to login
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/login'
  redirectUrl.searchParams.set('redirectTo', pathname)
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
