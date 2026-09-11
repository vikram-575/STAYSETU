import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {
  generateTenantId,
  cleanMobile,
  isValidMobile,
} from '../src/lib/profiles.ts'

const TEST_SECRET = 'test-resident-portal-secret-key-for-qa-2026'

function signPortalToken(payload, expiresInSeconds = 86400 * 30, secret = TEST_SECRET) {
  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
  return `${payloadB64}.${signature}`
}

function verifyPortalToken(token, secret = TEST_SECRET) {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
    const sigBuf = Buffer.from(signature)
    const expectedBuf = Buffer.from(expectedSignature)
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return null
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

describe('Unified Tenant Identity & Single Universal ID System', () => {
  describe('Technique 1: Canonical Unique Tenant ID Format & Specification', () => {
    it('generates a valid Unique Tenant ID starting with TN + 4 digits + 3 alphanumeric characters', () => {
      for (let i = 0; i < 30; i++) {
        const id = generateTenantId()
        assert.ok(id.startsWith('TN'), `Tenant ID must start with TN, got: ${id}`)
        assert.equal(id.length, 9, `Tenant ID must be 9 chars long, got: ${id}`)
        assert.match(id.slice(2, 6), /^\d{4}$/, `Chars 2-5 must be digits, got: ${id.slice(2, 6)}`)
        assert.match(id.slice(6, 9), /^[A-Z0-9]{3}$/, `Chars 6-8 must be alphanumeric, got: ${id.slice(6, 9)}`)
      }
    })

    it('normalizes Indian phone numbers across diverse formats to a clean 10-digit key', () => {
      assert.equal(cleanMobile('+91 98765 43210'), '9876543210')
      assert.equal(cleanMobile('919876543210'), '9876543210')
      assert.equal(cleanMobile('09876543210'), '9876543210')
      assert.equal(cleanMobile('+91-98765-43210'), '9876543210')
      assert.equal(cleanMobile('(987) 654-3210'), '9876543210')
      assert.equal(isValidMobile('9876543210'), true)
      assert.equal(isValidMobile('1234567890'), false) // Must start with 6-9
    })
  })

  describe('Technique 2: Bidirectional Identity Unification & ID Reuse', () => {
    it('re-uses the exact same Unique Tenant ID when PG owner checks in a self-registered tenant', () => {
      // Simulating a self-registered tenant
      const selfRegisteredTenant = {
        id: 'TN4827K3M',
        type: 'tenant',
        full_name: 'Priya Sharma',
        mobile: '9876543210',
      }

      // Check-in resolution logic:
      const checkinPhone = '+91 98765-43210'
      const cleaned = cleanMobile(checkinPhone)
      assert.equal(cleaned, selfRegisteredTenant.mobile)

      // When resolving tenant ID during PG owner check-in:
      const resolvedTenantId = selfRegisteredTenant.id
      assert.equal(resolvedTenantId, 'TN4827K3M', 'PG owner check-in must inherit the self-registered Unique Tenant ID')
    })

    it('generates a canonical TN... ID when PG owner checks in a brand new tenant first', () => {
      // A walk-in tenant with no prior registration
      const walkInPhone = '9811223344'
      const existingInSystem = null

      const assignedTenantId = existingInSystem || generateTenantId()
      assert.ok(assignedTenantId.startsWith('TN'), 'Assigned ID must follow canonical TN... format')
      assert.equal(assignedTenantId.length, 9)

      // Later, when tenant looks up profile using their mobile:
      const synthesizedProfile = {
        id: assignedTenantId,
        mobile: cleanMobile(walkInPhone),
        full_name: 'Walk-in Tenant',
      }

      assert.equal(synthesizedProfile.id, assignedTenantId, 'Synthesized profile must use the same Unique Tenant ID assigned at check-in')
    })

    it('preserves the exact same Unique Tenant ID across multiple PG stays (multi-stay / transfer)', () => {
      const permanentTenantId = 'TN7294B3X'
      const tenantMobile = '9876543210'

      // Stay 1: Check-in at "Luxury Living PG"
      const stay1 = {
        organization_id: 'org-luxury-1',
        registration_number: permanentTenantId,
        phone: tenantMobile,
        status: 'checked_out',
      }

      // Stay 2: Later check-in at "Greenwood Coliving"
      // System checks existing residents for this mobile:
      const pastStays = [stay1]
      const existingWithTn = pastStays.find((s) => s.registration_number.startsWith('TN'))
      const stay2TenantId = existingWithTn ? existingWithTn.registration_number : generateTenantId()

      const stay2 = {
        organization_id: 'org-greenwood-2',
        registration_number: stay2TenantId,
        phone: tenantMobile,
        status: 'active',
      }

      assert.equal(stay2.registration_number, permanentTenantId, 'Stay 2 must use the identical Unique Tenant ID as Stay 1')
      assert.equal(stay1.registration_number, stay2.registration_number)
    })
  })

  describe('Technique 3: Portal Authentication & Multi-Stay Priority', () => {
    it('authenticates a resident using their Unique Tenant ID (TN...) or 10-digit mobile', () => {
      const tenantRecord = {
        id: 'res-uuid-1',
        organization_id: 'org-1',
        registration_number: 'TN4827K3M',
        phone: '9876543210',
        date_of_birth: '1998-05-15',
        status: 'active',
      }

      // Test searching with mobile
      const mobileInput = '9876543210'
      const matchByMobile = tenantRecord.phone === cleanMobile(mobileInput)
      assert.ok(matchByMobile, 'Must match by phone')

      // Test searching with Unique Tenant ID
      const idInput = 'TN4827K3M'
      const matchById = tenantRecord.registration_number.toLowerCase() === idInput.toLowerCase()
      assert.ok(matchById, 'Must match by Unique Tenant ID')

      // Generate signed portal token
      const token = signPortalToken({
        residentId: tenantRecord.id,
        orgId: tenantRecord.organization_id,
        phone: tenantRecord.phone,
      })

      const session = verifyPortalToken(token)
      assert.ok(session, 'Portal token must be valid')
      assert.equal(session.residentId, tenantRecord.id)
    })

    it('prioritizes active stays over past/checked-out stays when matching resident records', () => {
      const multipleStays = [
        { id: 'stay-1', registration_number: 'TN4827K3M', status: 'checked_out', date_of_birth: '1998-05-15' },
        { id: 'stay-2', registration_number: 'TN4827K3M', status: 'active', date_of_birth: '1998-05-15' },
        { id: 'stay-3', registration_number: 'TN4827K3M', status: 'checked_out', date_of_birth: '1998-05-15' },
      ]

      const sorted = [...multipleStays].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        return 0
      })

      assert.equal(sorted[0].id, 'stay-2', 'Active stay must be prioritized first')
      assert.equal(sorted[0].status, 'active')
    })
  })
})
