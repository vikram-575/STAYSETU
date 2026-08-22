import {
  ref,
  set,
  onValue,
  onDisconnect,
  remove,
  get,
  serverTimestamp,
} from 'firebase/database'
import { rtdb } from './client'

export interface UserPresence {
  userId: string
  name: string
  role: string
  orgId: string
  online: boolean
  lastSeen: any
}

/**
 * Track user online presence using Firebase Realtime Database
 */
export function trackPresence(
  orgId: string,
  userId: string,
  userName: string,
  userRole: string
): () => void {
  if (typeof window === 'undefined') return () => {}

  try {
    const userStatusRef = ref(rtdb, `presence/${orgId}/${userId}`)
    const connectedRef = ref(rtdb, '.info/connected')

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(userStatusRef).set({
          userId,
          name: userName,
          role: userRole,
          orgId,
          online: false,
          lastSeen: serverTimestamp(),
        })

        set(userStatusRef, {
          userId,
          name: userName,
          role: userRole,
          orgId,
          online: true,
          lastSeen: serverTimestamp(),
        })
      }
    })

    return () => {
      unsubscribe()
      set(userStatusRef, {
        userId,
        name: userName,
        role: userRole,
        orgId,
        online: false,
        lastSeen: serverTimestamp(),
      }).catch(() => {})
    }
  } catch (err: any) {
    console.warn('[Presence Track Error]', err?.message)
    return () => {}
  }
}

/**
 * Subscribe to online staff/users in an organization
 */
export function subscribeToOrgPresence(
  orgId: string,
  callback: (users: UserPresence[]) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  try {
    const orgPresenceRef = ref(rtdb, `presence/${orgId}`)
    return onValue(orgPresenceRef, (snapshot) => {
      const val = snapshot.val()
      if (!val) {
        callback([])
        return
      }
      const users: UserPresence[] = Object.values(val)
      callback(users)
    })
  } catch {
    return () => {}
  }
}

/**
 * Bed Lock: Prevents double-booking during live check-in
 */
export async function lockBedForCheckin(
  bedId: string,
  orgId: string,
  lockedBy: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const lockRef = ref(rtdb, `bed_locks/${orgId}/${bedId}`)
    const currentLockSnap = await get(lockRef)

    if (currentLockSnap.exists()) {
      const lockData = currentLockSnap.val()
      // If locked within the last 5 minutes by someone else
      if (Date.now() - lockData.timestamp < 300000 && lockData.lockedBy !== lockedBy) {
        return {
          success: false,
          message: `Bed is currently being booked by ${lockData.lockedByName || 'another staff member'}.`,
        }
      }
    }

    // Set lock
    await set(lockRef, {
      bedId,
      lockedBy,
      timestamp: Date.now(),
    })

    // Release lock on disconnect
    onDisconnect(lockRef).remove()

    return { success: true }
  } catch (err: any) {
    console.warn('[Bed Lock Error]', err?.message)
    return { success: true }
  }
}

/**
 * Release Bed Lock
 */
export async function releaseBedLock(bedId: string, orgId: string): Promise<void> {
  try {
    const lockRef = ref(rtdb, `bed_locks/${orgId}/${bedId}`)
    await remove(lockRef)
  } catch (err: any) {
    console.warn('[Bed Release Lock Warning]', err?.message)
  }
}
