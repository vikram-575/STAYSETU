'use client'

import React from 'react'
import { Check, X, Shield, Sparkles, TrendingUp, Users, Building, HeartHandshake } from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'

const STAT_ICONS = [Building, Users, Shield, HeartHandshake]

export function WhyChooseUs() {
  const { content } = useWebsiteContent()
  const whyData = content?.whyChooseUs
  const rows = whyData?.rows || []
  const stats = whyData?.stats || []

  return (
    <section id="why-choose-us" className="bg-[#F7FAF7] py-8 sm:py-16 border-t border-gray-200/70 relative">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
              <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>{whyData?.badge || 'Why Choose PGSetu'}</span>
            </div>
          </div>
          <h2 className="mt-2 text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#14532D]">
            {whyData?.title || 'How We Are Rebuilding Renter Trust'}
          </h2>
          <p className="mx-auto mt-1.5 max-w-2xl text-xs sm:text-sm text-[#647067]">
            {whyData?.subtitle ||
              'Traditional renting was built around brokers and middlemen. PGSetu is built around tenants and genuine property owners.'}
          </p>
        </div>

        {/* MOBILE VIEW: Compact Side-by-Side Comparison Cards (< sm) */}
        <div className="mt-5 sm:hidden space-y-2.5">
          {rows.map((row, i) => (
            <div
              key={row.id || i}
              className="rounded-xl border border-gray-200/90 bg-white p-3 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <span className="font-bold text-xs text-[#17211B]">{row.feature}</span>
                <span className="text-[9.5px] font-bold text-[#14532D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                {/* Traditional Broker Box */}
                <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-100/90 text-rose-900">
                  <div className="flex items-center gap-1 font-bold text-[9.5px] text-rose-700 mb-0.5">
                    <X className="h-3 w-3 text-rose-500 shrink-0" />
                    <span>Traditional</span>
                  </div>
                  <p className="text-[10px] leading-tight text-gray-600">{row.traditional}</p>
                </div>
                {/* PGSetu Advantage Box */}
                <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/90 text-emerald-950">
                  <div className="flex items-center gap-1 font-bold text-[9.5px] text-[#14532D] mb-0.5">
                    <Check className="h-3 w-3 text-[#16A34A] shrink-0" />
                    <span>PGSetu</span>
                  </div>
                  <p className="text-[10px] font-semibold leading-tight text-emerald-950">{row.pgSetu}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW: Full 3-Column Table (sm+) (Issues 6, 7 & 10 Fix: Left-aligned headers, balanced icons, compact layout with zebra striping) */}
        <div className="hidden sm:block mt-8 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90">
                <th className="px-5 py-3.5 font-bold text-[#17211B] uppercase tracking-wider text-xs w-[28%] text-left">
                  Rental Feature
                </th>
                <th className="px-5 py-3.5 font-bold text-gray-500 uppercase tracking-wider text-xs w-[36%] text-left">
                  Traditional Classifieds & Brokers
                </th>
                <th className="px-5 py-3.5 font-bold text-[#14532D] uppercase tracking-wider text-xs w-[36%] bg-[#DCFCE7]/50 text-left">
                  PGSetu Marketplace
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  className={`transition ${i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'} hover:bg-emerald-50/20`}
                >
                  <td className="px-5 py-3.5 font-bold text-[#17211B]">{row.feature}</td>
                  <td className="px-5 py-3.5 text-[#647067]">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white shrink-0 mt-0.5 shadow-2xs">
                        <X className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      </div>
                      <span className="leading-snug">{row.traditional}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#14532D] bg-[#DCFCE7]/20">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A] text-white shrink-0 mt-0.5 shadow-2xs">
                        <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      </div>
                      <span className="leading-snug">{row.pgSetu}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Counter Stats Grid (Issue 19 Fix: High-contrast stroke-[2.5] icons) */}
        <div className="mt-6 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {stats.map((stat, idx) => {
            const Icon = STAT_ICONS[idx % STAT_ICONS.length]
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/90 bg-white p-3 sm:p-5 text-center shadow-2xs hover:border-[#16A34A]/50 transition"
              >
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D] mb-1.5 sm:mb-2 shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" aria-hidden="true" />
                </div>
                <span className="text-lg sm:text-xl lg:text-2xl font-black text-[#14532D] tracking-tight">
                  {stat.value}
                </span>
                <span className="mt-0.5 text-xs font-medium text-[#647067] leading-tight">
                  {stat.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
