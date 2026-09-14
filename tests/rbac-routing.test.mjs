import { describe, it } from 'node:test'
import assert from 'node:assert'

/**
 * Pure helper simulating the RBAC decision matrix used across
 * src/middleware.ts, src/app/dashboard/layout.tsx, and auth API routes.
 */
function isResidentRole(role) {
  return role === 'resident' || role === 'tenant' || role === 'user'
}

function isStaffOrOwnerRole(role) {
  return ['superadmin', 'owner', 'manager', 'accountant', 'staff'].includes(role)
}

function resolveRouteDestination({
  role,
  requestedPath,
  isAuthenticated,
  isSuperAdminPortal = false,
  mustChangePassword = false,
}) {
  if (!isAuthenticated) {
    if (requestedPath.startsWith('/dashboard') || requestedPath.startsWith('/onboarding')) {
      return `/login?redirectTo=${encodeURIComponent(requestedPath)}`
    }
    return requestedPath
  }

  if (mustChangePassword) {
    return '/set-password'
  }

  const resident = isResidentRole(role)

  // If user visits /dashboard or /onboarding:
  if (requestedPath.startsWith('/dashboard') || requestedPath.startsWith('/onboarding')) {
    if (resident) {
      return '/my-profile'
    }
    return requestedPath
  }

  // If user visits /login while authenticated:
  if (requestedPath === '/login' || requestedPath === '/register') {
    if (role === 'superadmin' && isSuperAdminPortal) {
      return '/superman'
    }
    if (resident) {
      return '/my-profile'
    }
    return '/dashboard'
  }

  // Post-auth login destination:
  if (requestedPath === 'auth_callback') {
    if (role === 'superadmin' && isSuperAdminPortal) {
      return '/superman'
    }
    if (resident) {
      return '/my-profile'
    }
    return '/dashboard'
  }

  return requestedPath
}

describe('RBAC Route Protection & Resident Dashboard Isolation', () => {
  describe('Technique 1: Equivalence Partitioning on User Roles', () => {
    it('correctly identifies resident, tenant, and marketplace user as resident roles', () => {
      assert.strictEqual(isResidentRole('resident'), true)
      assert.strictEqual(isResidentRole('tenant'), true)
      assert.strictEqual(isResidentRole('user'), true)
      assert.strictEqual(isResidentRole('owner'), false)
      assert.strictEqual(isResidentRole('manager'), false)
      assert.strictEqual(isResidentRole('superadmin'), false)
    })

    it('correctly identifies management and staff roles as ERP authorized', () => {
      assert.strictEqual(isStaffOrOwnerRole('owner'), true)
      assert.strictEqual(isStaffOrOwnerRole('manager'), true)
      assert.strictEqual(isStaffOrOwnerRole('accountant'), true)
      assert.strictEqual(isStaffOrOwnerRole('staff'), true)
      assert.strictEqual(isStaffOrOwnerRole('superadmin'), true)
      assert.strictEqual(isStaffOrOwnerRole('resident'), false)
      assert.strictEqual(isStaffOrOwnerRole('tenant'), false)
    })
  })

  describe('Technique 2: Decision Table for /dashboard Access', () => {
    it('bounces resident accessing /dashboard directly to /my-profile', () => {
      const dest = resolveRouteDestination({
        role: 'resident',
        requestedPath: '/dashboard',
        isAuthenticated: true,
      })
      assert.strictEqual(dest, '/my-profile')
    })

    it('bounces resident accessing /dashboard/rooms or any subroute to /my-profile', () => {
      const subroutes = [
        '/dashboard/rooms',
        '/dashboard/residents',
        '/dashboard/billing',
        '/dashboard/payments',
        '/dashboard/settings',
        '/dashboard/electricity',
      ]
      for (const path of subroutes) {
        const dest = resolveRouteDestination({
          role: 'resident',
          requestedPath: path,
          isAuthenticated: true,
        })
        assert.strictEqual(dest, '/my-profile', `Failed for path: ${path}`)
      }
    })

    it('allows property owner and staff to access /dashboard', () => {
      const roles = ['owner', 'manager', 'superadmin', 'accountant', 'staff']
      for (const role of roles) {
        const dest = resolveRouteDestination({
          role,
          requestedPath: '/dashboard',
          isAuthenticated: true,
        })
        assert.strictEqual(dest, '/dashboard', `Failed for role: ${role}`)
      }
    })

    it('redirects unauthenticated visitor to /login?redirectTo=...', () => {
      const dest = resolveRouteDestination({
        role: null,
        requestedPath: '/dashboard',
        isAuthenticated: false,
      })
      assert.strictEqual(dest, '/login?redirectTo=%2Fdashboard')
    })
  })

  describe('Technique 3: Login Page and OTP Post-Auth Redirection', () => {
    it('redirects authenticated resident visiting /login to /my-profile (never /dashboard)', () => {
      const dest = resolveRouteDestination({
        role: 'resident',
        requestedPath: '/login',
        isAuthenticated: true,
      })
      assert.strictEqual(dest, '/my-profile')
    })

    it('redirects authenticated owner visiting /login to /dashboard', () => {
      const dest = resolveRouteDestination({
        role: 'owner',
        requestedPath: '/login',
        isAuthenticated: true,
      })
      assert.strictEqual(dest, '/dashboard')
    })

    it('resolves post-login callback destination to /my-profile for residents', () => {
      const dest = resolveRouteDestination({
        role: 'resident',
        requestedPath: 'auth_callback',
        isAuthenticated: true,
      })
      assert.strictEqual(dest, '/my-profile')
    })

    it('resolves post-login callback destination to /dashboard for owners', () => {
      const dest = resolveRouteDestination({
        role: 'owner',
        requestedPath: 'auth_callback',
        isAuthenticated: true,
      })
      assert.strictEqual(dest, '/dashboard')
    })
  })
})
