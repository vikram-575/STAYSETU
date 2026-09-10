'use client'

import React from 'react'
import { Check, X, Shield, Sparkles, TrendingUp, Users, Building, HeartHandshake } from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'
import { SectionEditButton } from './website-admin-quick-edit'

const STAT_ICONS = [Building, Users, Shield, HeartHandshake]

export function WhyChooseUs() {
  const { content } = useWebsiteContent()
  const whyData = content?.whyChooseUs
  const rows = whyData?.rows || []
  const stats = whyData?.stats || []

  return (
    <section id="why-choose-us" className="bg-[#F7FAF7] py-16 sm:py-24 border-t border-gray-200/70 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3.5 py-1 text-xs font-bold text-[#14532D]">
              <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>{whyData?.badge || 'Why Choose PGSetu'}</span>
            </div>
            <SectionEditButton section="comparison" label="Edit Comparison" />
          </div>
          <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-[#14532D]">
            {whyData?.title || 'How We Are Rebuilding Renter Trust'}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-[#647067]">
            {whyData?.subtitle ||
              'Traditional renting was built around brokers and middlemen. PGSetu is built around tenants and genuine property owners.'}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="p-4 sm:p-5 font-bold text-gray-500 uppercase tracking-wider text-[11px] w-1/3">
                  Rental Feature
                </th>
                <th className="p-4 sm:p-5 font-bold text-gray-400 uppercase tracking-wider text-[11px] w-1/3">
                  Traditional Classifieds & Brokers
                </th>
                <th className="p-4 sm:p-5 font-bold text-[#14532D] uppercase tracking-wider text-[11px] w-1/3 bg-[#DCFCE7]/40">
                  PGSetu Marketplace
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 sm:p-5 font-bold text-[#17211B]">{row.feature}</td>
                  <td className="p-4 sm:p-5 text-gray-500">
                    <div className="flex items-start gap-2">
                      <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0 mt-0.5">
                        <X className="h-3 w-3" />
                      </div>
                      <span>{row.traditional}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 font-semibold text-[#14532D] bg-[#DCFCE7]/20">
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

        {/* Counter Stats Grid */}
        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = STAT_ICONS[idx % STAT_ICONS.length]
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white p-6 text-center shadow-xs"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#16A34A] mb-3">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#14532D]">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-semibold text-[#647067]">{stat.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
