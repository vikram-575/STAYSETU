'use client'

import React from 'react'
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
  UserCheck
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
  const formattedPhone = owner.phone ? owner.phone.replace(/\D/g, '').slice(-10) : ''
  const whatsappUrl = `https://wa.me/919453522757?text=${encodeURIComponent(
    `Hello SuperAdmin, I registered as a PG Owner on PGSetu (Name: ${owner.full_name || 'Owner'}, Mobile: +91 ${formattedPhone}). Please complete my onboarding and unlock my ERP platform.`
  )}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF4] via-[#F8FAFC] to-[#F1F5F9] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-sm ring-2 ring-emerald-100">
              <Building2 className="h-5 w-5" />
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
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-xl w-full">
          {/* Card */}
          <div className="relative rounded-3xl bg-white border-2 border-emerald-100/80 shadow-xl shadow-emerald-950/5 overflow-hidden p-6 sm:p-8">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-[#16A34A] to-[#14532D]" />

            {/* Shield & Lock Badge */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-50 to-emerald-50 border-2 border-amber-200 flex items-center justify-center shadow-inner">
                  <Lock className="h-9 w-9 text-amber-600 stroke-[2.2]" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-bold text-amber-800 mb-2">
                <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                <span>Onboarding Verification Pending</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                ERP Platform Locked
              </h1>
              <p className="mt-2 text-sm text-gray-600 max-w-md leading-relaxed">
                Welcome to PGSetu, <span className="font-bold text-gray-900">{owner.full_name || 'Owner'}</span>! Your owner profile is registered, but full ERP platform access and property listing are locked until SuperAdmin completes your onboarding.
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className="mt-6 rounded-2xl bg-gray-50/90 border border-gray-200/80 p-4 divide-y divide-gray-200/60 text-xs">
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-gray-500 font-medium">Owner Name</span>
                <span className="font-bold text-gray-900">{owner.full_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-gray-500 font-medium">Registered Mobile</span>
                <span className="font-mono font-bold text-gray-900">+91 {formattedPhone || '—'}</span>
              </div>
              {owner.email && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 font-medium">Email Address</span>
                  <span className="font-medium text-gray-800">{owner.email}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-gray-500 font-medium">ERP Access</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full text-[11px]">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5">
                <span className="text-gray-500 font-medium">Property Listing on Website</span>
                <span className="inline-flex items-center gap-1 font-bold text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-full text-[11px]">
                  Requires Onboarding
                </span>
              </div>
            </div>

            {/* Why is it locked explanation */}
            <div className="mt-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 p-4 text-xs text-emerald-950">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-emerald-900 block">Why is my ERP locked?</span>
                  <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                    To protect tenants and guarantee legitimate listings, our SuperAdmin team reviews owner credentials, verifies property records, and allocates your official PG setup before unlocking the complete operations ERP.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to action buttons */}
            <div className="mt-6 space-y-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Contact SuperAdmin via WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-80" />
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="tel:+919453522757"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Call Support</span>
                </a>

                <Link
                  href="/my-profile"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  <UserCheck className="h-3.5 w-3.5 text-gray-700" />
                  <span>View My Profile</span>
                </Link>
              </div>
            </div>

            {/* Help Note */}
            <p className="mt-5 text-center text-[11px] text-gray-500">
              Need urgent activation? Call our verification desk at <span className="font-bold text-gray-700">+91 94535 22757</span> (10 AM – 8 PM).
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
