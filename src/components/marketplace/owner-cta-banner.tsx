'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  PlusCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'

interface OwnerCtaBannerProps {
  onOpenListModal: () => void
}

export function OwnerCtaBanner({ onOpenListModal }: OwnerCtaBannerProps) {
  const { content } = useWebsiteContent()
  const cta = content?.ownerCta

  return (
    <section className="bg-white py-10 sm:py-20 relative">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14532D] via-[#166534] to-[#14532D] p-5 sm:p-12 lg:p-16 text-white shadow-2xl">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#16A34A]/25 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#DCFCE7]/20 px-3 py-1 text-[11px] sm:text-xs font-bold text-[#DCFCE7] backdrop-blur-xs">
                <Building2 className="h-3.5 w-3.5" />
                <span>{cta?.badge || 'For PG Owners, Hostels & Flat Landlords'}</span>
              </div>
            </div>

            <h2 className="mt-1.5 sm:mt-2 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {cta?.title || 'Fill Vacant Beds 3x Faster & Manage Tenants on Autopilot'}
            </h2>

            <p className="mt-2.5 sm:mt-4 text-xs sm:text-base text-gray-200 leading-relaxed max-w-2xl">
              {cta?.subtitle ||
                'List your property on PGSetu for free and reach 50,000+ monthly tech workers and students. Connect directly with tenants and power your property with our integrated PG-SETU management software.'}
            </p>

            {/* Feature Highlights Grid */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-[#DCFCE7]">
              {(cta?.bulletPoints || [
                '100% Free Listing — Zero Commissions',
                'Automated UPI Rent Collection & Reminders',
                'Instant Digital Tenant Passbooks & Receipts',
                'Govt Aadhaar KYC Screening Included',
              ]).map((bp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#F59E0B] shrink-0" />
                  <span>{bp}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4">
              <button
                onClick={onOpenListModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold text-[#14532D] shadow-lg hover:bg-gray-100 active:scale-98 transition w-full sm:w-auto"
              >
                <PlusCircle className="h-4 w-4 text-[#16A34A]" />
                <span>{cta?.primaryBtnText || 'List Your Property Free'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                href={cta?.secondaryBtnLink || '/software'}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur-xs hover:bg-white/20 active:scale-98 transition w-full sm:w-auto text-center"
              >
                <span>{cta?.secondaryBtnText || 'Explore PG ERP Software'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
