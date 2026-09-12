'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Building2,
  PlusCircle,
  KeyRound,
  LogIn,
  Menu,
  X,
  ShieldCheck,
  Search,
  Sparkles,
  GitCompare,
  Heart,
  PhoneCall,
  Megaphone,
  LogOut,
} from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'

interface MarketplaceNavbarProps {
  onOpenListModal: () => void
  savedCount?: number
  compareCount?: number
  onOpenCompare?: () => void
  onScrollToSection?: (sectionId: string) => void
}

export function MarketplaceNavbar({
  onOpenListModal,
  savedCount = 0,
  compareCount = 0,
  onOpenCompare,
  onScrollToSection,
}: MarketplaceNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const { content } = useWebsiteContent()
  const announcement = content?.announcement

  // Check login state on mount
  useEffect(() => {
    let isMounted = true
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.user) {
            setCurrentUser(data.user)
          }
        }
      } catch {} finally {
        if (isMounted) setLoadingUser(false)
      }
    }
    checkAuth()
    return () => {
      isMounted = false
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    setCurrentUser(null)
    window.location.href = '/'
  }

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false)
    if (onScrollToSection) {
      onScrollToSection(sectionId)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      {/* Top Announcement Bar */}
      {announcement?.enabled && announcement?.text && (
        <aside aria-label="Announcement" className="relative z-50 bg-gradient-to-r from-[#14532D] via-[#166534] to-[#14532D] text-white text-xs px-4 py-2 border-b border-[#16A34A]/30">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              {announcement.badge && (
                <span className="rounded-full bg-[#FEF3C7] text-[#14532D] font-black text-[10px] px-2 py-0.5 uppercase tracking-wider shrink-0">
                  {announcement.badge}
                </span>
              )}
              <span className="font-medium truncate text-gray-100">
                {announcement.text}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {announcement.linkText && (
                <Link
                  href={announcement.linkUrl || '/#featured-properties'}
                  className="font-bold text-[#DCFCE7] hover:text-white underline text-xs"
                >
                  {announcement.linkText} →
                </Link>
              )}
            </div>
          </div>
        </aside>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-sm ring-2 ring-[#DCFCE7] transition group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#14532D]">PGSetu</span>
              <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-semibold text-[#14532D]">
                Verified
              </span>
            </div>
            <span className="text-[11px] font-medium text-[#647067]">PG & Flat Rental Marketplace</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-7 md:flex">
          <button
            onClick={() => handleNavClick('featured-properties')}
            className="text-sm font-medium text-[#17211B] transition hover:text-[#16A34A]"
          >
            Explore Spaces
          </button>
          <button
            onClick={() => handleNavClick('popular-cities')}
            className="text-sm font-medium text-[#647067] transition hover:text-[#16A34A]"
          >
            Popular Cities
          </button>
          <Link
            href="/software"
            className="text-sm font-medium text-[#14532D] font-bold transition hover:text-[#16A34A] flex items-center gap-1"
          >
            <span>ERP Software</span>
            <span className="rounded-sm bg-[#FEF3C7] px-1 py-0.2 text-[9px] font-black text-[#F59E0B]">PRO</span>
          </Link>
          <button
            onClick={() => handleNavClick('trust-section')}
            className="text-sm font-medium text-[#647067] transition hover:text-[#16A34A]"
          >
            Trust & Safety
          </button>
          <button
            onClick={() => handleNavClick('why-choose-us')}
            className="text-sm font-medium text-[#647067] transition hover:text-[#16A34A]"
          >
            Why PGSetu
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Compare Badge */}
          {compareCount > 0 && (
            <button
              onClick={onOpenCompare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#17211B] shadow-xs hover:border-[#16A34A] hover:text-[#16A34A] transition"
            >
              <GitCompare className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>Compare</span>
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#16A34A] text-[10px] text-white">
                {compareCount}
              </span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* User Avatar and Name -> My Profile */}
              <Link
                href="/my-profile"
                className="flex items-center gap-2 rounded-xl border border-gray-200/90 bg-[#F7FAF7] px-3 py-1.5 hover:border-[#16A34A] transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#14532D] text-xs font-bold text-white ring-2 ring-[#DCFCE7]">
                  {(currentUser.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#17211B] max-w-[110px] truncate">
                    {currentUser.full_name || 'My Account'}
                  </span>
                  <span className="text-[10px] font-semibold text-[#16A34A] capitalize">
                    {currentUser.role === 'owner' || currentUser.role === 'superadmin' ? 'Owner' : 'Verified Member'}
                  </span>
                </div>
              </Link>

              {/* Direct Role Action Button */}
              {currentUser.role === 'owner' || currentUser.role === 'superadmin' || currentUser.role === 'manager' ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#14532D] bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#16A34A] bg-[#DCFCE7] px-3.5 py-2 text-xs font-bold text-[#14532D] shadow-xs hover:bg-emerald-100 transition"
                >
                  <KeyRound className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>My Stay</span>
                </Link>
              )}

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Unified Mobile-First Sign In / Join CTA */}
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-[#17211B] shadow-2xs hover:bg-[#F7FAF7] hover:border-[#16A34A] transition"
              >
                <LogIn className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Sign In / Join</span>
              </Link>

              {/* List Your Property CTA Button */}
              <button
                onClick={onOpenListModal}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-98 transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>List Your Property</span>
                <span className="rounded-full bg-[#DCFCE7]/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#DCFCE7]">
                  Free
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          {compareCount > 0 && (
            <button
              onClick={onOpenCompare}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#16A34A] relative"
              aria-label="Compare properties"
            >
              <GitCompare className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#16A34A] text-[9px] text-white">
                {compareCount}
              </span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-gray-200 bg-white px-4 pt-3 pb-6 shadow-xl md:hidden animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleNavClick('featured-properties')}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#17211B] hover:bg-gray-50"
            >
              <span>Explore Spaces</span>
              <Search className="h-4 w-4 text-[#647067]" />
            </button>
            <button
              onClick={() => handleNavClick('popular-cities')}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#17211B] hover:bg-gray-50"
            >
              <span>Popular Cities</span>
              <Building2 className="h-4 w-4 text-[#647067]" />
            </button>
            <Link
              href="/software"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-bold text-[#14532D] bg-[#DCFCE7]/40 hover:bg-[#DCFCE7]"
            >
              <div className="flex items-center gap-1.5">
                <span>PG Management ERP</span>
                <span className="rounded-sm bg-[#FEF3C7] px-1 py-0.2 text-[9px] font-black text-[#F59E0B]">PRO</span>
              </div>
              <Sparkles className="h-4 w-4 text-[#16A34A]" />
            </Link>
            <button
              onClick={() => handleNavClick('trust-section')}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#17211B] hover:bg-gray-50"
            >
              <span>Trust & Safety</span>
              <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
            </button>
            <button
              onClick={() => handleNavClick('why-choose-us')}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#17211B] hover:bg-gray-50"
            >
              <span>Why PGSetu</span>
              <Sparkles className="h-4 w-4 text-[#F59E0B]" />
            </button>

            <div className="my-2 border-t border-gray-200" />

            {currentUser ? (
              <div className="flex flex-col gap-2">
                <Link
                  href="/my-profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-[#F7FAF7] p-3 border border-gray-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14532D] text-xs font-bold text-white">
                    {(currentUser.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{currentUser.full_name || 'My Profile'}</div>
                    <div className="text-[10px] text-[#16A34A] font-medium">Manage Profile & Stays →</div>
                  </div>
                </Link>

                {currentUser.role === 'owner' || currentUser.role === 'superadmin' || currentUser.role === 'manager' ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#14532D] py-3 text-sm font-bold text-white shadow-sm"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Go to Owner Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    href="/portal"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#DCFCE7] py-3 text-sm font-bold text-[#14532D] shadow-sm"
                  >
                    <KeyRound className="h-4 w-4 text-[#16A34A]" />
                    <span>Open Tenant Passbook</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-3 text-sm font-bold text-[#17211B] shadow-2xs hover:bg-[#F7FAF7]"
                >
                  <LogIn className="h-4 w-4 text-[#16A34A]" />
                  <span>Sign In / Join</span>
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenListModal()
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>List Your Property Free</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  )
}
