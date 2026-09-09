import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

const TEST_SECRET = 'test-resident-portal-secret-key-for-qa-2026'

function signPortalToken(payload, expiresInSeconds = 86400 * 30, secret = TEST_SECRET) {
  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }

  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url')

  return `${payloadB64}.${signature}`
}

function verifyPortalToken(token, secret = TEST_SECRET) {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null

    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url')

    const sigBuf = Buffer.from(signature)
    const expectedBuf = Buffer.from(expectedSignature)
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

describe('Portal Auth — Senior QA Test Suite', () => {

  // ==========================================
  // 1. EQUIVALENCE PARTITIONING
  // ==========================================
  describe('Technique 1: Equivalence Partitioning (EP)', () => {
    // Catches signature verification failure on valid tokens issued with correct key
    it('[EP] [Valid Class: Legitimate Signed Token] generates and successfully verifies legitimate token', () => {
      const payload = { residentId: 'res_123', orgId: 'org_456', phone: '9876543210' }
      const token = signPortalToken(payload)
      const verified = verifyPortalToken(token)

      assert.notStrictEqual(verified, null)
      assert.strictEqual(verified.residentId, 'res_123')
      assert.strictEqual(verified.orgId, 'org_456')
      assert.strictEqual(verified.phone, '9876543210')
    })

    // Catches unauthorized access via tampered payload data (e.g. resident ID tampering attack)
    it('[EP] [Invalid Class: Tampered Payload] rejects token with altered payload data', () => {
      const payload = { residentId: 'res_123', orgId: 'org_456', phone: '9876543210' }
      const token = signPortalToken(payload)
      const parts = token.split('.')

      // Tamper resident ID from res_123 to res_999 (impersonation attempt)
      const forgedPayload = { residentId: 'res_999', orgId: 'org_456', phone: '9876543210', exp: Math.floor(Date.now() / 1000) + 3600 }
      const forgedB64 = Buffer.from(JSON.stringify(forgedPayload)).toString('base64url')
      const forgedToken = `${forgedB64}.${parts[1]}`

      assert.strictEqual(verifyPortalToken(forgedToken), null)
    })

    // Catches tokens signed by foreign/untrusted secrets bypassing authentication
    it('[EP] [Invalid Class: Wrong Secret Signature] rejects token signed with an invalid HMAC secret', () => {
      const payload = { residentId: 'res_123', orgId: 'org_456', phone: '9876543210' }
      const attackerToken = signPortalToken(payload, 3600, 'attacker-secret-key')

      assert.strictEqual(verifyPortalToken(attackerToken), null)
    })

    // Catches malformed string / null / undefined tokens throwing unhandled exceptions
    it('[EP] [Invalid Class: Malformed Token String] rejects null, empty, or non-string tokens gracefully', () => {
      assert.strictEqual(verifyPortalToken(null), null)
      assert.strictEqual(verifyPortalToken(undefined), null)
      assert.strictEqual(verifyPortalToken(''), null)
      assert.strictEqual(verifyPortalToken('not-a-token-with-dot'), null)
    })
  })

  // ==========================================
  // 2. BOUNDARY VALUE ANALYSIS
  // ==========================================
  describe('Technique 2: Boundary Value Analysis (BVA)', () => {
    // Catches clock skew / expiration boundary (token expired 1 second ago)
    it('[BVA] [Exp Boundary: Expired (T-1s)] rejects token expired 1 second in the past', () => {
      const payload = { residentId: 'res_123', orgId: 'org_456', phone: '9876543210' }
      // -1s expiry
      const expiredToken = signPortalToken(payload, -1)
      assert.strictEqual(verifyPortalToken(expiredToken), null)
    })

    // Catches valid token right at edge of expiration window (T+60s)
    it('[BVA] [Exp Boundary: Fresh Token (T+60s)] accepts valid token inside its validity window', () => {
      const payload = { residentId: 'res_123', orgId: 'org_456', phone: '9876543210' }
      const freshToken = signPortalToken(payload, 60)
      const verified = verifyPortalToken(freshToken)
      assert.notStrictEqual(verified, null)
      assert.strictEqual(verified.residentId, 'res_123')
    })

    // Catches timing attack or buffer length mismatch exception in timingSafeEqual
    it('[BVA] [Signature Length Boundary] handles truncated or elongated signature buffers without crashing', () => {
      const payload = { residentId: 'res_123', orgId: 'org_456', phone: '9876543210' }
      const token = signPortalToken(payload)
      const [payloadB64, sig] = token.split('.')

      // Truncated signature buffer
      assert.strictEqual(verifyPortalToken(`${payloadB64}.${sig.slice(0, 10)}`), null)
      // Empty signature buffer
      assert.strictEqual(verifyPortalToken(`${payloadB64}.`), null)
      // Extended signature buffer
      assert.strictEqual(verifyPortalToken(`${payloadB64}.${sig}extra`), null)
    })
  })

  // ==========================================
  // 3. DECISION TABLE TESTING
  // ==========================================
  describe('Technique 3: Decision Table Testing', () => {
    // Condition 1: Signature Valid (T/F)
    // Condition 2: Token Expired (T/F)
    // Condition 3: Payload JSON Valid (T/F)

    // Rule 1: Sig=True, Expired=False, JSON=True -> Output: Valid Payload
    it('[Decision Table: Rule 1] Sig: Valid | Expired: No | JSON: Valid -> Authenticated', () => {
      const token = signPortalToken({ residentId: 'r1', orgId: 'o1', phone: '9876543210' }, 3600)
      const result = verifyPortalToken(token)
      assert.strictEqual(result?.residentId, 'r1')
    })

    // Rule 2: Sig=True, Expired=True, JSON=True -> Output: Null (Session Timeout)
    it('[Decision Table: Rule 2] Sig: Valid | Expired: Yes | JSON: Valid -> Rejected (Expired)', () => {
      const token = signPortalToken({ residentId: 'r1', orgId: 'o1', phone: '9876543210' }, -100)
      const result = verifyPortalToken(token)
      assert.strictEqual(result, null)
    })

    // Rule 3: Sig=False, Expired=False, JSON=True -> Output: Null (Tampered / Forgery)
    it('[Decision Table: Rule 3] Sig: Invalid | Expired: No | JSON: Valid -> Rejected (Forged)', () => {
      const token = signPortalToken({ residentId: 'r1', orgId: 'o1', phone: '9876543210' }, 3600)
      const [p] = token.split('.')
      const result = verifyPortalToken(`${p}.invalidSignatureBase64UrlStringHere1234567890`)
      assert.strictEqual(result, null)
    })

    // Rule 4: Sig=*, Expired=*, JSON=Invalid -> Output: Null (Malformed Corrupted Payload)
    it('[Decision Table: Rule 4] JSON: Corrupted Base64 -> Rejected safely via catch handler', () => {
      const corruptPayloadB64 = Buffer.from('NOT_JSON_DATA').toString('base64url')
      const sig = crypto.createHmac('sha256', TEST_SECRET).update(corruptPayloadB64).digest('base64url')
      const token = `${corruptPayloadB64}.${sig}`
      assert.strictEqual(verifyPortalToken(token), null)
    })
  })

  // ==========================================
  // 4. STATE TRANSITION TESTING
  // ==========================================
  describe('Technique 4: State Transition Testing (Session Lifecycle)', () => {
    // Catches session state regression from Active -> Expired -> Re-authenticated
    it('[State Transition: Active Session -> Expired Session -> Re-issuance]', () => {
      const residentInfo = { residentId: 'res_lifecycle', orgId: 'org_main', phone: '9999988888' }

      // Step 1: Resident logs in with phone / OTP -> Receives active token
      const sessionToken1 = signPortalToken(residentInfo, 2)
      assert.strictEqual(verifyPortalToken(sessionToken1)?.residentId, 'res_lifecycle')

      // Step 2: Session simulated expiration (instant expired token)
      const expiredSessionToken = signPortalToken(residentInfo, -10)
      assert.strictEqual(verifyPortalToken(expiredSessionToken), null)

      // Step 3: Resident re-authenticates -> Receives fresh new session token
      const sessionToken2 = signPortalToken(residentInfo, 3600)
      const verified = verifyPortalToken(sessionToken2)
      assert.notStrictEqual(verified, null)
      assert.strictEqual(verified?.residentId, 'res_lifecycle')
    })
  })

  // ==========================================
  // 5. ERROR / EXCEPTION PATHS
  // ==========================================
  describe('Technique 5: Error & Exception Paths', () => {
    // Catches crash when token has no separator or multiple dots
    it('[Error Path: Multi-dot string] safely handles unexpected segment counts', () => {
      assert.strictEqual(verifyPortalToken('a.b.c.d'), null)
      assert.strictEqual(verifyPortalToken('no_dot_at_all'), null)
    })

    // Catches invalid UTF-8 byte sequences or base64url decode exceptions
    it('[Error Path: Invalid base64url encoding] returns null without throwing uncaught exceptions', () => {
      assert.strictEqual(verifyPortalToken('%%%invalid-b64%%%.signature'), null)
    })

    // Catches null / undefined token passed to signPortalToken
    it('[Error Path: Sign with empty payload] signs empty object without failing', () => {
      const token = signPortalToken({})
      const verified = verifyPortalToken(token)
      assert.notStrictEqual(verified, null)
    })
  })
})
