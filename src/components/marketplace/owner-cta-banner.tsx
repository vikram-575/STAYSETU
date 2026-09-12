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
    <section className="bg-white py-6 sm:py-16 lg:py-20 relative">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#14532D] via-[#166534] to-[#14532D] p-4 sm:p-10 lg:p-14 text-white shadow-xl">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#16A34A]/25 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-2 sm:mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7]/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-[#DCFCE7] backdrop-blur-xs">
                <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{cta?.badge || 'For PG Owners, Hostels & Flat Landlords'}</span>
              </div>
            </div>

            <h2 className="mt-1 sm:mt-2 text-lg sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug sm:leading-tight">
              {cta?.title || 'Fill Vacant Beds 3x Faster & Manage Tenants on Autopilot'}
            </h2>

            <p className="mt-2 sm:mt-3 text-[11px] sm:text-sm lg:text-base text-gray-200 leading-relaxed max-w-2xl">
              {cta?.subtitle ||
                'List your property on PGSetu for free and reach 50,000+ monthly tech workers and students. Connect directly with tenants and power your property with our integrated PG-SETU management software.'}
            </p>

            {/* Feature Highlights Grid */}
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs lg:text-sm font-semibold text-[#DCFCE7]">
              {(cta?.bulletPoints || [
                '100% Free Listing — Zero Commissions',
                'Automated UPI Rent Collection & Reminders',
                'Instant Digital Tenant Passbooks & Receipts',
                'Govt Aadhaar KYC Screening Included',
              ]).map((bp, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F59E0B] shrink-0" />
                  <span>{bp}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3.5">
              <button
                onClick={onOpenListModal}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-[#14532D] shadow-md hover:bg-gray-100 active:scale-98 transition w-full sm:w-auto"
              >
                <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#16A34A]" />
                <span>{cta?.primaryBtnText || 'List Your Property Free'}</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <Link
                href={cta?.secondaryBtnLink || '/software'}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-white/40 bg-white/10 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-xs hover:bg-white/20 active:scale-98 transition w-full sm:w-auto text-center"
              >
                <span>{cta?.secondaryBtnText || 'Explore PG ERP Software'}</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
