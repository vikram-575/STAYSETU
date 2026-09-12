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
          let orgId = adminProfile.organization_id
          let orgObj = adminProfile.organizations
          if (!orgId) {
            const { data: defaultOrg } = await serviceClient
              .from('organizations')
              .select('id, name, slug, gst_enabled')
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle()
            if (defaultOrg) {
              orgId = defaultOrg.id
              orgObj = defaultOrg
              try {
                await serviceClient.from('users').update({ organization_id: defaultOrg.id }).eq('id', adminProfile.id)
              } catch {}
            }
          }

          return {
            id: adminProfile.id,
            email: SUPER_ADMIN_EMAIL,
            full_name: adminProfile.full_name || 'Vikram Tomar (Owner)',
            role: (adminProfile.role as any) || 'owner',
            organization_id: orgId,
            organizations: orgObj,
            phone: adminProfile.phone,
          }
        }
      } catch {}

      return {
        id: 'superadmin_master',
        email: SUPER_ADMIN_EMAIL,
        full_name: 'Vikram Tomar (Super Admin)',
        role: 'superadmin',
        organization_id: null,
        organizations: null,
      }
    }

    // 2. Check Supabase JWT session
    let sbUser: any = null
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      sbUser = data?.user || null
    } catch {}

    const serviceClient = await createServiceClient()

    if (!sbUser) {
      // Fallback: check session cookies set by login route
      const authUserId = cookieStore.get('auth_user_id')?.value
      const authEmail = cookieStore.get('auth_email')?.value
      if (authUserId || authEmail) {
        let fallbackProfile: any = null

        // Try lookup by ID first if present
        if (authUserId) {
          const { data } = await serviceClient
            .from('users')
            .select('*, organizations(*)')
            .eq('id', authUserId)
            .maybeSingle()
          fallbackProfile = data
        }

        // If not found by ID, always look up by email (heals stale ID cookies after database wipes)
        if (!fallbackProfile && authEmail) {
          const { data } = await serviceClient
            .from('users')
            .select('*, organizations(*)')
            .ilike('email', authEmail)
            .maybeSingle()
          fallbackProfile = data

          // If found by email, update cookie so next request uses valid ID
          if (fallbackProfile?.id) {
            try {
              cookieStore.set('auth_user_id', fallbackProfile.id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
              })
            } catch {}
          }
        }

        if (fallbackProfile) {
          let orgId = fallbackProfile.organization_id
          let orgObj = fallbackProfile.organizations

          if (!orgId) {
            const { data: matchedOrg } = await serviceClient
              .from('organizations')
              .select('id, name, slug, gst_enabled')
              .or(`email.ilike.${fallbackProfile.email},phone.eq.${fallbackProfile.phone || 'none'}`)
              .maybeSingle()

            const { data: defaultOrg } = !matchedOrg
              ? await serviceClient
                  .from('organizations')
                  .select('id, name, slug, gst_enabled')
                  .order('created_at', { ascending: true })
                  .limit(1)
                  .maybeSingle()
              : { data: null }

            const resolvedOrg = matchedOrg || defaultOrg
            if (resolvedOrg) {
              orgId = resolvedOrg.id
              orgObj = resolvedOrg
              try {
                await serviceClient.from('users').update({ organization_id: resolvedOrg.id }).eq('id', fallbackProfile.id)
              } catch {}
            }
          }

          return {
            id: fallbackProfile.id,
            email: fallbackProfile.email,
            full_name: fallbackProfile.full_name || fallbackProfile.email?.split('@')[0] || 'User',
            role: fallbackProfile.role || 'owner',
            organization_id: orgId,
            phone: fallbackProfile.phone,
            organizations: orgObj,
          }
        }
      }
      return null
    }

    let profile: any = null

    const { data: byId } = await serviceClient
      .from('users')
      .select('*, organizations(*)')
      .eq('id', sbUser.id)
      .maybeSingle()

    if (byId) {
      profile = byId
    } else if (sbUser.email) {
      const { data: byEmail } = await serviceClient
        .from('users')
        .select('*, organizations(*)')
        .ilike('email', sbUser.email.toLowerCase())
        .maybeSingle()
      profile = byEmail
    }

    if (profile) {
      let orgId = profile.organization_id
      let orgObj = profile.organizations

      if (!orgId) {
        const { data: matchedOrg } = await serviceClient
          .from('organizations')
          .select('id, name, slug, gst_enabled')
          .or(`email.ilike.${profile.email},phone.eq.${profile.phone || 'none'}`)
          .maybeSingle()

        const { data: defaultOrg } = !matchedOrg
          ? await serviceClient
              .from('organizations')
              .select('id, name, slug, gst_enabled')
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle()
          : { data: null }

        const resolvedOrg = matchedOrg || defaultOrg
        if (resolvedOrg) {
          orgId = resolvedOrg.id
          orgObj = resolvedOrg
          try {
            await serviceClient.from('users').update({ organization_id: resolvedOrg.id }).eq('id', profile.id)
          } catch {}
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || profile.email?.split('@')[0] || 'User',
        role: profile.role || 'owner',
        organization_id: orgId,
        phone: profile.phone,
        organizations: orgObj,
      }
    }

    // Best-effort org resolution for auth user without profile row
    const userEmail = (sbUser.email || '').toLowerCase()
    let resolvedOrgId: string | null = null
    let resolvedOrgObj: any = null

    const { data: matchedOrg } = userEmail
      ? await serviceClient
          .from('organizations')
          .select('id, name, slug, gst_enabled')
          .ilike('email', userEmail)
          .maybeSingle()
      : { data: null }

    const { data: defaultOrg } = !matchedOrg
      ? await serviceClient
          .from('organizations')
          .select('id, name, slug, gst_enabled')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
      : { data: null }

    const finalOrg = matchedOrg || defaultOrg
    if (finalOrg) {
      resolvedOrgId = finalOrg.id
      resolvedOrgObj = finalOrg
      // Create user row so profile is permanently recorded
      try {
        await serviceClient.from('users').upsert({
          id: sbUser.id,
          email: userEmail,
          full_name: sbUser.user_metadata?.full_name || userEmail.split('@')[0] || 'PG Owner',
          role: (sbUser.user_metadata?.role as any) || 'owner',
          organization_id: finalOrg.id,
          is_active: true,
        }, { onConflict: 'id' })
      } catch {}
    }

    return {
      id: sbUser.id,
      email: sbUser.email || '',
      full_name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
      role: (sbUser.user_metadata?.role as AuthSessionUser['role']) || 'owner',
      organization_id: resolvedOrgId,
      organizations: resolvedOrgObj,
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('DYNAMIC_SERVER_USAGE')) {
      throw err
    }
    console.error('[getAuthenticatedUser Exception]:', err?.message || err)
    return null
  }
}
