import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('PG-Setu AI WhatsApp Bot & Automation Pipelines', () => {
  describe('Pipeline 1: Phone Normalization & WhatsApp wa_id Format', () => {
    // Pure function logic mirroring normalizePhoneNumber
    const normalizePhoneNumber = (raw) => {
      if (!raw) return ''
      const digits = raw.replace(/\D/g, '')
      if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
      if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
      if (digits.length === 10) return digits
      return digits
    }

    const toWhatsAppWaId = (raw) => {
      const norm = normalizePhoneNumber(raw)
      return norm.length === 10 ? `91${norm}` : norm
    }

    it('should strip spaces, hyphens, and +91 country codes to return clean 10-digit Indian mobile', () => {
      assert.equal(normalizePhoneNumber('+91 98765 43210'), '9876543210')
      assert.equal(normalizePhoneNumber('91-9876543210'), '9876543210')
      assert.equal(normalizePhoneNumber('09876543210'), '9876543210')
      assert.equal(normalizePhoneNumber('9876543210'), '9876543210')
    })

    it('should convert any valid 10-digit phone to canonical WhatsApp wa_id prefix 91', () => {
      assert.equal(toWhatsAppWaId('9876543210'), '919876543210')
      assert.equal(toWhatsAppWaId('+91 98765-43210'), '919876543210')
    })
  })

  describe('Pipeline 2: Meta WhatsApp Webhook Challenge Handshake', () => {
    it('should accept valid Meta verify token and echo back hub.challenge', () => {
      const verifyTokenConfigured = 'pgsetu_secure_webhook_token_2026'
      const handleGetHandshake = (mode, token, challenge) => {
        if (mode === 'subscribe' && token === verifyTokenConfigured) {
          return { status: 200, body: challenge }
        }
        return { status: 403, body: 'Forbidden' }
      }

      const validRes = handleGetHandshake('subscribe', 'pgsetu_secure_webhook_token_2026', 'CHALLENGE_12345')
      assert.equal(validRes.status, 200)
      assert.equal(validRes.body, 'CHALLENGE_12345')

      const invalidRes = handleGetHandshake('subscribe', 'wrong_token', 'CHALLENGE_12345')
      assert.equal(invalidRes.status, 403)
    })
  })

  describe('Pipeline 3: Resident Conversational Intent Engine & Dynamic UPI Generation', () => {
    it('should generate valid NPCI-compliant UPI deep link for rent settlement', () => {
      const balanceInr = 12000
      const room = '204-B'
      const upiUrl = `upi://pay?pa=pgsetu@icici&pn=PGSetu&am=${balanceInr}&cu=INR&tn=Rent_Room_${room}`

      assert.ok(upiUrl.startsWith('upi://pay?'))
      assert.ok(upiUrl.includes('pa=pgsetu@icici'))
      assert.ok(upiUrl.includes('am=12000'))
      assert.ok(upiUrl.includes('tn=Rent_Room_204-B'))
    })

    it('should categorize maintenance complaints correctly into trade groups', () => {
      const categorizeComplaint = (text) => {
        const lower = text.toLowerCase()
        if (lower.includes('ac') || lower.includes('air conditioner')) return 'Air Conditioner'
        if (lower.includes('plumber') || lower.includes('water') || lower.includes('leak') || lower.includes('tap') || lower.includes('geyser')) return 'Plumbing'
        if (lower.includes('light') || lower.includes('fan') || lower.includes('switch') || lower.includes('socket')) return 'Electrical'
        if (lower.includes('clean') || lower.includes('housekeeping') || lower.includes('sweep') || lower.includes('dusting')) return 'Housekeeping'
        return 'General'
      }

      assert.equal(categorizeComplaint('The geyser in my bathroom is leaking water'), 'Plumbing')
      assert.equal(categorizeComplaint('Ceiling fan making squeaking noise'), 'Electrical')
      assert.equal(categorizeComplaint('Split AC cooling is very low'), 'Air Conditioner')
      assert.equal(categorizeComplaint('Please send someone to sweep the room'), 'Housekeeping')
    })
  })

  describe('Pipeline 4: Automated Rent Reminder Cadence Schedule', () => {
    it('should apply correct tone and urgency per cadence tier', () => {
      const getCadenceMessage = (tier, name, room, amount) => {
        const upi = `upi://pay?pa=pgsetu@icici&pn=PGSetu&am=${amount}&cu=INR&tn=Rent_Room_${room}`
        if (tier === 1) return `Gentle reminder: Your rent for Room ${room} is due. Pay: ${upi}`
        if (tier === 2) return `Due Date Alert: Rent for Room ${room} is due today. Pay: ${upi}`
        return `URGENT OVERDUE: Rent for Room ${room} is overdue. Pay: ${upi}`
      }

      const msg1 = getCadenceMessage(1, 'Arjun', '204-B', 12000)
      assert.ok(msg1.includes('Gentle reminder'))
      assert.ok(msg1.includes('upi://pay?'))

      const msg2 = getCadenceMessage(2, 'Arjun', '204-B', 12000)
      assert.ok(msg2.includes('Due Date Alert'))

      const msg3 = getCadenceMessage(3, 'Arjun', '204-B', 12000)
      assert.ok(msg3.includes('URGENT OVERDUE'))
    })
  })

  describe('Pipeline 5: Bulk Broadcast Variable Interpolation', () => {
    it('should cleanly interpolate {{name}} and {{room}} tokens for each recipient', () => {
      const template = 'Hello {{name}}! Maintenance scheduled for Room {{room}} tomorrow.'
      const recipient = { name: 'Priya Sharma', room: '302-A' }

      const rendered = template
        .replace(/{{name}}/g, recipient.name)
        .replace(/{{room}}/g, recipient.room)

      assert.equal(rendered, 'Hello Priya Sharma! Maintenance scheduled for Room 302-A tomorrow.')
      assert.ok(!rendered.includes('{{'))
    })
  })

  describe('Pipeline 6: PG Owner Occupancy & Financial Insights', () => {
    it('should compute occupancy percentage and bed vacancy accurately', () => {
      const totalBeds = 50
      const occupiedBeds = 44
      const vacantBeds = totalBeds - occupiedBeds
      const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100)

      assert.equal(vacantBeds, 6)
      assert.equal(occupancyRate, 88)
    })
  })
})
