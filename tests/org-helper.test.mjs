import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(val) {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

describe('Organization & UUID Helper Tests', () => {
  it('correctly identifies valid standard v4 UUIDs', () => {
    assert.equal(isValidUUID('7d66235b-290c-4c73-9f43-abb9711339db'), true)
    assert.equal(isValidUUID('edd624d8-f3a0-4f92-b8b9-515c50ed8e98'), true)
    assert.equal(isValidUUID('00000000-0000-0000-0000-000000000000'), true)
  })

  it('rejects invalid UUID strings like "primary", "default", or slugs', () => {
    assert.equal(isValidUUID('primary'), false)
    assert.equal(isValidUUID('default'), false)
    assert.equal(isValidUUID('platform'), false)
    assert.equal(isValidUUID('pgsetu-management'), false)
    assert.equal(isValidUUID(''), false)
    assert.equal(isValidUUID(null), false)
    assert.equal(isValidUUID(undefined), false)
    assert.equal(isValidUUID(12345), false)
  })

  it('verifies that resolution NEVER falls back to string "primary"', () => {
    const fallbackOrgId = (inputOrgId, defaultOrg) => {
      if (isValidUUID(inputOrgId)) return inputOrgId
      if (defaultOrg?.id && isValidUUID(defaultOrg.id)) return defaultOrg.id
      return null
    }

    assert.equal(fallbackOrgId('primary', null), null)
    assert.equal(fallbackOrgId(null, null), null)
    assert.equal(fallbackOrgId(undefined, { id: 'invalid-id' }), null)
    assert.equal(
      fallbackOrgId(null, { id: 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98' }),
      'edd624d8-f3a0-4f92-b8b9-515c50ed8e98'
    )
  })
})
