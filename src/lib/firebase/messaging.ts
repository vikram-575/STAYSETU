import { getToken, onMessage, MessagePayload } from 'firebase/messaging'
import { getFirebaseMessaging } from './client'

/**
 * Request Web Push Notification Permission & get FCM Token
 */
export async function requestPushNotificationToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied')
      return null
    }

    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    // Register service worker if supported
    let serviceWorkerRegistration: ServiceWorkerRegistration | undefined
    if ('serviceWorker' in navigator) {
      serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    }

    const token = await getToken(messaging, {
      serviceWorkerRegistration,
    })

    return token
  } catch (err: any) {
    console.warn('[FCM Token Error]:', err?.message || err)
    return null
  }
}

/**
 * Listen for incoming foreground messages
 */
export async function listenToForegroundMessages(
  onMessageReceived: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return null

  return onMessage(messaging, (payload) => {
    onMessageReceived(payload)
  })
}
