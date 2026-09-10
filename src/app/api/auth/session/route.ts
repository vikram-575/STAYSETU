import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const serviceClient = await createServiceClient()
    let staffUsers: any[] = []
    if (user.organization_id) {
      const { data } = await serviceClient
        .from('users')
        .select('id, full_name, email, phone, role, created_at')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
      staffUsers = data || []
    }

    return NextResponse.json({
      user,
      organization: user.organizations,
      staffUsers,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, userId, email, role } = await request.json()
    const cookieStore = await cookies()

    if (token) {
      cookieStore.set('firebase_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    }

    if (userId) {
      cookieStore.set('firebase_user_id', userId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to set session' }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('firebase_token')
  cookieStore.delete('firebase_user_id')
  return NextResponse.json({ success: true })
}
