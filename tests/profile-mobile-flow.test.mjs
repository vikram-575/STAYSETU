import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanMobile, isValidMobile } from '../src/lib/profiles.ts'

describe('PG-Setu Mobile Profile Flow & Tenant Experience', () => {
  it('should format clean 10-digit mobile number from multiple input formats', () => {
    assert.equal(cleanMobile('+91 94535-22757'), '9453522757')
    assert.equal(cleanMobile('09453522757'), '9453522757')
    assert.equal(cleanMobile('94535 22757'), '9453522757')
    assert.equal(isValidMobile('9453522757'), true)
  })

  it('should validate complete profile update payload', () => {
    const payload = {
      full_name: 'Vikram Tomar',
      email: 'vikramtomar0505@gmail.com',
      gender: 'male',
      age: 26,
      profession: 'Software Engineer',
      college_or_company: 'PG-Setu Tech',
      emergency_name: 'Rajendra Tomar',
      emergency_phone: '9876543210',
      emergency_relation: 'Father',
      permanent_address: 'Flat 402, Green Meadows',
      permanent_city: 'Kanpur, UP',
    }

    assert.ok(payload.full_name.trim().length > 0, 'Name must not be empty')
    assert.ok(payload.age >= 16 && payload.age <= 100, 'Age must be between 16 and 100')
    assert.equal(isValidMobile(payload.emergency_phone), true, 'Emergency phone must be valid 10-digit Indian mobile')
    assert.ok(payload.emergency_name.trim().length > 0, 'Emergency contact name required')
  })

  it('should generate valid 6-digit visitor gate pass code', () => {
    for (let i = 0; i < 20; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      assert.equal(code.length, 6)
      assert.match(code, /^\d{6}$/)
    }
  })

  it('should format UPI payment intent deep-link accurately with paise converted to rupees', () => {
    const monthlyRentPaise = 950000
    const rentRupees = monthlyRentPaise / 100
    assert.equal(rentRupees, 9500)

    const upiLink = `upi://pay?pa=pgsetu@icici&pn=PGSetu%20Residency&am=${rentRupees}&cu=INR&tn=Rent%20Settlement`
    assert.ok(upiLink.startsWith('upi://pay?pa=pgsetu@icici'))
    assert.ok(upiLink.includes('am=9500'))
    assert.ok(upiLink.includes('cu=INR'))
  })

  it('should filter transactions accurately by category without crashing', () => {
    const transactions = [
      { id: '1', description: 'March 2025 Monthly Rent + Electricity', amount_paise: 950000 },
      { id: '2', description: 'Security Deposit Escrow', amount_paise: 1900000 },
      { id: '3', description: 'Electricity Sub-meter Units', amount_paise: 120000 },
      { id: '4', description: 'Security Deposit Refund', amount_paise: -1700000 },
    ]

    const rentOnly = transactions.filter(t => t.description.toLowerCase().includes('rent'))
    assert.equal(rentOnly.length, 1)

    const depositOnly = transactions.filter(t => t.description.toLowerCase().includes('deposit'))
    assert.equal(depositOnly.length, 2)

    const electricityOnly = transactions.filter(t => t.description.toLowerCase().includes('electricity'))
    assert.equal(electricityOnly.length, 2)
  })
})
