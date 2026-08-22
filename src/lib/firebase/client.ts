import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getDatabase, Database } from 'firebase/database'
import { firebaseConfig } from './config'

// Initialize or retrieve Firebase App
function initApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp()
  }
  return initializeApp(firebaseConfig)
}

export const app: FirebaseApp = initApp()
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
export const rtdb: Database = getDatabase(app)

// Browser-safe lazy getters for client-only Firebase features
export async function getFirebaseAnalytics() {
  if (typeof window === 'undefined') return null
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics')
    const supported = await isSupported()
    if (supported) {
      return getAnalytics(app)
    }
  } catch (e) {
    console.warn('[Firebase] Analytics init deferred:', e)
  }
  return null
}

export async function getFirebasePerformance() {
  if (typeof window === 'undefined') return null
  try {
    const { getPerformance } = await import('firebase/performance')
    return getPerformance(app)
  } catch (e) {
    console.warn('[Firebase] Performance init deferred:', e)
  }
  return null
}

export async function getFirebaseMessaging() {
  if (typeof window === 'undefined') return null
  try {
    const { getMessaging, isSupported } = await import('firebase/messaging')
    const supported = await isSupported()
    if (supported) {
      return getMessaging(app)
    }
  } catch (e) {
    console.warn('[Firebase] Messaging init deferred:', e)
  }
  return null
}

export async function getFirebaseRemoteConfig() {
  if (typeof window === 'undefined') return null
  try {
    const { getRemoteConfig, fetchAndActivate, getValue } = await import('firebase/remote-config')
    const rc = getRemoteConfig(app)
    rc.settings.minimumFetchIntervalMillis = 3600000 // 1 hr cache
    rc.defaultConfig = {
      plan_per_bed_rate: 10,
      electricity_unit_rate: 9,
      gst_percentage: 18,
      maintenance_mode: false,
      enable_whatsapp_alerts: true,
      enable_biometric_sync: true,
    }
    await fetchAndActivate(rc).catch(() => {})
    return { rc, getValue }
  } catch (e) {
    console.warn('[Firebase] RemoteConfig init deferred:', e)
  }
  return null
}

export default app
