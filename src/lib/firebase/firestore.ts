import { adminDb } from './admin'

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

// --- HELPER FUNCTIONS ---

export async function getDocument<T = any>(collectionName: string, id: string): Promise<T | null> {
  const doc = await adminDb.collection(collectionName).doc(id).get()
  if (!doc.exists) return null
  return { id: doc.id, ...doc.data() } as T
}

export async function queryCollection<T = any>(
  collectionName: string,
  queries: Array<[string, FirebaseFirestore.WhereFilterOp, any]> = [],
  orderBy?: { field: string; direction?: 'asc' | 'desc' },
  limit?: number
): Promise<T[]> {
  let ref: FirebaseFirestore.Query = adminDb.collection(collectionName)

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
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[]
}

export async function createDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<{ id: string } & T> {
  const now = new Date().toISOString()
  const payload = { ...data, created_at: now, updated_at: now }

  if (customId) {
    await adminDb.collection(collectionName).doc(customId).set(payload)
    return { id: customId, ...payload }
  }

  const docRef = await adminDb.collection(collectionName).add(payload)
  return { id: docRef.id, ...payload }
}

export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const now = new Date().toISOString()
  await adminDb.collection(collectionName).doc(id).update({ ...data, updated_at: now })
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await adminDb.collection(collectionName).doc(id).delete()
}
