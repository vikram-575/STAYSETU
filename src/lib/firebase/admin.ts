import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp()
  }

  // If service account JSON is provided in env, use it. Otherwise use default projectId
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey)
      return initializeApp({
        credential: cert(parsed),
        projectId: 'staysetu-1bf2f',
        storageBucket: 'staysetu-1bf2f.firebasestorage.app',
      })
    } catch {
      // Fallback
    }
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'staysetu-1bf2f',
    storageBucket: 'staysetu-1bf2f.firebasestorage.app',
  })
}

const adminApp = getAdminApp()

export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
export const adminStorage = getStorage(adminApp)
export default adminApp
