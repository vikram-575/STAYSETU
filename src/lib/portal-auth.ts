import crypto from 'crypto'
import { cookies } from 'next/headers'

export interface PortalTokenPayload {
  residentId: string
  orgId: string
  phone: string
  exp: number
}

const PORTAL_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'pgsetu-resident-portal-secret-token-key-2026'

/**
 * Sign a payload into a secure HMAC-SHA256 token string.
 */
export function signPortalToken(payload: Omit<PortalTokenPayload, 'exp'>, expiresInSeconds = 86400 * 30): string {
  const fullPayload: PortalTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }

  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', PORTAL_SECRET)
    .update(payloadB64)
    .digest('base64url')

  return `${payloadB64}.${signature}`
}

/**
 * Verify an HMAC-SHA256 portal token and return the payload if valid and unexpired.
 */
export function verifyPortalToken(token: string): PortalTokenPayload | null {
  try {
    if (!token || !token.includes('.')) return null

    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', PORTAL_SECRET)
      .update(payloadB64)
      .digest('base64url')

    // Constant-time comparison
    if (signature !== expectedSignature) return null

    const payload: PortalTokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return null // Expired
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Extract authenticated resident token from incoming cookie store.
 */
export async function getPortalSession(): Promise<PortalTokenPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('resident_portal_token')?.value
    if (!token) return null
    return verifyPortalToken(token)
  } catch {
    return null
  }
}
