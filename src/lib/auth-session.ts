import { createClient, createServiceClient } from '@/lib/supabase/server'

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
 * Server-side helper to retrieve current authenticated user.
 * Auth is strictly via Supabase JWT — no cookie fallback to prevent spoofing.
 */
export async function getAuthenticatedUser(): Promise<AuthSessionUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user: sbUser } } = await supabase.auth.getUser()

    if (!sbUser) {
      return null
    }

    const serviceClient = await createServiceClient()

    // Look up user profile by Supabase user ID (primary) or email (fallback for newly created users)
    let profile: any = null

    const { data: byId } = await serviceClient
      .from('users')
      .select('*, organizations(*)')
      .eq('id', sbUser.id)
      .single()

    if (byId) {
      profile = byId
    } else if (sbUser.email) {
      const { data: byEmail } = await serviceClient
        .from('users')
        .select('*, organizations(*)')
        .eq('email', sbUser.email.toLowerCase())
        .single()
      profile = byEmail
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

    // User authenticated but profile not yet created (just registered)
    return {
      id: sbUser.id,
      email: sbUser.email || '',
      full_name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
      role: (sbUser.user_metadata?.role as AuthSessionUser['role']) || 'owner',
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
