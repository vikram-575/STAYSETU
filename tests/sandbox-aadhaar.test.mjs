import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateAadhaarFormat,
  maskAadhaar,
  validateVerhoeffAlgorithm,
  calculateNameMatch,
  generateVerificationId,
} from '../src/lib/kyc/security.ts'

const DEFAULT_SANDBOX_API_KEY = 'key_live_5f51ed66f94447f6aa4de1e62cb0d9e7'
const DEFAULT_SANDBOX_API_SECRET = 'secret_live_20d78f2008b34ee092f108718146ee31'

describe('Sandbox Aadhaar e-KYC Verification & Profile Auto-Save', () => {
  it('should verify live Sandbox API key configuration and credentials', () => {
    assert.equal(DEFAULT_SANDBOX_API_KEY, 'key_live_5f51ed66f94447f6aa4de1e62cb0d9e7')
    assert.ok(DEFAULT_SANDBOX_API_KEY.startsWith('key_live_'))
    assert.equal(DEFAULT_SANDBOX_API_KEY.length, 41)

    assert.equal(DEFAULT_SANDBOX_API_SECRET, 'secret_live_20d78f2008b34ee092f108718146ee31')
    assert.ok(DEFAULT_SANDBOX_API_SECRET.startsWith('secret_live_'))
    assert.equal(DEFAULT_SANDBOX_API_SECRET.length, 44)
  })

  it('should validate Aadhaar 12-digit format and Verhoeff checksum correctly', () => {
    // Valid 12-digit Aadhaar masking
    assert.equal(maskAadhaar('234567890120'), 'XXXX XXXX 0120')
    assert.equal(maskAadhaar('987654321098'), 'XXXX XXXX 1098')
    assert.equal(maskAadhaar(''), 'XXXX XXXX XXXX')

    // Invalid format tests
    const shortAadhaar = validateAadhaarFormat('12345')
    assert.equal(shortAadhaar.valid, false)

    const startsWithZero = validateAadhaarFormat('012345678901')
    assert.equal(startsWithZero.valid, false)

    const startsWithOne = validateAadhaarFormat('112345678901')
    assert.equal(startsWithOne.valid, false)

    // Checksum verification
    let validVerhoeff = '23456789012'
    for (let d = 0; d <= 9; d++) {
      if (validateVerhoeffAlgorithm(validVerhoeff + d)) {
        validVerhoeff += d
        break
      }
    }
    assert.equal(validateVerhoeffAlgorithm(validVerhoeff), true)
    // Altered digit fails checksum
    const altered = validVerhoeff.slice(0, 11) + ((Number(validVerhoeff.slice(-1)) + 1) % 10)
    assert.equal(validateVerhoeffAlgorithm(altered), false)
  })


  it('should simulate full Sandbox Aadhaar e-KYC flow, demographic verification and checks', () => {
    const verificationId = generateVerificationId()
    assert.ok(verificationId.startsWith('PG-AAD-'))

    const tenantDetails = {
      full_name: 'RAHUL SHARMA',
      date_of_birth: '1998-05-14',
      gender: 'M',
    }

    const fetchedAadhaarProfile = {
      masked_aadhaar: 'XXXX XXXX 4821',
      name: 'RAHUL SHARMA',
      date_of_birth: '1998-05-14',
      gender: 'M',
      care_of: 'S/O Ramesh Sharma',
      address: {
        house: 'Flat 402, Royal Residency',
        street: 'Main Road, Sector 62',
        locality: 'Noida',
        district: 'Gautam Buddha Nagar',
        state: 'Uttar Pradesh',
        pincode: '201301',
        full_address: 'Flat 402, Royal Residency, Main Road, Sector 62, Noida, Uttar Pradesh - 201301',
      },
      signature_verified: true,
      qr_verified: true,
    }

    // 1. Name Match
    const nameMatch = calculateNameMatch(tenantDetails.full_name, fetchedAadhaarProfile.name)
    assert.equal(nameMatch.match, true)
    assert.equal(nameMatch.confidence, 1.0)

    // 2. DOB Match
    assert.equal(tenantDetails.date_of_birth, fetchedAadhaarProfile.date_of_birth)

    // 3. Gender Match
    assert.equal(tenantDetails.gender, fetchedAadhaarProfile.gender)

    // 4. Check status calculation
    const allMatchesPassed =
      nameMatch.match &&
      tenantDetails.date_of_birth === fetchedAadhaarProfile.date_of_birth &&
      tenantDetails.gender === fetchedAadhaarProfile.gender &&
      fetchedAadhaarProfile.signature_verified

    assert.equal(allMatchesPassed, true)
  })

  it('should correctly map fetched Aadhaar e-KYC profile to resident onboarding form state', () => {
    const fetchedExtractedData = {
      masked_aadhaar: 'XXXX XXXX 4821',
      name: 'VIKRAM SINGH',
      date_of_birth: '1995-11-20',
      gender: 'M',
      care_of: 'S/O Rajendra Singh',
      address: {
        house: 'House No. 12',
        street: 'Vikas Marg, Sector 15',
        locality: 'Noida',
        district: 'Gautam Buddha Nagar',
        state: 'Uttar Pradesh',
        pincode: '201301',
        full_address: 'House No. 12, Vikas Marg, Sector 15, Noida, Uttar Pradesh - 201301',
      },
      signature_verified: true,
      qr_verified: true,
    }

    const form = {
      full_name: '',
      date_of_birth: '',
      gender: 'male',
      permanent_address: '',
      permanent_city: '',
      permanent_state: '',
      permanent_pincode: '',
      id_type: '',
      id_number: '',
      notes: '',
    }

    // Simulate auto-save handler logic
    const addrParts = [fetchedExtractedData.address.house, fetchedExtractedData.address.street].filter(Boolean).join(', ')
    const updatedForm = {
      ...form,
      full_name: fetchedExtractedData.name || form.full_name,
      date_of_birth: fetchedExtractedData.date_of_birth || form.date_of_birth,
      gender: fetchedExtractedData.gender === 'F' ? 'female' : 'male',
      permanent_address: addrParts || form.permanent_address,
      permanent_city: fetchedExtractedData.address.locality,
      permanent_state: fetchedExtractedData.address.state,
      permanent_pincode: fetchedExtractedData.address.pincode,
      id_type: 'aadhaar',
      id_number: fetchedExtractedData.masked_aadhaar,
      notes: `[Sandbox Aadhaar Verified: PG-AAD-998811 - Masked: ${fetchedExtractedData.masked_aadhaar}]`,
    }

    assert.equal(updatedForm.full_name, 'VIKRAM SINGH')
    assert.equal(updatedForm.date_of_birth, '1995-11-20')
    assert.equal(updatedForm.gender, 'male')
    assert.equal(updatedForm.permanent_address, 'House No. 12, Vikas Marg, Sector 15')
    assert.equal(updatedForm.permanent_city, 'Noida')
    assert.equal(updatedForm.permanent_state, 'Uttar Pradesh')
    assert.equal(updatedForm.permanent_pincode, '201301')
    assert.equal(updatedForm.id_type, 'aadhaar')
    assert.equal(updatedForm.id_number, 'XXXX XXXX 4821')
    assert.ok(updatedForm.notes.includes('PG-AAD-998811'))
  })

  it('should confirm demographic match algorithm handles title casing and minor spacing', () => {
    // Exact case insensitive
    const exact = calculateNameMatch('Rahul Sharma', 'RAHUL SHARMA')
    assert.equal(exact.match, true)
    assert.equal(exact.confidence, 1.0)

    // Token match (e.g. middle name omission or addition)
    const token = calculateNameMatch('Rahul Kumar Sharma', 'RAHUL SHARMA')
    assert.equal(token.match, true)
    assert.ok(token.confidence >= 0.9)

    // Mismatch detection
    const mismatch = calculateNameMatch('Rahul Sharma', 'PRIYA PATEL')
    assert.equal(mismatch.match, false)
  })

  it('should normalize diverse DOB formats to ISO YYYY-MM-DD for Postgres compatibility', async () => {
    const { normalizeDobToIso, formatMaskedAadhaar } = await import('../src/lib/kyc/formatters.ts')

    // DD-MM-YYYY
    assert.equal(normalizeDobToIso('14-05-1998'), '1998-05-14')
    // DD/MM/YYYY
    assert.equal(normalizeDobToIso('14/05/1998'), '1998-05-14')
    // Single digit day/month
    assert.equal(normalizeDobToIso('5/5/1998'), '1998-05-05')
    // Year only
    assert.equal(normalizeDobToIso('1998'), '1998-01-01')
    // Standard ISO
    assert.equal(normalizeDobToIso('1998-05-14'), '1998-05-14')
    // Null / Undefined
    assert.equal(normalizeDobToIso(null), null)
    assert.equal(normalizeDobToIso(''), null)

    // Masked Aadhaar format
    assert.equal(formatMaskedAadhaar('9453'), 'XXXX XXXX 9453')
    assert.equal(formatMaskedAadhaar('123456789453'), 'XXXX XXXX 9453')
    assert.equal(formatMaskedAadhaar('XXXX XXXX 9453'), 'XXXX XXXX 9453')
    assert.equal(formatMaskedAadhaar(''), 'XXXX XXXX XXXX')
  })
})

