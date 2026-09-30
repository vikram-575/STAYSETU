'use client'

/**
 * Client-side utility to completely clear all cached profile and session
 * data from localStorage, sessionStorage, and accessible cookies.
 * Prevents stale user profiles from lingering after sign out or account switches.
 */
export function clearClientAuthCache() {
  if (typeof window === 'undefined') return

  try {
    // 1. Clear all localStorage keys associated with PG-Setu sessions
    const keysToRemove: string[] = [
      'pgsetu_session_user',
      'pgsetu_profile_data',
      'pgsetu_session_stays',
      'pgsetu_hosted_properties',
      'pgsetu_passbook_summary',
      'pgsetu_profile_id',
    ]

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('pgsetu_') ||
          key.startsWith('sb-') ||
          key.includes('user') ||
          key.includes('profile') ||
          key.includes('session'))
      ) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k)
      } catch {}
    })

    // 2. Clear sessionStorage
    try {
      sessionStorage.clear()
    } catch {}

    // 3. Clear non-httpOnly cookies accessible by document.cookie
    try {
      const cookiesToClear = [
        'auth_role',
        'auth_name',
        'auth_email',
        'auth_mobile',
        'erp_locked',
        'erp_unlocked',
        'resident_id',
        'pgsetu_profile_id',
        'impersonated_org_id',
      ]
      cookiesToClear.forEach((name) => {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;`
      })
    } catch {}
  } catch (err) {
    console.warn('[clearClientAuthCache warning]:', err)
  }
}
