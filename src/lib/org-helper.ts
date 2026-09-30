import { createServiceClient } from '@/lib/supabase/server'
import type { AuthSessionUser } from '@/lib/auth-session'

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(val: unknown): boolean {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

export interface EffectiveOrganization {
  id: string
  name: string
  slug?: string
  gst_enabled?: boolean
}

/**
 * Resolves the effective organization for a logged-in user or superadmin.
 * 1. Checks if user.organization_id is already a valid UUID.
 * 2. If not, looks up matching organization by email/phone or the first available organization in the DB.
 * 3. If zero organizations exist in the database (fresh install or clean wipe),
 *    it automatically provisions a primary default organization so that UUID foreign key queries succeed.
 * 4. Guarantees the returned organization ID is always a valid UUID (never returns 'primary').
 */
export async function resolveEffectiveOrg(
  user?: AuthSessionUser | null
): Promise<EffectiveOrganization | null> {
  const serviceClient = await createServiceClient()

  // 1. User already has a valid UUID orgId (ignoring placeholder seed org)
  if (
    user?.organization_id &&
    isValidUUID(user.organization_id) &&
    user.organization_id !== 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98'
  ) {
    const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'vikramtomar0505@gmail.com'

    const { data: foundOrg } = await serviceClient
      .from('organizations')
      .select('id, name, slug, gst_enabled, owner_user_id, phone, email')
      .eq('id', user.organization_id)
      .maybeSingle()

    if (foundOrg) {
      const cleanPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''
      const orgPhone = foundOrg.phone ? foundOrg.phone.replace(/\D/g, '').slice(-10) : ''
      const orgEmail = foundOrg.email?.toLowerCase().trim()
      const uEmail = user.email?.toLowerCase().trim()

      const isLegitOwnerOrg =
        isSuperAdmin ||
        user.role !== 'owner' ||
        foundOrg.owner_user_id === user.id ||
        (cleanPhone && orgPhone && cleanPhone === orgPhone) ||
        (uEmail && orgEmail && uEmail === orgEmail && !uEmail.includes('@pgsetu.'))

      if (isLegitOwnerOrg) {
        return {
          id: foundOrg.id,
          name: foundOrg.name,
          slug: foundOrg.slug,
          gst_enabled: Boolean(foundOrg.gst_enabled),
        }
      }
    }
  }

  // 2. Try to match by owner_user_id, email, or phone if user exists
  if (user?.id && isValidUUID(user.id)) {
    const { data: ownedOrg } = await serviceClient
      .from('organizations')
      .select('id, name, slug, gst_enabled')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (ownedOrg && isValidUUID(ownedOrg.id)) {
      try {
        await serviceClient.from('users').update({ organization_id: ownedOrg.id }).eq('id', user.id)
      } catch {}
      return {
        id: ownedOrg.id,
        name: ownedOrg.name,
        slug: ownedOrg.slug,
        gst_enabled: Boolean(ownedOrg.gst_enabled),
      }
    }
  }

  const cleanMob = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : ''
  const userEmail = user?.email?.trim()

  if (userEmail || cleanMob) {
    const orFilters: string[] = []
    if (userEmail && !userEmail.includes('@pgsetu.')) {
      orFilters.push(`email.ilike.${userEmail}`)
    }
    if (cleanMob) {
      orFilters.push(`phone.eq.${cleanMob}`)
      orFilters.push(`phone.ilike.%${cleanMob}%`)
    }

    if (orFilters.length > 0) {
      const { data: matchedOrg } = await serviceClient
        .from('organizations')
        .select('id, name, slug, gst_enabled')
        .or(orFilters.join(','))
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (matchedOrg && isValidUUID(matchedOrg.id)) {
        // Link user to this org
        if (user?.id && isValidUUID(user.id)) {
          try {
            await serviceClient.from('users').update({ organization_id: matchedOrg.id }).eq('id', user.id)
          } catch {}
        }
        return {
          id: matchedOrg.id,
          name: matchedOrg.name,
          slug: matchedOrg.slug,
          gst_enabled: Boolean(matchedOrg.gst_enabled),
        }
      }
    }
  }

  // 3. Fallback: Only for superadmin or authorized master user, grab the first organization in the database
  const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'vikramtomar0505@gmail.com'

  if (!isSuperAdmin) {
    // Un-onboarded owners and residents must NOT be automatically allotted any property or organization!
    return null
  }

  const { data: firstOrg } = await serviceClient
    .from('organizations')
    .select('id, name, slug, gst_enabled')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstOrg && isValidUUID(firstOrg.id)) {
    if (user?.id && isValidUUID(user.id)) {
      try {
        await serviceClient.from('users').update({ organization_id: firstOrg.id }).eq('id', user.id)
      } catch {}
    }
    return {
      id: firstOrg.id,
      name: firstOrg.name,
      slug: firstOrg.slug,
      gst_enabled: Boolean(firstOrg.gst_enabled),
    }
  }

  // 4. Zero organizations exist (fresh wipe / new deployment) -> Auto-provision primary organization
  try {
    const orgName = user?.full_name ? `${user.full_name}'s PG` : 'PG-SETU Management'
    const slug = `pgsetu-${Date.now().toString(36)}`
    const ownerUserId = user?.id && isValidUUID(user.id) ? user.id : null

    const { data: newOrg, error } = await serviceClient
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        email: (user?.email && !user.email.includes('@pgsetu.')) ? user.email : null,
        phone: user?.phone || null,
        owner_user_id: ownerUserId,
        currency_code: 'INR',
        timezone: 'Asia/Kolkata',
        settings: { plan: 'enterprise', subscription_status: 'active' },
      })
      .select('id, name, slug, gst_enabled')
      .single()

    if (newOrg && isValidUUID(newOrg.id)) {
      if (ownerUserId) {
        try {
          await serviceClient.from('users').update({ organization_id: newOrg.id }).eq('id', ownerUserId)
        } catch {}
      }
      return {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        gst_enabled: Boolean(newOrg.gst_enabled),
      }
    }
  } catch (createErr) {
    console.error('Failed to auto-provision default organization:', createErr)
  }

  return null
}

/**
 * Returns a valid UUID string for the effective organization, or null if unresolvable.
 * NEVER returns 'primary' or arbitrary strings.
 */
export async function resolveEffectiveOrgId(
  user?: AuthSessionUser | null
): Promise<string | null> {
  const org = await resolveEffectiveOrg(user)
  return org?.id && isValidUUID(org.id) ? org.id : null
}
