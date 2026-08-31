import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export interface AdminTokenPayload {
  email: string
  role: 'superadmin'
  exp: number
}

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'pgsetu-master-superadmin-secret-key-2026'

export const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'vikramtomar0505@gmail.com').toLowerCase().trim()
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'qwerty123'

/**
 * Web Crypto SHA-256 HMAC helper compatible with Edge Runtime & Node.js
 */
async function generateHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Helper to encode utf-8 string to base64url without Node Buffer
 */
function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Helper to decode base64url string to utf-8
 */
function fromBase64Url(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

/**
 * Sign an HMAC-SHA256 super admin session token (valid for 30 days)
 */
export async function signAdminToken(email: string, expiresInSeconds = 86400 * 30): Promise<string> {
  const payload: AdminTokenPayload = {
    email: email.toLowerCase().trim(),
    role: 'superadmin',
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }

  const payloadB64 = toBase64Url(JSON.stringify(payload))
  const signature = await generateHmac(payloadB64, ADMIN_SECRET)

  return `${payloadB64}.${signature}`
}

/**
 * Verify an HMAC-SHA256 super admin token
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    if (!token || !token.includes('.')) return null

    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    const expectedSignature = await generateHmac(payloadB64, ADMIN_SECRET)

    if (signature !== expectedSignature) return null

    const payload: AdminTokenPayload = JSON.parse(fromBase64Url(payloadB64))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return null // Expired
    }

    if (payload.email !== SUPER_ADMIN_EMAIL && payload.role !== 'superadmin') {
      return null
    }

    return payload
  } catch {
    return null
  }
}

/**
 * Synchronous payload extractor for fast-path middleware checks
 */
export function extractAdminTokenPayload(token: string): AdminTokenPayload | null {
  try {
    if (!token || !token.includes('.')) return null
    const [payloadB64] = token.split('.')
    if (!payloadB64) return null
    const payload: AdminTokenPayload = JSON.parse(fromBase64Url(payloadB64))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null
    if (payload.email === SUPER_ADMIN_EMAIL && payload.role === 'superadmin') {
      return payload
    }
    return null
  } catch {
    return null
  }
}

/**
 * Check if request has a valid super admin session
 */
export async function getAdminSessionFromCookies(): Promise<AdminTokenPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('superadmin_token')?.value
    if (!token) return null
    return await verifyAdminToken(token)
  } catch {
    return null
  }
}

/**
 * Middleware / API helper to verify super admin from NextRequest
 */
export function isSuperAdminFromRequest(request: NextRequest): boolean {
  const token = request.cookies.get('superadmin_token')?.value
  if (!token) return false
  const payload = extractAdminTokenPayload(token)
  return Boolean(payload)
}
