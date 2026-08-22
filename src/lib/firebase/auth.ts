import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth'
import { auth } from './client'

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass)
  return cred.user
}

/**
 * Register new user with Email, Password & Display Name
 */
export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass)
  if (displayName && cred.user) {
    await fbUpdateProfile(cred.user, { displayName })
  }
  return cred.user
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const result = await signInWithPopup(auth, provider)
  return result.user
}

/**
 * Send Password Reset Email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim())
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await fbSignOut(auth)
}

/**
 * Set up Phone Auth Recaptcha Verifier
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier | null {
  if (typeof window === 'undefined') return null
  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
    })
  } catch (e) {
    console.warn('[Firebase Auth] Recaptcha setup warning:', e)
    return null
  }
}

/**
 * Send Phone OTP
 */
export async function sendPhoneOtp(phoneNumber: string, verifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`
  return await signInWithPhoneNumber(auth, formattedNumber, verifier)
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
