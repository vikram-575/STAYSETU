'use client'

import React from 'react'
import { ShieldCheck, UserCheck2, ReceiptText, Headphones, CheckCircle, Sparkles } from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldCheck,
  UserCheck2,
  ReceiptText,
  Headphones,
  CheckCircle,
  Sparkles,
}

export function TrustSection() {
  const { content } = useWebsiteContent()
  const trust = content?.trust

  return (
    <section id="trust-section" className="border-y border-gray-200/70 bg-[#F7FAF7] py-8 sm:py-16 relative">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
              <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>{trust?.badge || 'The PGSetu Trust Standard'}</span>
            </div>
          </div>
          <h2 className="mt-2 text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#14532D]">
            {trust?.title || 'Renting Made Honest, Transparent & Safe'}
          </h2>
          <p className="mx-auto mt-1.5 max-w-2xl text-xs sm:text-sm text-[#647067] leading-relaxed">
            {trust?.subtitle ||
              'We eliminated the shady brokers, hidden electricity markups, and unreturned deposits that haunt traditional renting.'}
          </p>
        </div>

        {/* 4 Trust Cards Grid - Clean left-aligned layout matching icon, title and description (Issue 10 Fix) */}
        <div className="mt-6 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {(trust?.cards || []).map((card, idx) => {
            const Icon = (card.icon && ICON_MAP[card.icon]) ? ICON_MAP[card.icon] : ShieldCheck
            return (
              <div
                key={card.id || idx}
                className="group relative flex flex-col justify-between items-start text-left rounded-2xl border border-gray-200/90 bg-white p-3.5 sm:p-5 lg:p-6 shadow-2xs sm:shadow-xs transition hover:border-[#16A34A] hover:shadow-md w-full"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#DCFCE7]/70 text-[#16A34A] transition group-hover:scale-105 group-hover:bg-[#16A34A] group-hover:text-white shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    {card.badge && (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800 truncate">
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 sm:mt-4 text-xs sm:text-base font-bold text-[#17211B] leading-snug line-clamp-2 text-left">
                    {card.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#647067] leading-relaxed line-clamp-3 sm:line-clamp-none text-left">
                    {card.description}
                  </p>
                </div>

                <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs font-semibold text-[#16A34A]">
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
