import assert from 'node:assert/strict'
import test from 'node:test'

// Dynamic import or require the transpiled/ts-node or import directly
// Since Next.js uses ESM/TS, let's write the test importing from a small compiled helper or run via tsx/node
import { calculateTrustScore, getRenterTier } from '../src/lib/trust-score.ts'

test('First-time user with no stays has score 0 / 100 and New Tenant tier', () => {
  const res = calculateTrustScore([])
  assert.equal(res.score, 0)
  assert.equal(res.scoreFormatted, '0 / 100')
  assert.equal(res.tier, 'New Tenant')
})

test('First-time user with new stay under 30 days has score 0 / 100', () => {
  const refDate = new Date('2026-09-17T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-10', // 7 days ago
      status: 'active',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 0,
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 0)
  assert.equal(res.scoreFormatted, '0 / 100')
  assert.equal(res.tier, 'New Tenant')
})

test('Tenant who completes 1 full month (30+ days) jumps directly to 50 / 100', () => {
  const refDate = new Date('2026-10-16T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-16', // 30 days ago
      status: 'active',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 0,
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 50)
  assert.equal(res.scoreFormatted, '50 / 100')
  assert.equal(res.tier, 'Verified Resident')
})

test('Tenant with 2 completed months (60+ days) increases to 60 / 100', () => {
  const refDate = new Date('2026-11-16T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-16', // 61 days ago
      status: 'active',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 0,
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 60)
  assert.equal(res.scoreFormatted, '60 / 100')
})

test('Tenant with 6+ completed months reaches max 100 / 100', () => {
  const refDate = new Date('2027-04-16T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-16', // 212 days ago (> 6 months)
      status: 'active',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 0,
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 100)
  assert.equal(res.scoreFormatted, '100 / 100')
  assert.equal(res.tier, 'Star Resident')
})

test('Checkout penalty: left after 1 month (30-59 days) decreases by 20', () => {
  const refDate = new Date('2026-11-01T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-01',
      check_out_date: '2026-10-10', // 39 days tenure (1 month completed = 50 pts, minus 20 checkout penalty = 30)
      status: 'completed',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 0,
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 30)
  assert.equal(res.scoreFormatted, '30 / 100')
})

test('Checkout penalty: left after 2 months (60-89 days) decreases by 10', () => {
  const refDate = new Date('2026-12-01T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-01',
      check_out_date: '2026-11-10', // 70 days tenure (2 months completed = 60 pts, minus 10 checkout penalty = 50)
      status: 'completed',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 0,
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 50)
  assert.equal(res.scoreFormatted, '50 / 100')
})

test('Checkout penalty: left after 3 months (90+ days) has 0 decrease', () => {
  const refDate = new Date('2027-01-01T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-01',
      check_out_date: '2026-12-10', // 100 days tenure (3 months completed = 70 pts, minus 0 checkout penalty = 70)
      status: 'completed',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 0,
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 70)
  assert.equal(res.scoreFormatted, '70 / 100')
})

test('Overdue rent penalty deducts 20 points', () => {
  const refDate = new Date('2026-10-16T00:00:00Z')
  const stays = [
    {
      id: 'stay-1',
      room_number: '101',
      check_in_date: '2026-09-16', // 30 days = 50 pts
      status: 'active',
      monthly_rent_paise: 700000,
      total_outstanding_paise: 700000, // overdue rent
    },
  ]
  const res = calculateTrustScore(stays, refDate)
  assert.equal(res.score, 30) // 50 - 20 = 30
})
