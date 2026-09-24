/**
 * PG SETU — Aadhaar KYC Provider Interface & Factory
 * Production-ready abstraction for authorized UIDAI GSP / e-KYC providers
 */

import type {
  StartAuthRequest,
  StartAuthResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  AadhaarExtractedData,
} from './types'
import { AuthorizedSandboxProvider } from './providers/authorized-sandbox-provider'
import { SandboxCoInProvider, DEFAULT_SANDBOX_API_KEY, DEFAULT_SANDBOX_API_SECRET } from './providers/sandbox-co-in-provider'



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
 * Defaults to Sandbox.co.in provider configured with live key `key_live_5f51ed66f94447f6aa4de1e62cb0d9e7`.
 */
export function getAadhaarProvider(): AadhaarProvider {
  const sandboxKey = process.env.SANDBOX_API_KEY || DEFAULT_SANDBOX_API_KEY
  const sandboxSecret = process.env.SANDBOX_API_SECRET || DEFAULT_SANDBOX_API_SECRET

  // Return Sandbox.co.in provider with live key
  return new SandboxCoInProvider({
    apiKey: sandboxKey,
    apiSecret: sandboxSecret,
  })
}

