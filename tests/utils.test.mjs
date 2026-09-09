import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

function initials(name) {
  if (!name || typeof name !== 'string' || !name.trim()) return 'PG'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  try {
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  try {
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

function buildWhatsAppLink(phone, message) {
  const rawDigits = (phone || '').replace(/\D/g, '')
  const digits = rawDigits.replace(/^0+/, '')
  if (!digits) return `https://wa.me/?text=${encodeURIComponent(message || '')}`
  const intl = digits.startsWith('91') ? digits : `91${digits}`
  return `https://wa.me/${intl}?text=${encodeURIComponent(message || '')}`
}

function buildSmsLink(phone, message) {
  const digits = (phone || '').replace(/\D/g, '')
  return `sms:${digits}?body=${encodeURIComponent(message || '')}`
}

function generateIdempotencyKey() {
  return `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

describe('Utils — Senior QA Test Suite', () => {

  // ==========================================
  // 1. EQUIVALENCE PARTITIONING
  // ==========================================
  describe('Technique 1: Equivalence Partitioning (EP)', () => {
    // Catches initials extraction failure on single-word names (e.g. "Rohan" -> "RO")
    it('[EP] [Valid Class: Single Name] extracts first two characters in uppercase', () => {
      assert.strictEqual(initials('Rohan'), 'RO')
    })

    // Catches initials extraction failure on multi-word names (e.g. "Rahul Sharma" -> "RS")
    it('[EP] [Valid Class: Multi-word Name] takes first letters of first and last words', () => {
      assert.strictEqual(initials('Rahul Dev Sharma'), 'RS')
    })

    // Catches crash when initials is given null, undefined, or empty string
    it('[EP] [Invalid Class: Null/Empty Name] falls back safely to default PG initials', () => {
      assert.strictEqual(initials(null), 'PG')
      assert.strictEqual(initials(undefined), 'PG')
      assert.strictEqual(initials(''), 'PG')
      assert.strictEqual(initials('   '), 'PG')
    })

    // Catches phone number formatting when Indian +91 or country code prefix is missing
    it('[EP] [Valid Class: 10-digit Indian Mobile] formats wa.me link with 91 country code', () => {
      const link = buildWhatsAppLink('9876543210', 'Rent Due Notice')
      assert.strictEqual(link, 'https://wa.me/919876543210?text=Rent%20Due%20Notice')
    })

    // Catches duplicate country code bug when user already included +91 or 91
    it('[EP] [Valid Class: Mobile with Country Code] does not duplicate 91 prefix if already present', () => {
      const link = buildWhatsAppLink('+919876543210', 'Reminder')
      assert.strictEqual(link, 'https://wa.me/919876543210?text=Reminder')
    })
  })

  // ==========================================
  // 2. BOUNDARY VALUE ANALYSIS
  // ==========================================
  describe('Technique 2: Boundary Value Analysis (BVA)', () => {
    // Catches single character name boundary (e.g. "A" -> "A")
    it('[BVA] [Name Min Length: 1 Char] handles single-letter name without out-of-bounds slicing', () => {
      assert.strictEqual(initials('A'), 'A')
    })

    // Catches phone number starting with leading zero (e.g. 09876543210 -> wa.me/919876543210)
    it('[BVA] [Phone Leading Zero Boundary] strips leading zero before prepending country code', () => {
      const link = buildWhatsAppLink('09876543210', 'Test')
      assert.strictEqual(link, 'https://wa.me/919876543210?text=Test')
    })

    // Catches empty phone string boundary in WhatsApp link builder
    it('[BVA] [Phone Empty String Boundary] produces link without invalid phone prefix when phone is empty', () => {
      const link = buildWhatsAppLink('', 'Hello')
      assert.strictEqual(link, 'https://wa.me/?text=Hello')
    })

    // Catches invalid date string boundary ("invalid-date" returning "Invalid Date" in UI)
    it('[BVA] [Invalid Date Boundary] falls back safely to original string without rendering "Invalid Date"', () => {
      assert.strictEqual(formatDate('not-a-date'), 'not-a-date')
      assert.strictEqual(formatDateTime('not-a-date'), 'not-a-date')
    })

    // Catches null / undefined date boundary returning em-dash placeholder
    it('[BVA] [Null Date Boundary] returns em-dash placeholder for null or undefined dates', () => {
      assert.strictEqual(formatDate(null), '—')
      assert.strictEqual(formatDate(undefined), '—')
      assert.strictEqual(formatDateTime(null), '—')
      assert.strictEqual(formatDateTime(undefined), '—')
    })
  })

  // ==========================================
  // 3. DECISION TABLE TESTING
  // ==========================================
  describe('Technique 3: Decision Table Testing', () => {
    // Condition 1: Phone Provided (T/F)
    // Condition 2: Message Provided (T/F)

    // Rule 1: Phone=T, Msg=T -> Formatted URL with phone and encoded query
    it('[Decision Table: Rule 1] Phone: Yes | Message: Yes -> Full wa.me link with encoded text', () => {
      const link = buildWhatsAppLink('9876543210', 'Rent: ₹5,000')
      assert.strictEqual(link, 'https://wa.me/919876543210?text=Rent%3A%20%E2%82%B95%2C000')
    })

    // Rule 2: Phone=T, Msg=F -> wa.me link with empty text param
    it('[Decision Table: Rule 2] Phone: Yes | Message: No -> wa.me link with blank query', () => {
      const link = buildWhatsAppLink('9876543210', '')
      assert.strictEqual(link, 'https://wa.me/919876543210?text=')
    })

    // Rule 3: Phone=F, Msg=T -> wa.me link without phone
    it('[Decision Table: Rule 3] Phone: No | Message: Yes -> wa.me open composer link', () => {
      const link = buildWhatsAppLink('', 'Hello')
      assert.strictEqual(link, 'https://wa.me/?text=Hello')
    })

    // Rule 4: Phone=F, Msg=F -> wa.me open link with blank text
    it('[Decision Table: Rule 4] Phone: No | Message: No -> wa.me open link', () => {
      const link = buildWhatsAppLink('', '')
      assert.strictEqual(link, 'https://wa.me/?text=')
    })
  })

  // ==========================================
  // 4. STATE TRANSITION TESTING
  // ==========================================
  describe('Technique 4: State Transition Testing (Idempotency Key Generation & Uniqueness)', () => {
    // Catches duplicate submission collision bugs where rapid requests generate identical keys
    it('[State Transition: Multiple Consecutive Generations] produces unique, non-colliding keys', () => {
      const keySet = new Set()
      for (let i = 0; i < 100; i++) {
        const key = generateIdempotencyKey()
        assert.ok(key.startsWith('key_'))
        assert.strictEqual(keySet.has(key), false, 'Duplicate idempotency key detected!')
        keySet.add(key)
      }
    })
  })

  // ==========================================
  // 5. ERROR / EXCEPTION PATHS
  // ==========================================
  describe('Technique 5: Error & Exception Paths', () => {
    // Catches special characters and punctuation in phone numbers breaking link creation
    it('[Error Path: Corrupted Phone Numbers] handles non-digit characters in phone safely', () => {
      const link = buildWhatsAppLink('+91 (987) 654-3210', 'Alert')
      assert.strictEqual(link, 'https://wa.me/919876543210?text=Alert')
    })

    // Catches null / undefined inputs to SMS link builder
    it('[Error Path: Null SMS arguments] builds SMS link safely without crashing', () => {
      const link = buildSmsLink(null, null)
      assert.strictEqual(link, 'sms:?body=')
    })

    // Catches non-string inputs to initials helper
    it('[Error Path: Non-string input to initials] returns default PG without TypeError', () => {
      assert.strictEqual(initials(12345), 'PG')
      assert.strictEqual(initials({}), 'PG')
    })
  })
})
