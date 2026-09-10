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

interface OwnerCtaBannerProps {
  onOpenListModal: () => void
}

export function OwnerCtaBanner({ onOpenListModal }: OwnerCtaBannerProps) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14532D] via-[#166534] to-[#14532D] p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#16A34A]/25 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7]/20 px-3.5 py-1 text-xs font-bold text-[#DCFCE7] backdrop-blur-xs">
              <Building2 className="h-3.5 w-3.5" />
              <span>For PG Owners, Hostels & Flat Landlords</span>
            </div>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
              Fill Vacant Beds 3x Faster & Manage Tenants on Autopilot
            </h2>

            <p className="mt-4 text-sm sm:text-base text-gray-200 leading-relaxed max-w-2xl">
              List your property on StaySetu for free and reach 50,000+ monthly tech workers and students. Connect directly with tenants and power your property with our integrated PG-SETU management software.
            </p>

            {/* Feature Highlights Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-[#DCFCE7]">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#F59E0B]" />
                <span>100% Free Listing — Zero Commissions</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#F59E0B]" />
                <span>Automated UPI Rent Collection & Reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#F59E0B]" />
                <span>Instant Digital Tenant Passbooks & Receipts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#F59E0B]" />
                <span>Govt Aadhaar KYC Screening Included</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenListModal}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs sm:text-sm font-extrabold text-[#14532D] shadow-lg hover:bg-gray-100 active:scale-98 transition"
              >
                <PlusCircle className="h-4 w-4 text-[#16A34A]" />
                <span>List Property Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                href="/software"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur-xs hover:bg-white/20 transition"
              >
                <span>Explore PG-SETU ERP Software</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
