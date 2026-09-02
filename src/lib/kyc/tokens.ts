/**
 * PG SETU — Remote Tenant KYC Tokens Store
 * Manages short-lived tokenized sessions for WhatsApp/SMS remote KYC verification
 */

export interface RemoteKYCTokenData {
  token: string
  tenant_id?: string
  tenant_name: string
  phone: string
  organization_id: string
  organization_name: string
  status: 'pending' | 'verified' | 'failed'
  current_session_id?: string
  verification_id?: string
  expires_at: string
  created_at: string
}

// In-memory tokens store for remote self-service verification (valid for 48 hours)
export const remoteKYCTokens = new Map<string, RemoteKYCTokenData>()
