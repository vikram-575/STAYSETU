'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { subscribeToAuth } from '@/lib/firebase/auth'
import { getFirebaseAnalytics, getFirebasePerformance } from '@/lib/firebase/client'
import { requestPushNotificationToken, listenToForegroundMessages } from '@/lib/firebase/messaging'
import { trackPresence, subscribeToOrgPresence, UserPresence } from '@/lib/firebase/realtime'
import { getPlatformRemoteConfig, PlatformConfig } from '@/lib/firebase/remote-config'

interface FirebaseContextType {
  user: User | null
  loading: boolean
  fcmToken: string | null
  onlineUsers: UserPresence[]
  platformConfig: PlatformConfig | null
  requestPushPermission: () => Promise<string | null>
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: true,
  fcmToken: null,
  onlineUsers: [],
  platformConfig: null,
  requestPushPermission: async () => null,
})

export function FirebaseProvider({
  children,
  orgId,
  userProfile,
}: {
  children: React.ReactNode
  orgId?: string
  userProfile?: { id: string; name: string; role: string }
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([])
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null)

  // 1. Auth Subscription & Analytics Init
  useEffect(() => {
    // Init Analytics & Performance
    getFirebaseAnalytics().catch(() => {})
    getFirebasePerformance().catch(() => {})

    // Load Remote Config
    getPlatformRemoteConfig().then(setPlatformConfig)

    // Listen to Auth State
    const unsubscribeAuth = subscribeToAuth((fbUser) => {
      setUser(fbUser)
      setLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  // 2. Realtime Presence Tracking
  useEffect(() => {
    if (!orgId || !userProfile) return

    const cleanupPresence = trackPresence(
      orgId,
      userProfile.id,
      userProfile.name || 'Staff',
      userProfile.role || 'manager'
    )

    const unsubscribeOrgPresence = subscribeToOrgPresence(orgId, (users) => {
      setOnlineUsers(users)
    })

    return () => {
      cleanupPresence()
      unsubscribeOrgPresence()
    }
  }, [orgId, userProfile?.id])

  // 3. Web Push Notification Handlers
  const requestPushPermission = async () => {
    const token = await requestPushNotificationToken()
    if (token) {
      setFcmToken(token)
    }
    return token
  }

  useEffect(() => {
    let cleanupListener: (() => void) | null = null

    listenToForegroundMessages((payload) => {
      console.log('[Foreground Push Received]:', payload)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'PG-SETU Alert', {
          body: payload.notification?.body || 'New notification received.',
          icon: '/icon.png',
        })
      }
    }).then((unsub) => {
      cleanupListener = unsub
    })

    return () => {
      if (cleanupListener) cleanupListener()
    }
  }, [])

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        fcmToken,
        onlineUsers,
        platformConfig,
        requestPushPermission,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseContext)
}
