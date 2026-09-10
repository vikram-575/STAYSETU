'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  WebsiteContent,
  DEFAULT_WEBSITE_CONTENT,
} from '@/lib/website-content'

interface WebsiteContentContextType {
  content: WebsiteContent
  loading: boolean
  isSaving: boolean
  lastSavedAt: string | null
  updateSection: (sectionKey: keyof WebsiteContent, data: any) => Promise<boolean>
  saveAllContent: (newContent: WebsiteContent) => Promise<boolean>
  resetSection: (sectionKey?: keyof WebsiteContent | 'all') => Promise<boolean>
  refreshContent: () => Promise<void>
}

const WebsiteContentContext = createContext<WebsiteContentContextType>({
  content: DEFAULT_WEBSITE_CONTENT,
  loading: false,
  isSaving: false,
  lastSavedAt: null,
  updateSection: async () => false,
  saveAllContent: async () => false,
  resetSection: async () => false,
  refreshContent: async () => {},
})

const STORAGE_KEY = 'pgsetu_website_cms_cache'
const EVENT_NAME = 'pgsetu_content_updated'

export function WebsiteContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<WebsiteContent>(() => {
    // Initial hydration from localStorage if available in browser
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          return {
            ...DEFAULT_WEBSITE_CONTENT,
            ...JSON.parse(cached),
          }
        }
      } catch {}
    }
    return DEFAULT_WEBSITE_CONTENT
  })
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  // Fetch latest content from API
  const refreshContent = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/website-content', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.content) {
          setContent(data.content)
          setLastSavedAt(data.content.lastUpdated || null)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.content))
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[WebsiteContentContext] Fetch failed, using local/default cache', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshContent()

    // Cross-tab and in-tab listener for real-time live synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setContent(JSON.parse(e.newValue))
        } catch {}
      }
    }

    const handleCustomEvent = (e: any) => {
      if (e.detail?.content) {
        setContent(e.detail.content)
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(EVENT_NAME, handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(EVENT_NAME, handleCustomEvent)
    }
  }, [refreshContent])

  // Save specific section
  const updateSection = async (sectionKey: keyof WebsiteContent, data: any): Promise<boolean> => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/website-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionKey, data }),
      })
      const result = await res.json()
      if (result.success && result.content) {
        setContent(result.content)
        setLastSavedAt(result.content.lastUpdated || new Date().toISOString())
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.content))
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { content: result.content } }))
        } catch {}
        return true
      }
      return false
    } catch (err) {
      console.error('[WebsiteContentContext] Failed to update section', err)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Save all content
  const saveAllContent = async (newContent: WebsiteContent): Promise<boolean> => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/website-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
      const result = await res.json()
      if (result.success && result.content) {
        setContent(result.content)
        setLastSavedAt(result.content.lastUpdated || new Date().toISOString())
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.content))
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { content: result.content } }))
        } catch {}
        return true
      }
      return false
    } catch (err) {
      console.error('[WebsiteContentContext] Failed to save all content', err)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Reset section or all
  const resetSection = async (sectionKey?: keyof WebsiteContent | 'all'): Promise<boolean> => {
    setIsSaving(true)
    try {
      const secParam = sectionKey ? `?section=${sectionKey}` : '?section=all'
      const res = await fetch(`/api/admin/website-content${secParam}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (result.success && result.content) {
        setContent(result.content)
        setLastSavedAt(result.content.lastUpdated || new Date().toISOString())
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.content))
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { content: result.content } }))
        } catch {}
        return true
      }
      return false
    } catch (err) {
      console.error('[WebsiteContentContext] Failed to reset', err)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <WebsiteContentContext.Provider
      value={{
        content,
        loading,
        isSaving,
        lastSavedAt,
        updateSection,
        saveAllContent,
        resetSection,
        refreshContent,
      }}
    >
      {children}
    </WebsiteContentContext.Provider>
  )
}

export function useWebsiteContent() {
  return useContext(WebsiteContentContext)
}
