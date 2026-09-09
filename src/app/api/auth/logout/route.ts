import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const cookieStore = await cookies()
  
  // Clear ALL auth-related cookies (including superadmin_token!)
  // Failure to clear superadmin_token caused regular users to be treated as superadmin
  cookieStore.delete('auth_email')
  cookieStore.delete('auth_role')
  cookieStore.delete('auth_token')
  cookieStore.delete('auth_user_id')
  cookieStore.delete('superadmin_token')
  cookieStore.delete('must_change_password')
  cookieStore.delete('firebase_token')
  cookieStore.delete('firebase_user_id')

  // Sign out from Supabase
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {}

  return NextResponse.json({ success: true, redirect: '/login' })
}
