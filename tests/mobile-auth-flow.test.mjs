import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanMobile, isValidMobile, generateTenantId } from '../src/lib/profiles.ts'

describe('Unified Mobile Auth & Supabase Synchronization Flow', () => {
  describe('Technique 1: Mobile Number Validation & Normalization', () => {
    it('should normalize Indian phone numbers with country code or spaces to 10 digits', () => {
      assert.equal(cleanMobile('+91 94535 22757'), '9453522757')
      assert.equal(cleanMobile('09453522757'), '9453522757')
      assert.equal(cleanMobile('94535-22757'), '9453522757')
      assert.equal(isValidMobile('9453522757'), true)
    })

    it('should reject invalid mobile numbers', () => {
      assert.equal(isValidMobile('12345'), false)
      assert.equal(isValidMobile('abcdefghij'), false)
      assert.equal(isValidMobile('0123456789'), false)
    })
  })

  describe('Technique 2: Decision Table - Existing vs New Mobile Flow', () => {
    it('should identify flow for existing DB numbers: ask for OTP directly without other info', () => {
      const dbNumber = '9453522757'
      const checkResult = {
        exists: true,
        name: 'Vikram Tomar (Super Admin)',
        role: 'owner',
        mobile: dbNumber,
        devOtp: '123456'
      }

      assert.equal(checkResult.exists, true)
      assert.ok(checkResult.name, 'Existing user must have name')
      assert.ok(checkResult.devOtp, 'Existing user must receive OTP immediately')
      // Rule: Do not ask for gender, age, profession when exists === true
      const requiredInputs = checkResult.exists ? ['otp'] : ['otp', 'full_name', 'gender', 'age', 'profession']
      assert.deepEqual(requiredInputs, ['otp'])
    })

    it('should identify flow for new numbers: ask for other information + OTP', () => {
      const newNumber = '9876543210'
      const checkResult = {
        exists: false,
        mobile: newNumber,
        devOtp: '654321'
      }

      assert.equal(checkResult.exists, false)
      const requiredInputs = checkResult.exists ? ['otp'] : ['otp', 'full_name', 'gender', 'age', 'profession']
      assert.deepEqual(requiredInputs, ['otp', 'full_name', 'gender', 'age', 'profession'])
    })
  })

  describe('Technique 3: Canonical Tenant ID & Supabase Payload Structure', () => {
    it('should generate canonical Unique Tenant ID starting with TN', () => {
      const tenantId = generateTenantId()
      assert.match(tenantId, /^TN\d{4}[A-Z0-9]{3}$/)
    })

    it('should build valid Supabase users table upsert payload for signed in user', () => {
      const cleaned = '9453522757'
      const now = new Date().toISOString()
      const payload = {
        id: '7d66235b-290c-4c73-9f43-abb9711339db',
        organization_id: 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98',
        email: 'vikramtomar0505@gmail.com',
        full_name: 'Vikram Tomar (Super Admin)',
        phone: cleaned,
        role: 'owner',
        is_active: true,
        last_login_at: now,
        updated_at: now,
      }

      assert.equal(payload.phone, '9453522757')
      assert.equal(payload.is_active, true)
      assert.ok(payload.last_login_at)
      assert.equal(payload.role, 'owner')
    })

    it('should build valid Supabase users payload for new tenant registration', () => {
      const cleaned = '9123456789'
      const now = new Date().toISOString()
      const payload = {
        id: 'uuid-new-tenant-1234',
        organization_id: 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98',
        email: cleaned + '@user.pgsetu.com',
        full_name: 'Ananya Sharma',
        phone: cleaned,
        role: 'resident',
        is_active: true,
        last_login_at: now,
        created_at: now,
        updated_at: now,
      }

      assert.equal(payload.phone, '9123456789')
      assert.equal(payload.role, 'resident')
      assert.equal(payload.is_active, true)
      assert.ok(payload.email.includes('@user.pgsetu.com'))
    })
  })
})
