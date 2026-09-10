'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminHeader from '@/components/admin/admin-header'
import AdminSidebar, { AdminTabId } from '@/components/admin/admin-sidebar'
import GlobalSearchModal from '@/components/admin/global-search-modal'
import DashboardTab from '@/components/admin/dashboard-tab'
import MarketplaceTab from '@/components/admin/marketplace-tab'
import StructureTab from '@/components/admin/structure-tab'
import ResidentsTab from '@/components/admin/residents-tab'
import OwnersTab from '@/components/admin/owners-tab'
import MoneyCenterTab from '@/components/admin/money-center-tab'
import SafetyTab from '@/components/admin/safety-tab'
import CommunicationsTab from '@/components/admin/communications-tab'
import SystemHealthTab from '@/components/admin/system-health-tab'
import UsersTab from '@/components/admin/users-tab'
import { Loader2 } from 'lucide-react'

function AdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = (searchParams.get('tab') as AdminTabId) || 'dashboard'
  const [currentTab, setCurrentTab] = useState<AdminTabId>(initialTab)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Omnisearch Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [extraSearchQuery, setExtraSearchQuery] = useState('')

  // Sync tab with URL
  const handleSelectTab = (tab: AdminTabId, extraData?: any) => {
    setCurrentTab(tab)
    if (extraData?.search) {
      setExtraSearchQuery(extraData.search)
    } else {
      setExtraSearchQuery('')
    }
    const params = new URLSearchParams(window.location.search)
    params.set('tab', tab)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  // Load KPI Stats
  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load admin stats', err)
    } finally {
      setLoadingStats(false)
    }
  }

  // Superadmin token check on mount
  useEffect(() => {
    const hasToken = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('superadmin_token='))

    if (!hasToken) {
      // In development or if session is via Supabase metadata, check stats API response
      // which will return 403 if unauthorized.
    }
    loadStats()
  }, [])

  // Sync state if query param changes externally
  useEffect(() => {
    const tabParam = searchParams.get('tab') as AdminTabId
    if (tabParam && tabParam !== currentTab) {
      setCurrentTab(tabParam)
    }
  }, [searchParams])

  const badges = {
    pendingListings: stats?.properties?.pending_listings || 0,
    openComplaints: stats?.activity?.open_complaints || 0,
    pendingKyc: stats?.activity?.pending_verifications || 0,
    activeEnquiries: stats?.activity?.new_enquiries || 0,
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <AdminHeader
        onOpenSearch={() => setIsSearchOpen(true)}
        alertCount={badges.openComplaints + badges.pendingListings}
      />

      {/* Main Body with Sidebar + Tab Content */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sidebar */}
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleSelectTab(tab)}
          badges={badges}
        />

        {/* Dynamic Main Stage */}
        <main className="flex-1 w-full min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardTab
              stats={stats}
              loading={loadingStats}
              onRefresh={loadStats}
              onNavigateTab={(tab) => handleSelectTab(tab)}
            />
          )}

          {currentTab === 'marketplace' && <MarketplaceTab />}

          {currentTab === 'enquiries' && <MarketplaceTab />}

          {currentTab === 'structure' && <StructureTab />}

          {currentTab === 'residents' && <ResidentsTab initialSearch={extraSearchQuery} />}

          {currentTab === 'owners' && <OwnersTab initialSearch={extraSearchQuery} />}

          {currentTab === 'money-center' && <MoneyCenterTab initialSearch={extraSearchQuery} />}

          {currentTab === 'users' && <UsersTab />}

          {currentTab === 'safety' && <SafetyTab />}

          {currentTab === 'communications' && <CommunicationsTab />}

          {currentTab === 'system-health' && <SystemHealthTab />}
        </main>
      </div>

      {/* Omnisearch Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={(tab, extraData) => handleSelectTab(tab, extraData)}
      />

      {/* Control Center Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>© 2026 PG-SETU Platform Enterprise · PropTech Marketplace & Property ERP Control Center</p>
      </footer>
    </div>
  )
}

export default function MasterSuperAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  )
}
