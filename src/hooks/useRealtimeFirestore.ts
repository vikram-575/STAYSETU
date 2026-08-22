'use client'

import { useState, useEffect } from 'react'
import {
  collection,
  doc,
  query,
  where,
  orderBy as fsOrderBy,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

/**
 * Realtime hook for a Firestore collection
 */
export function useRealtimeCollection<T = any>(
  collectionName: string,
  filters: Array<{ field: string; op: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in'; value: any }> = [],
  sortField?: string,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const colRef = collection(db, collectionName)
      const constraints: QueryConstraint[] = []

      for (const f of filters) {
        if (f.value !== undefined && f.value !== null) {
          constraints.push(where(f.field, f.op as any, f.value))
        }
      }

      if (sortField) {
        constraints.push(fsOrderBy(sortField, sortDir))
      }

      const q = query(colRef, ...constraints)

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[]
          setData(docs)
          setLoading(false)
        },
        (err) => {
          console.warn(`[useRealtimeCollection: ${collectionName}]`, err.message)
          setError(err.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (e: any) {
      console.warn(`[useRealtimeCollection Error in ${collectionName}]`, e.message)
      setLoading(false)
    }
  }, [collectionName, JSON.stringify(filters), sortField, sortDir])

  return { data, loading, error }
}

/**
 * Realtime hook for a single Firestore document
 */
export function useRealtimeDoc<T = any>(collectionName: string, docId?: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!docId) {
      setLoading(false)
      return
    }

    try {
      const docRef = doc(db, collectionName, docId)
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setData({ id: docSnap.id, ...docSnap.data() } as T)
          } else {
            setData(null)
          }
          setLoading(false)
        },
        (err) => {
          console.warn(`[useRealtimeDoc: ${collectionName}/${docId}]`, err.message)
          setError(err.message)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (e: any) {
      console.warn(`[useRealtimeDoc Error]`, e.message)
      setLoading(false)
    }
  }, [collectionName, docId])

  return { data, loading, error }
}
