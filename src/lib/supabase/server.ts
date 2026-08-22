// Pure Firebase Firestore Service Client (Supabase completely removed)
import { firebaseDb, FirebaseFirestoreClient } from '@/lib/firebase/firestore-client'

export async function createClient(): Promise<FirebaseFirestoreClient> {
  return firebaseDb
}

export async function createServiceClient(): Promise<FirebaseFirestoreClient> {
  return firebaseDb
}
