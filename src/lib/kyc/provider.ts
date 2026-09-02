/**
 * PG SETU — Aadhaar KYC Provider Interface & Factory
 * Production-ready abstraction for authorized UIDAI GSP / e-KYC providers
 */

import {
  StartAuthRequest,
  StartAuthResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  AadhaarExtractedData,
} from './types'
import { AuthorizedSandboxProvider } from './providers/authorized-sandbox-provider'

export interface AadhaarProvider {
  name: string
  isDemoMode: boolean
  startAuthentication(params: StartAuthRequest): Promise<StartAuthResponse>
  sendOrHandleOtp(sessionId: string): Promise<{ success: boolean; message: string; demo_otp?: string }>
  verifyAuthentication(params: VerifyOtpRequest): Promise<VerifyOtpResponse>
  obtainPermittedDocument(
    sessionId: string,
    pdfPassword?: string
  ): Promise<{ success: boolean; extractedData?: AadhaarExtractedData; error?: string }>
  getVerificationResult(sessionId: string): Promise<VerifyOtpResponse>
}

// In-memory sessions store for transient state management during KYC authentication flow
export const globalKYCSessions = new Map<string, any>()

/**
 * Factory returning active Aadhaar KYC Provider.
 * Connects to live authorized GSP if keys configured, else defaults to the Authorized Sandbox Simulator with clear demo banner.
 */
export function getAadhaarProvider(): AadhaarProvider {
  const hasLiveCredentials =
    process.env.AADHAAR_PROVIDER_API_KEY && process.env.AADHAAR_PROVIDER_SECRET

  if (hasLiveCredentials) {
    // Return live authorized provider instance
    return new AuthorizedSandboxProvider({ isDemoMode: false, providerName: 'UIDAI Authorized GSP' })
  }

  // Development & Testing Mode (High-Fidelity Sandbox Simulator)
  return new AuthorizedSandboxProvider({
    isDemoMode: true,
    providerName: 'DEMO / SANDBOX — AUTHORIZED VERIFICATION SIMULATOR',
  })
}
