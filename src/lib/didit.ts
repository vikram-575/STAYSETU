/**
 * PG-SETU Didit Identity Verification Client
 * Powered by Didit.me Biometric, OCR, and Liveness Protocol
 */

export const DEFAULT_DIDIT_API_KEY = 'wFRcrEBuOox5R1FJM7oKg7HEjd5qDmZ2FN36lVND_C0'
export const DEFAULT_DIDIT_WORKFLOW_ID = 'ee4b245b-e0d5-48c1-ae47-e3c7fa90612b' // Free KYC (OCR + Liveness + Face Match + IP Analysis)

export function getDiditApiKey(): string {
  return process.env.DIDIT_API_KEY?.trim() || DEFAULT_DIDIT_API_KEY
}

export function getDiditWorkflowId(): string {
  return process.env.DIDIT_WORKFLOW_ID?.trim() || DEFAULT_DIDIT_WORKFLOW_ID
}

export interface DiditSessionInitParams {
  vendorData?: string
  callbackUrl?: string
  workflowId?: string
}

export interface DiditSessionCreated {
  sessionId: string
  sessionToken: string
  url: string
  status: string
  workflowId: string
}

export interface DiditExtractedPerson {
  isApproved: boolean
  isPending: boolean
  isDeclined: boolean
  status: string
  verificationId: string
  fullName?: string
  idNumber?: string
  idType?: string // 'aadhaar' | 'pan' | 'passport' | 'driving_licence' | 'voter_id' | 'other'
  rawDocumentType?: string
  dateOfBirth?: string
  gender?: string
  country?: string
  faceMatchScore?: number
  faceMatchStatus?: string
  livenessStatus?: string
  documentFrontUrl?: string
  portraitUrl?: string
}

/**
 * Creates a new Didit identity verification session
 */
export async function createDiditSession(params: DiditSessionInitParams = {}): Promise<DiditSessionCreated> {
  const apiKey = getDiditApiKey()
  const workflowId = params.workflowId || getDiditWorkflowId()

  const payload: any = {
    workflow_id: workflowId,
    vendor_data: params.vendorData || `tenant_${Date.now()}`,
  }

  if (params.callbackUrl) {
    payload.callback = params.callbackUrl
  }

  const res = await fetch('https://verification.didit.me/v3/session/', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Failed to create Didit verification session.')
  }

  return {
    sessionId: data.session_id,
    sessionToken: data.session_token,
    url: data.url,
    status: data.status || 'Not Started',
    workflowId: data.workflow_id,
  }
}

/**
 * Fetches the decision & extracted data for an active Didit session
 */
export async function getDiditSessionDecision(sessionId: string): Promise<{
  decision: any
  extracted: DiditExtractedPerson
}> {
  const apiKey = getDiditApiKey()

  const res = await fetch(`https://verification.didit.me/v3/session/${encodeURIComponent(sessionId)}/decision/`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Didit decision API returned ${res.status}: ${errorText}`)
  }

  const decision = await res.json()
  const status = decision.status || 'Not Started'
  const isApproved = status.toLowerCase() === 'approved'
  const isPending =
    status.toLowerCase() === 'not started' ||
    status.toLowerCase() === 'in progress' ||
    status.toLowerCase() === 'in review'
  const isDeclined = status.toLowerCase() === 'declined' || status.toLowerCase() === 'expired'

  // Extract ID document details
  const idDoc = Array.isArray(decision.id_verifications) && decision.id_verifications.length > 0
    ? decision.id_verifications[0]
    : null

  const faceMatch = Array.isArray(decision.face_matches) && decision.face_matches.length > 0
    ? decision.face_matches[0]
    : null

  const liveness = Array.isArray(decision.liveness_checks) && decision.liveness_checks.length > 0
    ? decision.liveness_checks[0]
    : null

  // Determine normalized ID type
  let idType = 'other'
  const rawType = (idDoc?.document_type || '').toLowerCase()
  if (rawType.includes('aadhaar') || rawType.includes('id_card') || rawType.includes('national')) {
    idType = 'aadhaar'
  } else if (rawType.includes('pan')) {
    idType = 'pan'
  } else if (rawType.includes('passport')) {
    idType = 'passport'
  } else if (rawType.includes('driv')) {
    idType = 'driving_licence'
  } else if (rawType.includes('voter')) {
    idType = 'voter_id'
  }

  const extracted: DiditExtractedPerson = {
    isApproved,
    isPending,
    isDeclined,
    status,
    verificationId: `DIDIT-${sessionId.substring(0, 8).toUpperCase()}`,
    fullName: idDoc?.full_name || (idDoc?.first_name ? `${idDoc.first_name} ${idDoc.last_name || ''}`.trim() : undefined),
    idNumber: idDoc?.document_number || undefined,
    idType,
    rawDocumentType: idDoc?.document_type,
    dateOfBirth: idDoc?.date_of_birth,
    gender: idDoc?.gender?.toLowerCase(),
    country: idDoc?.country,
    faceMatchScore: faceMatch?.similarity,
    faceMatchStatus: faceMatch?.status,
    livenessStatus: liveness?.status,
    documentFrontUrl: idDoc?.front_image_url,
    portraitUrl: idDoc?.portrait_image_url,
  }

  return { decision, extracted }
}
