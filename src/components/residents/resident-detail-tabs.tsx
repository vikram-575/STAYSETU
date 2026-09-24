'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  key: string
  label: string
  content: React.ReactNode
}

interface ResidentDetailTabsProps {
  initialTab?: string
  residentId: string
  tabs: TabItem[]
}

export default function ResidentDetailTabs({ initialTab = 'overview', residentId, tabs }: ResidentDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  // Sync if URL search param changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const tabParam = url.searchParams.get('tab')
      if (tabParam && tabs.some((t) => t.key === tabParam)) {
        setActiveTab(tabParam)
      }
    }
  }, [tabs])

  const handleSelectTab = (key: string) => {
    // 1. Instant state update (0ms latency, no server roundtrip)
    setActiveTab(key)

    // 2. Synchronize URL query parameter without page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', key)
      window.history.replaceState(null, '', url.toString())
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs bar with smooth horizontal scroll */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold w-max select-none shadow-2xs">
          {tabs.map((t) => {
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleSelectTab(t.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer text-left',
                  isActive
                    ? 'bg-white text-blue-700 shadow-xs font-black scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 font-semibold'
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Instant Tab Contents: Keep mounted in DOM for 0ms instant toggle */}
      <div className="min-w-0">
        {tabs.map((t) => (
          <div
            key={t.key}
            className={activeTab === t.key ? 'block animate-in fade-in-50 duration-150' : 'hidden'}
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  )
}
