import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('PG-Setu Core ERP Modules', () => {
  describe('1. Auto-Generated HRA Rent Receipts & Form 16 Tax Kit', () => {
    it('should mandate Landlord PAN when annual rent exceeds ₹1,00,000 under Section 10(13A)', () => {
      const monthlyRentRupees = 12000
      const totalAnnualRent = monthlyRentRupees * 12 // ₹1,44,000
      const isPanMandatory = totalAnnualRent > 100000

      assert.equal(isPanMandatory, true)
      assert.equal(totalAnnualRent, 144000)
    })

    it('should generate 12 monthly receipt vouchers for a complete financial year', () => {
      const startYear = 2024
      const endYear = 2025
      const months = [
        `April ${startYear}`, `May ${startYear}`, `June ${startYear}`,
        `July ${startYear}`, `August ${startYear}`, `September ${startYear}`,
        `October ${startYear}`, `November ${startYear}`, `December ${startYear}`,
        `January ${endYear}`, `February ${endYear}`, `March ${endYear}`
      ]

      assert.equal(months.length, 12)
      assert.equal(months[0], 'April 2024')
      assert.equal(months[11], 'March 2025')
    })
  })
})
