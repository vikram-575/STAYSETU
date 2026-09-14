'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Search, Heart, KeyRound, User } from 'lucide-react'

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
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 py-2 px-3 backdrop-blur-md md:hidden safe-bottom shadow-lg">
      <div className="flex items-center justify-around">
        {/* Home */}
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-[#647067] hover:text-[#16A34A] transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Search PG */}
        <Link
          href="/search"
          className="flex flex-col items-center gap-1 text-[#647067] hover:text-[#16A34A] transition-colors"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Search PG</span>
        </Link>

        {/* Tenant Portal in Center Slot */}
        <Link
          href="/portal"
          className="flex flex-col items-center gap-1 text-[#14532D] font-semibold"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DCFCE7] text-[#14532D] shadow-xs">
            <KeyRound className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-bold">Portal</span>
        </Link>

        {/* Saved */}
        <button
          onClick={onShowSaved}
          className="relative flex flex-col items-center gap-1 text-[#647067] hover:text-rose-600 transition-colors"
        >
          <Heart className="h-5 w-5" />
          {savedCount > 0 && (
            <span className="absolute -top-1 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {savedCount}
            </span>
          )}
          <span className="text-[10px] font-medium">Saved</span>
        </button>

        {/* User Profile in Rightmost Slot */}
        <Link
          href="/my-profile"
          className="flex flex-col items-center gap-1 text-[#647067] hover:text-[#14532D] transition-colors"
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </div>
  )
}
