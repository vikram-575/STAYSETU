'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminHeader, { AdminMode } from '@/components/admin/admin-header'
import AdminSidebar, { AdminTabId } from '@/components/admin/admin-sidebar'
import GlobalSearchModal from '@/components/admin/global-search-modal'
import ErpDashboardTab from '@/components/admin/erp-dashboard-tab'
import RentingDashboardTab from '@/components/admin/renting-dashboard-tab'
import MarketplaceTab from '@/components/admin/marketplace-tab'
import StructureTab from '@/components/admin/structure-tab'
import ResidentsTab from '@/components/admin/residents-tab'
import OwnersTab from '@/components/admin/owners-tab'
import MoneyCenterTab from '@/components/admin/money-center-tab'
import SafetyTab from '@/components/admin/safety-tab'
import CommunicationsTab from '@/components/admin/communications-tab'
import SystemHealthTab from '@/components/admin/system-health-tab'
import UsersTab from '@/components/admin/users-tab'
import WebsiteCmsTab from '@/components/admin/website-cms-tab'
import { Loader2 } from 'lucide-react'

function AdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const modeParam = searchParams.get('mode') as AdminMode
  const initialMode: AdminMode = modeParam === 'renting' ? 'renting' : 'erp'
  const [currentMode, setCurrentMode] = useState<AdminMode>(initialMode)

  const tabParam = (searchParams.get('tab') as AdminTabId) || 'dashboard'
  const [currentTab, setCurrentTab] = useState<AdminTabId>(tabParam)

  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Omnisearch Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [extraSearchQuery, setExtraSearchQuery] = useState('')

  // Handle Mode Switch
  const handleSelectMode = (newMode: AdminMode) => {
    setCurrentMode(newMode)
    setCurrentTab('dashboard')
    setExtraSearchQuery('')

    const params = new URLSearchParams(window.location.search)
    params.set('mode', newMode)
    params.set('tab', 'dashboard')
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  // Handle Tab Switch within current mode
  const handleSelectTab = (tab: AdminTabId, extraData?: any) => {
    setCurrentTab(tab)
    if (extraData?.search) {
      setExtraSearchQuery(extraData.search)
    } else {
      setExtraSearchQuery('')
    }
    const params = new URLSearchParams(window.location.search)
    params.set('mode', currentMode)
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

  useEffect(() => {
    loadStats()
  }, [])

  // Sync state if query param changes externally
  useEffect(() => {
    const extMode = searchParams.get('mode') as AdminMode
    if (extMode && (extMode === 'erp' || extMode === 'renting') && extMode !== currentMode) {
      setCurrentMode(extMode)
    }
    const extTab = searchParams.get('tab') as AdminTabId
    if (extTab && extTab !== currentTab) {
      setCurrentTab(extTab)
    }
  }, [searchParams])

  const badges = {
    pendingListings: stats?.properties?.pending_listings || 0,
    openComplaints: stats?.activity?.open_complaints || 0,
    pendingKyc: stats?.activity?.pending_verifications || 0,
    activeEnquiries: stats?.activity?.new_enquiries || 0,
  }

  const erpBadge = stats?.beds?.occupancy_rate ? `${stats.beds.occupancy_rate}%` : undefined
  const rentingBadge = badges.pendingListings ? `${badges.pendingListings} new` : undefined

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header with Dual-Mode Switcher */}
      <AdminHeader
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        erpBadge={erpBadge}
        rentingBadge={rentingBadge}
      />

      {/* Main Body with Sidebar + Tab Content */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sidebar adapted to currentMode */}
        <AdminSidebar
          currentMode={currentMode}
          currentTab={currentTab}
          onSelectTab={(tab) => handleSelectTab(tab)}
          badges={badges}
        />

        {/* Dynamic Main Stage */}
        <main className="flex-1 w-full min-w-0">
          {/* Dashboard Tab conditioned on currentMode */}
          {currentTab === 'dashboard' && (
            currentMode === 'erp' ? (
              <ErpDashboardTab
                stats={stats}
                loading={loadingStats}
                onRefresh={loadStats}
                onNavigateTab={(tab) => handleSelectTab(tab)}
              />
            ) : (
              <RentingDashboardTab
                stats={stats}
                loading={loadingStats}
                onRefresh={loadStats}
                onNavigateTab={(tab) => handleSelectTab(tab)}
              />
            )
          )}

          {/* Marketplace & Renting Specific Views */}
          {currentTab === 'marketplace' && <MarketplaceTab />}
          {currentTab === 'enquiries' && <MarketplaceTab />}
          {currentTab === 'visits' && <MarketplaceTab />}
          {currentTab === 'promotions' && <MarketplaceTab />}

          {/* ERP Specific Views */}
          {currentTab === 'structure' && <StructureTab />}
          {currentTab === 'residents' && <ResidentsTab initialSearch={extraSearchQuery} />}
          {currentTab === 'owners' && <OwnersTab initialSearch={extraSearchQuery} />}
          {currentTab === 'money-center' && <MoneyCenterTab initialSearch={extraSearchQuery} />}
          {currentTab === 'users' && <UsersTab />}

          {/* Common Cross-Platform Support & Governance */}
          {currentTab === 'safety' && <SafetyTab />}
          {currentTab === 'communications' && <CommunicationsTab />}
          {currentTab === 'system-health' && <SystemHealthTab />}
          {currentTab === 'website-cms' && (
            <WebsiteCmsTab initialSection={searchParams.get('section') || undefined} />
          )}
        </main>
      </div>

      {/* Omnisearch Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={(tab, extraData) => {
          // If searching for listings/enquiries, switch to renting; if residents/owners, switch to erp
          if (['marketplace', 'enquiries', 'visits', 'promotions'].includes(tab)) {
            setCurrentMode('renting')
          } else {
            setCurrentMode('erp')
          }
          handleSelectTab(tab, extraData)
        }}
      />

      {/* Control Center Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>
          © 2026 PG-SETU Platform Enterprise · Dual Control Center ({currentMode === 'erp' ? 'Property ERP' : 'Renting Marketplace'})
        </p>
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
