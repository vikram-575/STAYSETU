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
    <section id="why-choose-us" className="bg-[#F7FAF7] py-10 sm:py-20 border-t border-gray-200/70 relative">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3.5 py-1 text-xs font-bold text-[#14532D]">
              <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>{whyData?.badge || 'Why Choose PGSetu'}</span>
            </div>
          </div>
          <h2 className="mt-2.5 text-xl sm:text-3xl lg:text-4xl font-extrabold text-[#14532D]">
            {whyData?.title || 'How We Are Rebuilding Renter Trust'}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-base text-[#647067]">
            {whyData?.subtitle ||
              'Traditional renting was built around brokers and middlemen. PGSetu is built around tenants and genuine property owners.'}
          </p>
        </div>

        {/* Mobile Swipe Notice */}
        <div className="mt-6 sm:hidden text-center text-[10.5px] text-gray-500 font-medium flex items-center justify-center gap-1">
          <span>👈 Swipe table horizontally to compare 👉</span>
        </div>

        {/* Comparison Table - Scrollable on mobile with minimum width to avoid text squishing */}
        <div className="mt-2 sm:mt-10 overflow-x-auto no-scrollbar -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
          <div className="inline-block min-w-[560px] sm:min-w-full overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="p-3.5 sm:p-5 font-bold text-gray-500 uppercase tracking-wider text-[10px] sm:text-[11px] w-1/3">
                    Rental Feature
                  </th>
                  <th className="p-3.5 sm:p-5 font-bold text-gray-400 uppercase tracking-wider text-[10px] sm:text-[11px] w-1/3">
                    Traditional Classifieds & Brokers
                  </th>
                  <th className="p-3.5 sm:p-5 font-bold text-[#14532D] uppercase tracking-wider text-[10px] sm:text-[11px] w-1/3 bg-[#DCFCE7]/40">
                    PGSetu Marketplace
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-gray-50/50 transition">
                    <td className="p-3.5 sm:p-5 font-bold text-[#17211B]">{row.feature}</td>
                    <td className="p-3.5 sm:p-5 text-gray-500">
                      <div className="flex items-start gap-2">
                        <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                          <X className="h-3 w-3" />
                        </div>
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="p-3.5 sm:p-5 font-semibold text-[#14532D] bg-[#DCFCE7]/20">
                      <div className="flex items-start gap-2">
                        <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#16A34A] text-white shrink-0 mt-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                        <span>{row.pgSetu}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Counter Stats Grid */}
        <div className="mt-8 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = STAT_ICONS[idx % STAT_ICONS.length]
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white p-3.5 sm:p-6 text-center shadow-xs"
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#16A34A] mb-2 sm:mb-3">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xl sm:text-3xl font-extrabold text-[#14532D]">
                  {stat.value}
                </span>
                <span className="mt-0.5 sm:mt-1 text-[10.5px] sm:text-xs font-semibold text-[#647067]">{stat.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
