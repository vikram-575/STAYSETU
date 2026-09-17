import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Owner Onboarding, ERP Locked Gating & Tenant DOB Tests', () => {
  // 1. Tenant Mandatory DOB & Age Calculation
  describe('Tenant DOB Validation & Age Calculation', () => {
    function validateTenantSignup(payload) {
      if (!payload.full_name || payload.full_name.trim().length === 0) {
        return { valid: false, error: 'Full name is required' }
      }
      if (!payload.dob || !payload.dob.trim()) {
        return { valid: false, error: 'Date of Birth (DOB) is mandatory' }
      }
      const birthDate = new Date(payload.dob)
      if (isNaN(birthDate.getTime())) {
        return { valid: false, error: 'Invalid Date of Birth' }
      }
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 15 || age > 105) {
        return { valid: false, error: 'Age must be at least 15 years' }
      }
      return { valid: true, calculatedAge: age }
    }

    it('rejects tenant signup when DOB is missing', () => {
      const res = validateTenantSignup({ full_name: 'Rahul Sharma', dob: '' })
      assert.equal(res.valid, false)
      assert.equal(res.error, 'Date of Birth (DOB) is mandatory')
    })

    it('rejects tenant signup when DOB is invalid string', () => {
      const res = validateTenantSignup({ full_name: 'Rahul Sharma', dob: 'not-a-date' })
      assert.equal(res.valid, false)
      assert.equal(res.error, 'Invalid Date of Birth')
    })

    it('accepts tenant signup with valid DOB and calculates age correctly', () => {
      // Born 2000-01-15 -> age in 2026 is 26
      const res = validateTenantSignup({ full_name: 'Rahul Sharma', dob: '2000-01-15' })
      assert.equal(res.valid, true)
      assert.ok(res.calculatedAge >= 25 && res.calculatedAge <= 27)
    })
  })

  // 2. Owner Registration: Personal Details Only
  describe('Owner Registration: Personal Details Only (No PG / No Org Created)', () => {
    function processOwnerRegistration(input) {
      const owner_name = (input.owner_name || '').trim()
      const dob = (input.dob || '').trim()
      const gender = (input.gender || '').trim()
      const city = (input.city || '').trim()
      const email = (input.email || '').trim()

      if (!owner_name) {
        return { error: 'Full name is required' }
      }

      // Owner profile created in locked state, with NO organization or PG created
      const profile = {
        full_name: owner_name,
        dob: dob || null,
        gender: gender || null,
        city: city || null,
        email: email || null,
        role: 'owner',
        organization_id: null,
        erp_unlocked: false,
        can_list_properties: false,
        onboarding_status: 'pending_superadmin',
        created_at: new Date().toISOString(),
      }

      return { success: true, profile }
    }

    it('creates owner profile with personal details only and erp_unlocked: false', () => {
      const result = processOwnerRegistration({
        owner_name: 'Amit Agarwal',
        dob: '1988-06-12',
        gender: 'Male',
        city: 'Noida',
        email: 'amit.agarwal@example.com',
        // Even if rogue PG fields are passed, they should not create any org/pg
        pg_name: 'Super Grand PG',
        rooms: 25,
      })

      assert.equal(result.success, true)
      assert.equal(result.profile.full_name, 'Amit Agarwal')
      assert.equal(result.profile.dob, '1988-06-12')
      assert.equal(result.profile.gender, 'Male')
      assert.equal(result.profile.city, 'Noida')
      assert.equal(result.profile.email, 'amit.agarwal@example.com')
      assert.equal(result.profile.organization_id, null)
      assert.equal(result.profile.erp_unlocked, false)
      assert.equal(result.profile.can_list_properties, false)
      assert.equal(result.profile.onboarding_status, 'pending_superadmin')
      // Ensure no PG properties got embedded
      assert.equal(result.profile.pg_name, undefined)
      assert.equal(result.profile.rooms, undefined)
    })
  })

  // 3. ERP Gating & Org Resolution Logic
  describe('ERP Gating & Org Resolution Guardrails', () => {
    function resolveEffectiveOrg(user, userOrg, allOrgs) {
      if (userOrg) return userOrg
      // Only SuperAdmin or special administrative account falls back to the first org
      const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'vikramtomar0505@gmail.com'
      if (isSuperAdmin && allOrgs && allOrgs.length > 0) {
        return allOrgs[0]
      }
      return null
    }

    it('prevents regular locked owners from being automatically assigned any existing PG org', () => {
      const lockedOwner = {
        id: 'owner-xyz',
        role: 'owner',
        email: 'newowner@gmail.com',
        erp_unlocked: false,
      }
      const existingSystemOrgs = [
        { id: 'ed', name: 'Existing Vikram PG' },
        { id: 'another-pg', name: 'Another Property' },
      ]

      const effectiveOrg = resolveEffectiveOrg(lockedOwner, null, existingSystemOrgs)
      // Must be null! Never automatically allots any PG to an un-onboarded owner!
      assert.equal(effectiveOrg, null)
    })

    it('allows superadmin to fallback to firstOrg when inspecting system', () => {
      const superAdmin = {
        id: 'admin-1',
        role: 'superadmin',
        email: 'admin@pgsetu.com',
      }
      const existingSystemOrgs = [{ id: 'ed', name: 'Main HQ PG' }]

      const effectiveOrg = resolveEffectiveOrg(superAdmin, null, existingSystemOrgs)
      assert.equal(effectiveOrg?.id, 'ed')
    })
  })

  // 4. SuperAdmin Provisioning & Unlocking Workflow
  describe('SuperAdmin Provisioning & Unlock Flow', () => {
    function superAdminProvisionOwner(ownerProfile, provisionConfig) {
      if (!provisionConfig.property_name || !provisionConfig.city) {
        return { error: 'Property name and city are mandatory for provisioning' }
      }

      const generatedOrgId = `org_${Date.now()}`
      const property = {
        id: `prop_${Date.now()}`,
        name: provisionConfig.property_name,
        city: provisionConfig.city,
        address: provisionConfig.address || '',
        pg_type: provisionConfig.pg_type || 'coliving',
        total_rooms: provisionConfig.approx_rooms || 6,
        starting_rent: provisionConfig.starting_rent || 7500,
        organization_id: generatedOrgId,
      }

      const updatedProfile = {
        ...ownerProfile,
        organization_id: generatedOrgId,
        erp_unlocked: true,
        can_list_properties: true,
        onboarding_status: 'completed',
        unlocked_at: new Date().toISOString(),
      }

      return {
        success: true,
        organizationId: generatedOrgId,
        property,
        ownerProfile: updatedProfile,
      }
    }

    it('provisions PG organization and unlocks ERP & property listing capability', () => {
      const initialLockedOwner = {
        full_name: 'Suresh Raina',
        mobile: '9876543210',
        dob: '1985-04-10',
        erp_unlocked: false,
        can_list_properties: false,
        organization_id: null,
      }

      const provisionResult = superAdminProvisionOwner(initialLockedOwner, {
        property_name: 'Raina Residency',
        city: 'Bangalore',
        address: '#12, HSR Layout Sector 1',
        pg_type: 'boys',
        approx_rooms: 10,
        starting_rent: 8500,
      })

      assert.equal(provisionResult.success, true)
      assert.ok(provisionResult.organizationId)
      assert.equal(provisionResult.property.name, 'Raina Residency')
      assert.equal(provisionResult.property.total_rooms, 10)
      assert.equal(provisionResult.ownerProfile.erp_unlocked, true)
      assert.equal(provisionResult.ownerProfile.can_list_properties, true)
      assert.equal(provisionResult.ownerProfile.onboarding_status, 'completed')
    })
  })
})
