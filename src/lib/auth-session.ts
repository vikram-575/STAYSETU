import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAdminSessionFromCookies, SUPER_ADMIN_EMAIL } from '@/lib/admin-auth'

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
 * Supports Supabase JWT sessions & HMAC SuperAdmin sessions.
 * Also supports Super Admin PG Impersonation.
 */
export async function getAuthenticatedUser(): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies()
    const impersonatedOrgId = cookieStore.get('impersonated_org_id')?.value

    // 1. Check SuperAdmin token session
    const adminSession = await getAdminSessionFromCookies()
    if (adminSession) {
      const serviceClient = await createServiceClient()

      // Check if impersonating a specific PG
      if (impersonatedOrgId) {
        try {
          const { data: impOrg } = await serviceClient
            .from('organizations')
            .select('*')
            .eq('id', impersonatedOrgId)
            .single()

          if (impOrg) {
            return {
              id: 'superadmin_master',
              email: SUPER_ADMIN_EMAIL,
              full_name: 'Vikram Tomar (Super Admin)',
              role: 'superadmin',
              organization_id: impOrg.id,
              organizations: impOrg,
            }
          }
        } catch {}
      }

      try {
        const { data: adminProfile } = await serviceClient
          .from('users')
          .select('*, organizations(*)')
          .eq('email', SUPER_ADMIN_EMAIL)
          .single()

        if (adminProfile) {
          return {
            id: adminProfile.id,
            email: SUPER_ADMIN_EMAIL,
            full_name: adminProfile.full_name || 'Vikram Tomar (Super Admin)',
            role: 'superadmin',
            organization_id: adminProfile.organization_id,
            organizations: adminProfile.organizations || { id: 'primary', name: 'PG-SETU Platform' },
          }
        }
      } catch {}

      return {
        id: 'superadmin_master',
        email: SUPER_ADMIN_EMAIL,
        full_name: 'Vikram Tomar (Super Admin)',
        role: 'superadmin',
        organization_id: null,
        organizations: { id: 'platform', name: 'PG-SETU Platform Enterprise' },
      }
    }

    // 2. Check Supabase JWT session
    let sbUser: any = null
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      sbUser = data?.user || null
    } catch {}

    if (!sbUser) {
      return null
    }

    const serviceClient = await createServiceClient()

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
