'use client'

/**
 * FirebaseProvider — Production Stub
 * Firebase has been fully decommissioned. This is a no-op wrapper to maintain
 * backward compatibility with any components that consume the FirebaseContext.
 * All state values are empty/null — no Firebase SDK calls are made.
 */

import React, { createContext, useContext } from 'react'

interface FirebaseContextType {
  user: null
  loading: boolean
  fcmToken: null
  onlineUsers: []
  platformConfig: null
  requestPushPermission: () => Promise<null>
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  loading: false,
  fcmToken: null,
  onlineUsers: [],
  platformConfig: null,
  requestPushPermission: async () => null,
})

export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode
  orgId?: string
  userProfile?: { id: string; name: string; role: string }
}) {
  return (
    <FirebaseContext.Provider
      value={{
        user: null,
        loading: false,
        fcmToken: null,
        onlineUsers: [],
        platformConfig: null,
        requestPushPermission: async () => null,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseContext)
}
