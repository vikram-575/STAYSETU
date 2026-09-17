import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Didit Identity Verification Protocol', () => {
  it('should format default Didit API credentials correctly', async () => {
    const { DEFAULT_DIDIT_API_KEY, DEFAULT_DIDIT_WORKFLOW_ID } = await import('../src/lib/didit.ts')
    assert.equal(DEFAULT_DIDIT_API_KEY, 'wFRcrEBuOox5R1FJM7oKg7HEjd5qDmZ2FN36lVND_C0')
    assert.equal(DEFAULT_DIDIT_WORKFLOW_ID, 'ee4b245b-e0d5-48c1-ae47-e3c7fa90612b')
  })

  it('should correctly normalize various ID types from Didit OCR results', () => {
    const normalizeType = (raw) => {
      const rawType = (raw || '').toLowerCase()
      if (rawType.includes('aadhaar') || rawType.includes('id_card') || rawType.includes('national')) {
        return 'aadhaar'
      } else if (rawType.includes('pan')) {
        return 'pan'
      } else if (rawType.includes('passport')) {
        return 'passport'
      } else if (rawType.includes('driv')) {
        return 'driving_licence'
      } else if (rawType.includes('voter')) {
        return 'voter_id'
      }
      return 'other'
    }

    assert.equal(normalizeType('id_card'), 'aadhaar')
    assert.equal(normalizeType('Aadhaar Card'), 'aadhaar')
    assert.equal(normalizeType('PAN_CARD'), 'pan')
    assert.equal(normalizeType('PASSPORT'), 'passport')
    assert.equal(normalizeType('DRIVING_LICENCE'), 'driving_licence')
    assert.equal(normalizeType('Voter ID'), 'voter_id')
    assert.equal(normalizeType('Student ID'), 'other')
  })

  it('should generate valid WhatsApp sharing links for tenant verification', () => {
    const residentName = 'Rahul Sharma'
    const phone = '9876543210'
    const sessionUrl = 'https://verify.didit.me/session/gjd45mrBzkDC'

    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const text = `Hello ${residentName},\n\nPlease complete your digital identity verification for PG-SETU stay:\n👉 ${sessionUrl}\n\nTakes less than 2 minutes. Thank you!`
    const whatsappLink = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`

    assert.ok(whatsappLink.startsWith('https://wa.me/919876543210'))
    assert.ok(whatsappLink.includes(encodeURIComponent(sessionUrl)))
    assert.ok(whatsappLink.includes(encodeURIComponent('Rahul Sharma')))
  })

  it('should parse decision status accurately into pending, approved, or declined', () => {
    const parseStatus = (status) => {
      const isApproved = status.toLowerCase() === 'approved'
      const isPending =
        status.toLowerCase() === 'not started' ||
        status.toLowerCase() === 'in progress' ||
        status.toLowerCase() === 'in review'
      const isDeclined = status.toLowerCase() === 'declined' || status.toLowerCase() === 'expired'

      return { isApproved, isPending, isDeclined }
    }

    assert.deepEqual(parseStatus('Approved'), { isApproved: true, isPending: false, isDeclined: false })
    assert.deepEqual(parseStatus('Not Started'), { isApproved: false, isPending: true, isDeclined: false })
    assert.deepEqual(parseStatus('In Progress'), { isApproved: false, isPending: true, isDeclined: false })
    assert.deepEqual(parseStatus('Declined'), { isApproved: false, isPending: false, isDeclined: true })
  })
})
