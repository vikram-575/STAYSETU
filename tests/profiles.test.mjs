import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateTenantId,
  generateOwnerId,
  isValidMobile,
  cleanMobile,
  formatBudget,
  PROFILE_COLLECTIONS,
  AMENITY_OPTIONS,
  CITY_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
} from '../src/lib/profiles.ts'

describe('PG-Setu Profile Registration & ID System', () => {
  it('should generate valid Tenant ID matching TN + 4 digits + 3 alphanumeric with no duplicate chars', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateTenantId()
      assert.ok(id.startsWith('TN'), `ID must start with TN, got: ${id}`)
      assert.equal(id.length, 9, `ID must be exactly 9 characters (TN + 4 digits + 3 alphanumeric), got: ${id}`)
      
      const digitsPart = id.slice(2, 6)
      const alphaPart = id.slice(6, 9)
      
      // Digits part must be 4 numbers
      assert.match(digitsPart, /^\d{4}$/, `First 4 chars must be digits, got: ${digitsPart}`)
      // Suffix must be 3 alphanumeric
      assert.match(alphaPart, /^[A-Z0-9]{3}$/, `Last 3 chars must be alphanumeric, got: ${alphaPart}`)

      // All 7 suffix characters must be unique (no repeated characters)
      const suffix = id.slice(2)
      const uniqueChars = new Set(suffix.split(''))
      assert.equal(uniqueChars.size, 7, `All 7 suffix characters must be distinct with no duplicates, got: ${suffix}`)
    }
  })

  it('should generate valid PG Owner ID matching OW + 4 digits + 3 alphanumeric with no duplicate chars', () => {
    for (let i = 0; i < 50; i++) {
      const id = generateOwnerId()
      assert.ok(id.startsWith('OW'), `ID must start with OW, got: ${id}`)
      assert.equal(id.length, 9, `ID must be exactly 9 characters (OW + 4 digits + 3 alphanumeric), got: ${id}`)
      
      const digitsPart = id.slice(2, 6)
      const alphaPart = id.slice(6, 9)
      
      assert.match(digitsPart, /^\d{4}$/, `First 4 chars must be digits, got: ${digitsPart}`)
      assert.match(alphaPart, /^[A-Z0-9]{3}$/, `Last 3 chars must be alphanumeric, got: ${alphaPart}`)

      const suffix = id.slice(2)
      const uniqueChars = new Set(suffix.split(''))
      assert.equal(uniqueChars.size, 7, `All 7 suffix characters must be distinct with no duplicates, got: ${suffix}`)
    }
  })

  it('should validate Indian mobile numbers correctly', () => {
    assert.equal(isValidMobile('9876543210'), true)
    assert.equal(isValidMobile('8123456789'), true)
    assert.equal(isValidMobile('7000000000'), true)
    assert.equal(isValidMobile('6200000000'), true)
    // Invalid cases
    assert.equal(isValidMobile('5876543210'), false) // starts with 5
    assert.equal(isValidMobile('1876543210'), false) // starts with 1
    assert.equal(isValidMobile('987654321'), false)  // 9 digits
    assert.equal(isValidMobile('98765432100'), false) // 11 digits
    assert.equal(isValidMobile('abcdefghij'), false)  // not numbers
  })

  it('should clean and normalize mobile numbers with prefixes and symbols', () => {
    assert.equal(cleanMobile('+91 98765-43210'), '9876543210')
    assert.equal(cleanMobile('919876543210'), '9876543210')
    assert.equal(cleanMobile(' 98765 43210 '), '9876543210')
    assert.equal(cleanMobile('(987) 654-3210'), '9876543210')
  })

  it('should correctly format budget in paise to human-readable strings', () => {
    assert.equal(formatBudget(500000), '₹5K')
    assert.equal(formatBudget(1500000), '₹15K')
    assert.equal(formatBudget(10000000), '₹1.0L')
    assert.equal(formatBudget(25000000), '₹2.5L')
    assert.equal(formatBudget(50000), '₹500')
  })

  it('should have properly named collection constants', () => {
    assert.equal(PROFILE_COLLECTIONS.TENANT_PROFILES, 'tenant_profiles')
    assert.equal(PROFILE_COLLECTIONS.OWNER_PROFILES, 'owner_profiles')
  })

  it('should provide comprehensive amenity, city, and property type options', () => {
    assert.ok(AMENITY_OPTIONS.length >= 10, 'Should have at least 10 amenities')
    assert.ok(CITY_OPTIONS.length >= 15, 'Should have at least 15 major cities')
    assert.ok(PROPERTY_TYPE_OPTIONS.length >= 4, 'Should support at least 4 property categories')
  })
})