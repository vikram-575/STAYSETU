'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Search, Map, Heart, KeyRound, GitCompare } from 'lucide-react'

interface MobileBottomNavProps {
  savedCount?: number
  compareCount?: number
  onToggleMap?: () => void
  onShowSaved?: () => void
  onOpenCompare?: () => void
  onOpenListModal?: () => void
}

export function MobileBottomNav({
  savedCount = 0,
  compareCount = 0,
  onToggleMap,
  onShowSaved,
  onOpenCompare,
  onOpenListModal,
}: MobileBottomNavProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 py-2 px-3 backdrop-blur-md md:hidden safe-bottom shadow-lg">
      <div className="flex items-center justify-around">
        {/* Home */}
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-[#647067] hover:text-[#16A34A]"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Search PG */}
        <Link
          href="/search"
          className="flex flex-col items-center gap-1 text-[#647067] hover:text-[#16A34A]"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Search PG</span>
        </Link>

        {/* Map View */}
        {onToggleMap && (
          <button
            onClick={onToggleMap}
            className="flex flex-col items-center gap-1 text-[#16A34A] font-semibold"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#14532D]">
              <Map className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Map</span>
          </button>
        )}

        {/* Saved */}
        <button
          onClick={onShowSaved}
          className="relative flex flex-col items-center gap-1 text-[#647067] hover:text-rose-600"
        >
          <Heart className="h-5 w-5" />
          {savedCount > 0 && (
            <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {savedCount}
            </span>
          )}
          <span className="text-[10px] font-medium">Saved</span>
        </button>

        {/* Tenant Portal */}
        <Link
          href="/portal"
          className="flex flex-col items-center gap-1 text-[#647067] hover:text-[#14532D]"
        >
          <KeyRound className="h-5 w-5" />
          <span className="text-[10px] font-medium">Portal</span>
        </Link>
      </div>
    </div>
  )
}
