export const SUPER_ADMIN_EMAIL = (
  process.env.SUPER_ADMIN_EMAIL || 'vikramtomar0505@gmail.com'
).toLowerCase().trim()

export const SUPER_ADMIN_EMAILS = [
  SUPER_ADMIN_EMAIL,
  'vikramtomar0505@gmail.com',
  'vikramtomar050512@gmail.com',
  'tomarsahab575@gmail.com',
]

export const PROTECTED_SUPERADMIN_PHONES = [
  '9453522757',
  '6307139206',
]

export const PROTECTED_SUPERADMIN_EMAILS = [
  SUPER_ADMIN_EMAIL,
  'vikramtomar0505@gmail.com',
  'vikramtomar050512@gmail.com',
  'tomarsahab575@gmail.com',
]

/**
 * Checks whether an incoming registration, onboarding, profile creation, or check-in
 * attempts to register or overwrite a protected Superadmin phone number or email address.
 * Prevents unauthorized users from claiming or overwriting administrative credentials.
 */
export function isProtectedSuperAdminIdentity(input?: {
  email?: string | null
  phone?: string | null
  mobile?: string | null
}): boolean {
  if (!input) return false

  if (input.email) {
    const cleanEmail = input.email.toLowerCase().trim()
    if (
      PROTECTED_SUPERADMIN_EMAILS.some((e) => cleanEmail === e.toLowerCase().trim()) ||
      cleanEmail.includes('vikramtomar')
    ) {
      return true
    }
  }

  const rawPhone = input.phone || input.mobile
  if (rawPhone) {
    const digits = rawPhone.replace(/\D/g, '')
    if (digits.length >= 10) {
      const last10 = digits.slice(-10)
      if (PROTECTED_SUPERADMIN_PHONES.some((p) => last10 === p || digits.includes(p))) {
        return true
      }
    }
  }

  return false
}

/**
 * Recognizes authorized superadmin accounts by role, email, user ID, or mobile.
 */
export function isKnownSuperAdmin(
  email?: string | null,
  role?: string | null,
  userId?: string | null,
  mobile?: string | null
): boolean {
  if (role === 'superadmin') return true
  if (
    email &&
    SUPER_ADMIN_EMAILS.some(
      (e) => email.toLowerCase().trim() === e.toLowerCase().trim() || email.toLowerCase().includes('vikramtomar')
    )
  ) {
    return true
  }
  if (userId === '7d66235b-290c-4c73-9f43-abb9711339db' || userId === 'e4cd9eff-2a5e-4249-9094-e1ae92e1b0e7') {
    return true
  }
  if (mobile) {
    const digits = mobile.replace(/\D/g, '')
    if (PROTECTED_SUPERADMIN_PHONES.some((p) => digits.includes(p) || digits.endsWith(p))) return true
  }
  return false
}
