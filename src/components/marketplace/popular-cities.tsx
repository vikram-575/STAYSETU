'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, Building, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'

import { PropertyListing } from '@/types/marketplace'

interface PopularCitiesProps {
  onSelectCity: (cityName: string) => void
  activeCity?: string
  properties?: PropertyListing[]
}

export function PopularCities({ onSelectCity, activeCity, properties = [] }: PopularCitiesProps) {
  const router = useRouter()
  const { content } = useWebsiteContent()
  const citiesData = content?.cities
  const citiesList = citiesData?.cities || []

  const reelRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Automatically roll cities carousel on mobile
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const el = reelRef.current
      if (!el) return

      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 5) return // Not horizontally scrollable (e.g. desktop grid)

      // If near or at the end, loop smoothly back to beginning
      if (el.scrollLeft >= maxScroll - 15) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        // Step forward by one card width (136px) + gap (10px) = 146px
        el.scrollBy({ left: 146, behavior: 'smooth' })
      }
    }, 2800)

    return () => clearInterval(interval)
  }, [isPaused])

  const scrollReel = (direction: 'left' | 'right') => {
    const el = reelRef.current
    if (!el) return
    const step = 146 * 2
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' })
  }

  const handleCityClick = (cityName: string) => {
    onSelectCity?.(cityName)
    if (cityName === 'all') {
      router.push('/search')
    } else {
      router.push(`/search?city=${encodeURIComponent(cityName)}`)
    }
  }

  return (
    <section id="popular-cities" className="bg-white py-10 sm:py-20 relative">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
                <Building className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>{citiesData?.badge || 'Top Rental Hubs'}</span>
              </div>
            </div>
            <h2 className="mt-2 text-xl sm:text-3xl font-bold tracking-tight text-[#14532D]">
              {citiesData?.title || 'Explore Popular Cities'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#647067]">
              {citiesData?.subtitle ||
                'Find verified PGs, shared rooms, and independent flats across India’s major IT and educational centres.'}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            {/* Mobile Auto-roll status badge & Chevron controls */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#16A34A] bg-[#DCFCE7]/70 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
                </span>
                <span>Auto-rolling</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollReel('left')}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-95 transition"
                  aria-label="Previous cities"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollReel('right')}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-95 transition"
                  aria-label="Next cities"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => handleCityClick('all')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#16A34A] hover:underline"
            >
              <span>View all {citiesList.length} cities</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cities Rolling Reel (Mobile horizontal auto-rolling carousel + Desktop responsive grid) */}
        <div
          ref={reelRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => {
            setTimeout(() => setIsPaused(false), 2500)
          }}
          className="mt-4 sm:mt-8 flex overflow-x-auto snap-x snap-mandatory gap-2.5 pb-2.5 pt-1 -mx-3.5 px-3.5 no-scrollbar sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4 scroll-smooth"
        >
          {citiesList.map((city) => {
            const isSelected = activeCity === city.name

            // Real dynamic data from database listings
            const matchedProps = properties.filter(
              (p) => p.city.toLowerCase() === city.name.toLowerCase()
            )
            const realListingCount = matchedProps.length > 0 ? matchedProps.length : city.listingCount
            const realTotalBeds = matchedProps.reduce((sum, p) => sum + (p.totalBeds || 0), 0)
            const realMinPrice = matchedProps.length > 0
              ? Math.min(...matchedProps.map((p) => p.price))
              : city.startingPrice

            const displaySpaces = realTotalBeds > 0
              ? `${realTotalBeds} Spaces`
              : `${realListingCount} ${realListingCount === 1 ? 'PG' : 'PGs'}`

            return (
              <div
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl sm:rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg active:scale-98 w-[136px] sm:w-auto shrink-0 snap-start ${
                  isSelected
                    ? 'border-[#16A34A] ring-2 ring-[#16A34A] shadow-md'
                    : 'border-gray-200/80 bg-white hover:border-gray-300'
                }`}
              >
                {/* City Image Container (responsive aspect ratio) */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Starting Price Pill */}
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 rounded-md bg-white/95 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold text-[#14532D] shadow-xs backdrop-blur-xs">
                    ₹{realMinPrice >= 1000 ? `${Math.round(realMinPrice / 1000)}k` : realMinPrice}/mo
                  </div>

                  {/* City Name & State Overlay */}
                  <div className="absolute bottom-1.5 sm:bottom-2.5 left-1.5 sm:left-2.5 text-white pr-1">
                    <h3 className="text-xs sm:text-base font-extrabold tracking-tight line-clamp-1">{city.name}</h3>
                    <p className="text-[8px] sm:text-[10px] text-gray-200 font-medium">{city.state}</p>
                  </div>
                </div>

                {/* Card Details Bottom */}
                <div className="p-1.5 sm:p-3">
                  <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-medium text-[#647067]">
                    <span className="font-bold text-gray-800 truncate">{displaySpaces}</span>
                    <span className="text-[#16A34A] font-bold group-hover:underline shrink-0">Explore →</span>
                  </div>
                  <div className="hidden sm:flex mt-1 flex-wrap gap-1">
                    {city.popularLocalities.slice(0, 2).map((loc, i) => (
                      <span
                        key={i}
                        className="rounded-sm bg-gray-100 px-1 sm:px-1.5 py-0.5 text-[8.5px] sm:text-[9px] text-[#17211B] truncate max-w-[90px]"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

