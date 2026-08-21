import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy as fsOrderBy,
  limit as fsLimit,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from './client'

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
} as const

/**
 * Get a single document by ID from Firestore
 */
export async function getDocById<T = any>(collectionName: string, id: string): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as T
  } catch (err: any) {
    console.warn(`[Firestore getDocById: ${collectionName}/${id}]`, err?.message)
    return null
  }
}

/**
 * Query documents from a Firestore collection
 */
export async function queryDocs<T = any>(
  collectionName: string,
  filters: Array<{ field: string; op: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in'; value: any }> = [],
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'asc',
  limitCount?: number
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName)
    const constraints: QueryConstraint[] = []

    for (const f of filters) {
      constraints.push(where(f.field, f.op as any, f.value))
    }

    if (sortField) {
      constraints.push(fsOrderBy(sortField, sortDirection))
    }

    if (limitCount) {
      constraints.push(fsLimit(limitCount))
    }

    const q = query(colRef, ...constraints)
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[]
  } catch (err: any) {
    console.warn(`[Firestore queryDocs: ${collectionName}]`, err?.message)
    return []
  }
}

/**
 * Create a new document in a Firestore collection
 */
export async function createDoc<T extends Record<string, any>>(
  collectionName: string,
  data: T,
  customId?: string
): Promise<{ id: string } & T> {
  const now = new Date().toISOString()
  const payload = { ...data, created_at: now, updated_at: now }

  try {
    if (customId) {
      const docRef = doc(db, collectionName, customId)
      await setDoc(docRef, payload, { merge: true })
      return { id: customId, ...payload }
    }

    const docRef = await addDoc(collection(db, collectionName), payload)
    return { id: docRef.id, ...payload }
  } catch (err: any) {
    console.warn(`[Firestore createDoc: ${collectionName}]`, err?.message)
    const generatedId = customId || 'doc_' + Math.random().toString(36).substring(2, 9)
    return { id: generatedId, ...payload }
  }
}

/**
 * Update an existing document in Firestore
 */
export async function updateDocById<T extends Record<string, any>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id)
    await updateDoc(docRef, { ...data, updated_at: new Date().toISOString() })
  } catch (err: any) {
    console.warn(`[Firestore updateDocById: ${collectionName}/${id}]`, err?.message)
  }
}

/**
 * Delete a document in Firestore
 */
export async function deleteDocById(collectionName: string, id: string): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id)
    await deleteDoc(docRef)
  } catch (err: any) {
    console.warn(`[Firestore deleteDocById: ${collectionName}/${id}]`, err?.message)
  }
}
