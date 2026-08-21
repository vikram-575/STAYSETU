import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'

export interface AuthSessionUser {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'owner' | 'manager' | 'accountant' | 'staff' | 'resident'
  organization_id: string | null
  phone?: string | null
  organizations?: {
    id: string
    name: string
    slug?: string
    gst_enabled?: boolean
  } | null
}

/**
 * Server-side helper to retrieve current authenticated user from cookies, Supabase, or Firebase
 */
export async function getAuthenticatedUser(): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies()
    const authEmail = cookieStore.get('auth_email')?.value?.toLowerCase()
    const authRole = cookieStore.get('auth_role')?.value as any
    const firebaseUserId = cookieStore.get('firebase_user_id')?.value

    const supabase = await createClient()
    const serviceClient = await createServiceClient()

    // 1. Try Supabase session
    const { data: { user: sbUser } } = await supabase.auth.getUser()
    const effectiveEmail = sbUser?.email?.toLowerCase() || authEmail

    if (!effectiveEmail && !sbUser && !firebaseUserId) {
      return null
    }

    // Special Super Admin Fast-Path
    if (effectiveEmail === 'vikramtomar0505@gmail.com' || authRole === 'superadmin') {
      // Ensure superadmin profile exists in DB
      const { data: adminProfile } = await serviceClient
        .from('users')
        .select('*, organizations(*)')
        .eq('email', 'vikramtomar0505@gmail.com')
        .single()

      if (adminProfile) {
        return {
          id: adminProfile.id,
          email: 'vikramtomar0505@gmail.com',
          full_name: adminProfile.full_name || 'Vikram Tomar (Super Admin)',
          role: 'superadmin',
          organization_id: adminProfile.organization_id,
          organizations: adminProfile.organizations || { id: 'primary', name: 'PG-SETU Platform' },
        }
      }

      return {
        id: sbUser?.id || firebaseUserId || 'superadmin_vikram',
        email: 'vikramtomar0505@gmail.com',
        full_name: 'Vikram Tomar (Super Admin)',
        role: 'superadmin',
        organization_id: null,
        organizations: { id: 'platform', name: 'PG-SETU Platform Enterprise' },
      }
    }

    // 2. Look up user by Supabase ID or Email
    let profile: any = null

    if (sbUser?.id) {
      const { data } = await serviceClient
        .from('users')
        .select('*, organizations(*)')
        .eq('id', sbUser.id)
        .single()
      profile = data
    }

    if (!profile && effectiveEmail) {
      const { data } = await serviceClient
        .from('users')
        .select('*, organizations(*)')
        .eq('email', effectiveEmail)
        .single()
      profile = data
    }

    // 3. Look up in Firestore if not found in SQL
    if (!profile && effectiveEmail) {
      try {
        const snap = await adminDb
          .collection(COLLECTIONS.USERS)
          .where('email', '==', effectiveEmail)
          .limit(1)
          .get()

        if (!snap.empty) {
          const docData = snap.docs[0].data()
          return {
            id: snap.docs[0].id,
            email: effectiveEmail,
            full_name: docData.full_name || effectiveEmail.split('@')[0],
            role: docData.role || 'owner',
            organization_id: docData.organization_id || null,
            phone: docData.phone || null,
            organizations: docData.organization_id ? { id: docData.organization_id, name: 'My PG' } : null,
          }
        }
      } catch {}
    }

    if (profile) {
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || profile.email?.split('@')[0] || 'User',
        role: profile.role || 'owner',
        organization_id: profile.organization_id,
        phone: profile.phone,
        organizations: profile.organizations,
      }
    }

    // User is authenticated but hasn't created profile yet
    return {
      id: sbUser?.id || firebaseUserId || effectiveEmail || 'user',
      email: effectiveEmail || 'user@pgsetu.com',
      full_name: sbUser?.user_metadata?.full_name || effectiveEmail?.split('@')[0] || 'User',
      role: 'owner',
      organization_id: null,
      organizations: null,
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('DYNAMIC_SERVER_USAGE')) {
      throw err
    }
    return null
  }
}
