import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

let cachedApp: App | null = null
let cachedAuth: Auth | null = null
let cachedDb: Firestore | null = null
let cachedStorage: Storage | null = null

export function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) {
      return getApp()
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccountKey) {
      try {
        const parsed = JSON.parse(serviceAccountKey)
        cachedApp = initializeApp({
          credential: cert(parsed),
          projectId: 'staysetu-1bf2f',
          storageBucket: 'staysetu-1bf2f.firebasestorage.app',
        })
        return cachedApp
      } catch {}
    }

    // Initialize with projectId if available
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'staysetu-1bf2f'
    cachedApp = initializeApp({
      projectId,
      storageBucket: 'staysetu-1bf2f.firebasestorage.app',
    })
    return cachedApp
  } catch (err: any) {
    console.warn('[Firebase Admin] App init deferred:', err?.message || err)
    return null
  }
}

export function getAdminAuth(): Auth | null {
  if (cachedAuth) return cachedAuth
  try {
    const app = getAdminApp()
    if (!app) return null
    cachedAuth = getAuth(app)
    return cachedAuth
  } catch {
    return null
  }
}

export function getAdminDb(): Firestore | null {
  if (cachedDb) return cachedDb
  try {
    const app = getAdminApp()
    if (!app) return null
    cachedDb = getFirestore(app)
    return cachedDb
  } catch {
    return null
  }
}

export function getAdminStorage(): Storage | null {
  if (cachedStorage) return cachedStorage
  try {
    const app = getAdminApp()
    if (!app) return null
    cachedStorage = getStorage(app)
    return cachedStorage
  } catch {
    return null
  }
}

// Proxy exports to prevent top-level unhandled credential crashes
export const adminAuth = new Proxy({} as Auth, {
  get(_, prop: string | symbol) {
    const instance = getAdminAuth()
    if (!instance) return () => Promise.resolve(null)
    const val = (instance as any)[prop]
    return typeof val === 'function' ? val.bind(instance) : val
  },
})

export const adminDb = new Proxy({} as Firestore, {
  get(_, prop: string | symbol) {
    const instance = getAdminDb()
    if (!instance) {
      return () => ({
        doc: () => ({ get: () => Promise.resolve({ exists: false, data: () => null }), set: () => Promise.resolve(), update: () => Promise.resolve(), delete: () => Promise.resolve() }),
        where: function () { return this },
        orderBy: function () { return this },
        limit: function () { return this },
        get: () => Promise.resolve({ empty: true, docs: [] }),
        add: () => Promise.resolve({ id: 'doc_' + Math.random().toString(36).substring(2, 9) }),
      })
    }
    const val = (instance as any)[prop]
    return typeof val === 'function' ? val.bind(instance) : val
  },
})

export const adminStorage = new Proxy({} as Storage, {
  get(_, prop: string | symbol) {
    const instance = getAdminStorage()
    if (!instance) return () => null
    const val = (instance as any)[prop]
    return typeof val === 'function' ? val.bind(instance) : val
  },
})

export default getAdminApp
