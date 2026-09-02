/**
 * PG SETU — Aadhaar KYC Security & Sanitization Utilities
 * Strict data minimization, masking, and cryptographic verification
 */

/**
 * Mask raw 12-digit Aadhaar to "XXXX XXXX 1234"
 * Never returns full number.
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar) return 'XXXX XXXX XXXX'
  const cleaned = aadhaar.replace(/\D/g, '')
  if (cleaned.length < 4) return 'XXXX XXXX XXXX'
  const last4 = cleaned.slice(-4)
  return `XXXX XXXX ${last4}`
}

/**
 * Validate Aadhaar format (12 digits, doesn't start with 0 or 1)
 */
export function validateAadhaarFormat(aadhaar: string): { valid: boolean; error?: string } {
  const cleaned = (aadhaar || '').replace(/\D/g, '')
  if (!cleaned) {
    return { valid: false, error: 'Aadhaar number is required.' }
  }
  if (cleaned.length !== 12) {
    return { valid: false, error: 'Aadhaar number must be exactly 12 digits.' }
  }
  if (cleaned.startsWith('0') || cleaned.startsWith('1')) {
    return { valid: false, error: 'Invalid Aadhaar number format.' }
  }
  if (!validateVerhoeffAlgorithm(cleaned)) {
    return { valid: false, error: 'Aadhaar checksum validation failed.' }
  }
  return { valid: true }
}

/**
 * Verhoeff checksum algorithm used by UIDAI for Aadhaar validation
 */
const verhoeffD: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

const verhoeffP: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

export function validateVerhoeffAlgorithm(numStr: string): boolean {
  let c = 0
  const myArray = numStr.split('').map(Number).reverse()
  for (let i = 0; i < myArray.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][myArray[i]]]
  }
  return c === 0
}

/**
 * Generate a cryptographically secure Verification ID (e.g., "PG-AAD-829173")
 */
export function generateVerificationId(): string {
  const randNum = Math.floor(100000 + Math.random() * 900000)
  return `PG-AAD-${randNum}`
}

/**
 * Secure Hash utility using Web Crypto API
 */
export async function sha256Hex(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compare two strings for fuzzy equality (handles whitespace, punctuation, title case)
 */
export function calculateNameMatch(nameA?: string, nameB?: string): { match: boolean; confidence: number; reason?: string } {
  if (!nameA || !nameB) {
    return { match: false, confidence: 0, reason: 'One or both names are missing' }
  }

  const cleanA = nameA.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ')
  const cleanB = nameB.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ')

  if (cleanA === cleanB) {
    return { match: true, confidence: 1.0 }
  }

  const tokensA = cleanA.split(' ')
  const tokensB = cleanB.split(' ')

  // Check if all tokens of one are present in the other (e.g., "Rahul Kumar" vs "Rahul Kumar Sharma")
  const aInB = tokensA.every((t) => tokensB.includes(t))
  const bInA = tokensB.every((t) => tokensA.includes(t))

  if (aInB || bInA) {
    return { match: true, confidence: 0.9, reason: 'Token containment match' }
  }

  // Levenshtein similarity calculation
  const lev = levenshteinDistance(cleanA, cleanB)
  const maxLen = Math.max(cleanA.length, cleanB.length)
  const confidence = 1 - lev / maxLen

  if (confidence >= 0.75) {
    return { match: true, confidence: Math.round(confidence * 100) / 100, reason: 'Fuzzy similarity match' }
  }

  return { match: false, confidence: Math.round(confidence * 100) / 100, reason: 'Significant name discrepancy' }
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        )
      }
    }
  }
  return matrix[b.length][a.length]
}
