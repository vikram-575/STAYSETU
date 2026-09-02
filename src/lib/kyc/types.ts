/**
 * PG SETU — Tenant Aadhaar Verification & KYC Module
 * Types and Data Contracts
 */

export type VerificationStatus = 'verified' | 'not_verified' | 'unable_to_verify' | 'pending' | 'not_started'

export type VerificationMethod = 'authorized_otp' | 'secure_qr' | 'digilocker_ekyc' | 'biometric' | 'offline_xml'

export type CheckType =
  | 'authentication'
  | 'document'
  | 'secure_qr'
  | 'digital_signature'
  | 'data_match'
  | 'tampering_check'
  | 'face_liveness'

export type CheckStatus = 'passed' | 'failed' | 'unable_to_verify' | 'skipped'

export interface KYCCheckItem {
  id: string
  kyc_id: string
  check_type: CheckType
  status: CheckStatus
  title: string
  reason?: string
  checked_at: string
  engine_version: string
}

export interface AadhaarExtractedData {
  masked_aadhaar: string // e.g., "XXXX XXXX 4821"
  name?: string
  date_of_birth?: string // YYYY-MM-DD
  gender?: 'M' | 'F' | 'O'
  care_of?: string
  address?: {
    house?: string
    street?: string
    landmark?: string
    locality?: string
    vtc?: string
    district?: string
    state?: string
    pincode?: string
    full_address?: string
  }
  photo_base64?: string
  signature_verified: boolean
  qr_verified: boolean
  generated_at?: string
}

export interface TenantKYCRecord {
  id: string
  tenant_id?: string
  organization_id: string
  verification_id: string // e.g., "PG-AAD-829173"
  verification_status: VerificationStatus
  verification_method: VerificationMethod
  masked_identifier: string // e.g., "XXXX XXXX 4821"
  provider: string // e.g., "Setu GSP Authorized" | "Sandbox Mock Simulator"
  tenant_name?: string
  name_match_status?: 'match' | 'partial' | 'mismatch' | 'not_checked'
  dob_match_status?: 'match' | 'mismatch' | 'not_checked'
  gender_match_status?: 'match' | 'mismatch' | 'not_checked'
  verified_at?: string
  risk_level: 'low' | 'medium' | 'high'
  checks: KYCCheckItem[]
  audit_logs: KYCAuditLogEntry[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface KYCSession {
  id: string
  tenant_id?: string
  organization_id: string
  verification_id: string
  session_token: string
  session_token_hash: string
  provider: string
  status: 'initiated' | 'otp_sent' | 'authenticated' | 'completed' | 'expired' | 'failed'
  tenant_details?: {
    full_name?: string
    phone?: string
    room_number?: string
    bed_number?: string
  }
  extracted_data?: AadhaarExtractedData
  checks?: KYCCheckItem[]
  expires_at: string
  created_at: string
}

export interface KYCAuditLogEntry {
  id: string
  organization_id: string
  tenant_id?: string
  kyc_id?: string
  event:
    | 'KYC_STARTED'
    | 'AUTHENTICATION_REQUESTED'
    | 'OTP_SENT'
    | 'OTP_VERIFICATION_ATTEMPT'
    | 'AUTHENTICATION_SUCCESS'
    | 'AUTHENTICATION_FAILED'
    | 'DOCUMENT_RECEIVED'
    | 'QR_VERIFICATION_SUCCESS'
    | 'QR_VERIFICATION_FAILED'
    | 'SIGNATURE_VERIFICATION_SUCCESS'
    | 'SIGNATURE_VERIFICATION_FAILED'
    | 'DATA_MATCH_SUCCESS'
    | 'DATA_MATCH_MISMATCH'
    | 'TAMPERING_CHECK_PASSED'
    | 'TAMPERING_CHECK_FLAGGED'
    | 'KYC_VERIFIED'
    | 'KYC_FAILED'
    | 'KYC_UNABLE_TO_VERIFY'
    | 'VERIFICATION_REPORT_DOWNLOADED'
    | 'REMOTE_LINK_GENERATED'
  actor: string // e.g. "PG Owner (Vikram)" | "Tenant (Rahul Kumar)" | "System Engine"
  timestamp: string
  metadata?: Record<string, any>
}

export interface StartAuthRequest {
  tenant_id?: string
  organization_id: string
  aadhaar_number: string // 12 digits - immediately sanitized and masked
  tenant_name?: string
  tenant_phone?: string
  tenant_dob?: string
  tenant_gender?: string
}

export interface StartAuthResponse {
  success: boolean
  session_id: string
  verification_id: string
  masked_aadhaar: string
  status: 'otp_sent' | 'authenticated' | 'error'
  message: string
  expires_in_seconds: number
  is_demo_mode?: boolean
  demo_otp?: string // Only present in explicit development simulation
}

export interface VerifyOtpRequest {
  session_id: string
  otp: string
}

export interface VerifyOtpResponse {
  success: boolean
  verification_id: string
  status: VerificationStatus
  extracted_data?: AadhaarExtractedData
  checks: KYCCheckItem[]
  message: string
  kyc_record?: TenantKYCRecord
}
