import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Return 2-char initials from a full name */
export function initials(name: string): string {
  if (!name || typeof name !== 'string' || !name.trim()) return 'PG'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Format ISO date string as DD MMM YYYY */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  try {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/** Format ISO date-time string as DD MMM YYYY, HH:MM */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  try {
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

/**
 * Build a wa.me WhatsApp link with a pre-filled message.
 * Opens directly on device with owner's WhatsApp application.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const rawDigits = (phone || '').replace(/\D/g, '')
  const digits = rawDigits.replace(/^0+/, '')
  if (!digits) return `https://wa.me/?text=${encodeURIComponent(message || '')}`
  const intl = digits.startsWith('91') ? digits : `91${digits}`
  return `https://wa.me/${intl}?text=${encodeURIComponent(message || '')}`
}

/** Build an SMS link with a pre-filled message body */
export function buildSmsLink(phone: string, message: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  return `sms:${digits}?body=${encodeURIComponent(message || '')}`
}

/** Generate a unique idempotency key for preventing duplicate payments/submissions */
export function generateIdempotencyKey(): string {
  return `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
