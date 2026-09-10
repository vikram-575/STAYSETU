'use client'

import React from 'react'
import { ShieldCheck, UserCheck2, ReceiptText, Headphones, CheckCircle } from 'lucide-react'

const TRUST_CARDS = [
  {
    icon: ShieldCheck,
    title: '100% Physically Verified',
    description:
      'Every space is personally inspected by our team. Live photos, geo-tagged coordinates, and verified security standards.',
    badge: 'Inspected Spaces',
  },
  {
    icon: UserCheck2,
    title: 'Zero Brokerage Direct Connect',
    description:
      'Deal directly with verified owners & hostel managers. No broker interference, no pushy middleman fees.',
    badge: 'Save ₹15,000+',
  },
  {
    icon: ReceiptText,
    title: 'Digital Rent Passbook & Bills',
    description:
      'Live electricity sub-meter readings, transparent line-item charges, automated receipts, and an official ledger.',
    badge: 'Powered by PG-SETU',
  },
  {
    icon: Headphones,
    title: '24/7 Rapid Tenant Resolution',
    description:
      'Our dedicated concierge team safeguards security deposits, move-in checklists, and speedy maintenance handling.',
    badge: 'Priority Support',
  },
]

export function TrustSection() {
  return (
    <section id="trust-section" className="border-y border-gray-200/70 bg-[#F7FAF7] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
            <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>The StaySetu Trust Standard</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#14532D] sm:text-3xl lg:text-4xl">
            Renting Made Honest, Transparent & Safe
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-[#647067]">
            We eliminated the shady brokers, hidden electricity markups, and unreturned deposits that haunt traditional renting.
          </p>
        </div>

        {/* 4 Trust Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_CARDS.map((card, idx) => {
            const Icon = card.icon
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-6 shadow-xs transition hover:border-[#16A34A] hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCFCE7]/70 text-[#16A34A] transition group-hover:scale-110 group-hover:bg-[#16A34A] group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#17211B]">{card.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#647067] leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
                  <span>Guaranteed</span>
                  <CheckCircle className="h-3.5 w-3.5" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
