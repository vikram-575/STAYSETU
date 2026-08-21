import { getAdminDb } from './admin'

/**
 * Collection Reference Constants
 */
export const COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  PROPERTIES: 'properties',
  BUILDINGS: 'buildings',
  FLOORS: 'floors',
  ROOMS: 'rooms',
  BEDS: 'beds',
  RESIDENTS: 'residents',
  RESIDENT_ASSIGNMENTS: 'resident_assignments',
  INVOICES: 'invoices',
  INVOICE_ITEMS: 'invoice_items',
  PAYMENTS: 'payments',
  ELECTRICITY_METERS: 'electricity_meters',
  ELECTRICITY_READINGS: 'electricity_readings',
  EXPENSES: 'expenses',
  DEPOSITS: 'deposits',
  MESSAGES: 'messages',
  TEMPLATES: 'message_templates',
} as const

// --- SAFE HELPER FUNCTIONS ---

export async function getDocument<T = any>(collectionName: string, id: string): Promise<T | null> {
  try {
    const db = getAdminDb()
    if (!db) return null
    const doc = await db.collection(collectionName).doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() } as T
  } catch (err: any) {
    console.warn(`[Firestore getDocument error in ${collectionName}/${id}]:`, err?.message)
    return null
  }
}

export async function queryCollection<T = any>(
  collectionName: string,
  queries: Array<[string, any, any]> = [],
  orderBy?: { field: string; direction?: 'asc' | 'desc' },
  limit?: number
): Promise<T[]> {
  try {
    const db = getAdminDb()
    if (!db) return []

    let ref: any = db.collection(collectionName)

    for (const [field, op, val] of queries) {
      ref = ref.where(field, op, val)
    }

    if (orderBy) {
      ref = ref.orderBy(orderBy.field, orderBy.direction || 'asc')
    }

    if (limit) {
      ref = ref.limit(limit)
    }

    const snapshot = await ref.get()
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as T[]
  } catch (err: any) {
    console.warn(`[Firestore queryCollection error in ${collectionName}]:`, err?.message)
    return []
  }
}

export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<{ id: string } & T> {
  const now = new Date().toISOString()
  const payload = { ...data, created_at: now, updated_at: now }

  try {
    const db = getAdminDb()
    if (!db) {
      const generatedId = customId || 'id_' + Math.random().toString(36).substring(2, 9)
      return { id: generatedId, ...payload }
    }

    if (customId) {
      await db.collection(collectionName).doc(customId).set(payload)
      return { id: customId, ...payload }
    }

    const docRef = await db.collection(collectionName).add(payload)
    return { id: docRef.id, ...payload }
  } catch (err: any) {
    console.warn(`[Firestore createDocument warning in ${collectionName}]:`, err?.message)
    const generatedId = customId || 'id_' + Math.random().toString(36).substring(2, 9)
    return { id: generatedId, ...payload }
  }
}

export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  try {
    const db = getAdminDb()
    if (!db) return
    const now = new Date().toISOString()
    await db.collection(collectionName).doc(id).update({ ...data, updated_at: now })
  } catch (err: any) {
    console.warn(`[Firestore updateDocument warning in ${collectionName}/${id}]:`, err?.message)
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const db = getAdminDb()
    if (!db) return
    await db.collection(collectionName).doc(id).delete()
  } catch (err: any) {
    console.warn(`[Firestore deleteDocument warning in ${collectionName}/${id}]:`, err?.message)
  }
}
