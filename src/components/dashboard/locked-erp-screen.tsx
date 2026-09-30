'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Lock,
  Building2,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  Clock,
  Sparkles,
  ExternalLink,
  LogOut,
  UserCheck,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface LockedErpScreenProps {
  owner: {
    id?: string
    full_name?: string
    phone?: string | null
    email?: string | null
    role?: string
    city?: string | null
    [key: string]: any
  }
}

export default function LockedErpScreen({ owner }: LockedErpScreenProps) {
  const [checking, setChecking] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [unlockedSuccess, setUnlockedSuccess] = useState(false)

  const formattedPhone = owner.phone ? owner.phone.replace(/\D/g, '').slice(-10) : ''
  const whatsappUrl = `https://wa.me/919453522757?text=${encodeURIComponent(
    `Hello Operations Team, I registered as a PG Owner on PGSetu (Name: ${owner.full_name || 'Owner'}, Mobile: +91 ${formattedPhone}). Please complete my onboarding and unlock my ERP platform.`
  )}`

  const handleCheckUnlockStatus = async (silent = false) => {
    if (!silent) {
      setChecking(true)
      setStatusMessage(null)
    }

    try {
      const res = await fetch(`/api/auth/session?refresh=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      })
      if (res.ok) {
        const data = await res.json()
        const isUnlocked =
          data.isOwnerUnlocked === true ||
          (data.hostedProperties && data.hostedProperties.length > 0) ||
          data.profile?.erp_unlocked === true

        if (isUnlocked) {
          setUnlockedSuccess(true)
          setStatusMessage('🎉 Your ERP is unlocked! Opening your PG dashboard...')
          document.cookie = 'erp_locked=; Max-Age=0; path=/;'
          document.cookie = 'erp_unlocked=true; path=/;'
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 800)
          return
        }
      }
      if (!silent) {
        setStatusMessage('Your PG onboarding is still awaiting SuperAdmin review. We will notify you once verified.')
      }
    } catch {
      if (!silent) {
        setStatusMessage('Connection check failed. Please tap again.')
      }
    } finally {
      if (!silent) setChecking(false)
    }
  }

  // Auto-poll in background every 6 seconds so if superadmin unlocks, it opens automatically
  useEffect(() => {
    const interval = setInterval(() => {
      handleCheckUnlockStatus(true)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-[#F8FAFC] to-[#F1F5F9] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-2 ring-emerald-100 overflow-hidden p-1">
              <img src="/logo.png" alt="PG-SETU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#14532D] leading-none">PGSetu</span>
              <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase">Owner ERP</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/my-profile"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition border border-gray-200"
            >
              My Profile
            </Link>
            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition border border-red-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero / Content */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
        <div className="max-w-xl w-full">
          {/* Card */}
          <div className="relative rounded-3xl bg-white border-2 border-emerald-100/80 shadow-xl shadow-emerald-950/5 overflow-hidden p-4 sm:p-8">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-[#16A34A] to-[#14532D]" />

            {/* Shield & Lock Badge */}
            <div className="flex flex-col items-center text-center pt-2">
              <div className="relative mb-3 sm:mb-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50 to-emerald-50 border-2 border-amber-200 flex items-center justify-center shadow-inner">
                  <Lock className="h-8 w-8 sm:h-9 sm:w-9 text-amber-600 stroke-[2.2]" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-3 sm:ring-4 ring-white shadow">
                  <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-[11px] sm:text-xs font-bold text-amber-800 mb-2">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 animate-pulse shrink-0" />
                <span>Onboarding Verification Pending</span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">
                ERP Platform Locked
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-md leading-relaxed px-1">
                Welcome to PGSetu, <span className="font-bold text-gray-900">{owner.full_name || 'Owner'}</span>! Your owner profile is registered. Complete setup and unlock is completed by SuperAdmin.
              </p>
            </div>

            {/* Status Alert Banner if checking */}
            {statusMessage && (
              <div
                className={`mt-4 p-3 rounded-2xl text-xs flex items-center gap-2.5 transition-all ${
                  unlockedSuccess
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-amber-50 border border-amber-200 text-amber-900'
                }`}
              >
                {unlockedSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Profile Overview Card */}
            <div className="mt-4 rounded-2xl bg-gray-50/90 border border-gray-200/80 p-3.5 sm:p-4 divide-y divide-gray-200/60 text-xs">
              <div className="flex items-center justify-between pb-2">
                <span className="text-gray-500 font-medium">Owner Name</span>
                <span className="font-bold text-gray-900">{owner.full_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 font-medium">Registered Mobile</span>
                <span className="font-mono font-bold text-gray-900">+91 {formattedPhone || '—'}</span>
              </div>
              {owner.email && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500 font-medium">Email Address</span>
                  <span className="font-medium text-gray-800 truncate max-w-[180px]">{owner.email}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 font-medium">ERP Access</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full text-[11px]">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-500 font-medium">Property Listing on Website</span>
                <span className="inline-flex items-center gap-1 font-bold text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px]">
                  Requires Onboarding
                </span>
              </div>
            </div>

            {/* Why is it locked explanation */}
            <div className="mt-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 p-3 sm:p-4 text-xs text-emerald-950">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-900 block text-xs">Why is my ERP locked?</span>
                  <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                    SuperAdmin configures your building structure, rooms, electricity meters, and staff before unlocking ERP operations. Once completed, your dashboard unlocks instantly!
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2.5">
              {/* PRIMARY ACTION: Check Unlock Status */}
              <button
                onClick={() => handleCheckUnlockStatus(false)}
                disabled={checking || unlockedSuccess}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#14532D] hover:bg-[#166534] active:scale-[0.98] py-3.5 px-4 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-70"
              >
                {checking ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : unlockedSuccess ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                ) : (
                  <RefreshCw className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {unlockedSuccess
                    ? 'Entering Dashboard...'
                    : checking
                    ? 'Verifying Status with Server...'
                    : 'Check Unlock Status & Enter ERP'}
                </span>
              </button>

              {/* WHATSAPP ACTION: Mobile-friendly & Beautiful */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:opacity-95 active:scale-[0.98] py-3 px-4 text-white shadow-md shadow-emerald-950/10 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.101.005.241-.038.375.286.144.347.491 1.2.534 1.288.043.088.072.19.014.305-.058.115-.087.187-.173.289l-.26.309c-.087.086-.18.18-.077.355.103.175.457.755.98 1.222.673.6 1.242.787 1.417.874.175.086.276.072.378-.044.102-.115.434-.506.549-.68.115-.173.231-.144.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.202.043.073.043.42-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.05 22l4.98-1.306A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold truncate">Chat on WhatsApp</span>
                    <span className="text-[10px] text-emerald-100 truncate">Operations & Verification Desk</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold">
                  <span>Chat</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </a>

              {/* Secondary links */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+919453522757"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 px-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition text-center"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">Call Support</span>
                </a>

                <Link
                  href="/my-profile"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 px-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition text-center"
                >
                  <UserCheck className="h-3.5 w-3.5 text-gray-700 shrink-0" />
                  <span className="truncate">My Profile</span>
                </Link>
              </div>
            </div>

            {/* Help Note */}
            <p className="mt-4 text-center text-[11px] text-gray-500 leading-snug">
              Need urgent activation? Call verification desk at{' '}
              <a href="tel:+919453522757" className="font-bold text-gray-700 hover:text-emerald-700 underline">
                +91 94535 22757
              </a>{' '}
              (10 AM – 8 PM).
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
