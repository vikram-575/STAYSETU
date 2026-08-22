// Pure Firebase Firestore Browser Client (Supabase completely removed)
import { firebaseDb, FirebaseFirestoreClient } from '@/lib/firebase/firestore-client'

export function createClient(): FirebaseFirestoreClient {
  return firebaseDb
}
