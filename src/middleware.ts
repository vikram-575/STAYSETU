import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast-path bypass for static files and public routes
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/api/')

  let supabaseResponse = NextResponse.next({ request })

  if (isPublicRoute) {
    return supabaseResponse
  }

  // Check custom session cookies
  const authEmail = request.cookies.get('auth_email')?.value
  const authToken = request.cookies.get('auth_token')?.value
  const firebaseUserId = request.cookies.get('firebase_user_id')?.value

  if (authEmail || authToken || firebaseUserId) {
    return supabaseResponse
  }

  // Check Supabase session
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rygtyzwkhcuiwxzqmmlo.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

  try {
    const supabase = createServerClient(
      url,
      key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      return supabaseResponse
    }
  } catch {}

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
