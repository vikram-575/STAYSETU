'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, ArrowRight, Building, Sparkles } from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'
import { SectionEditButton } from './website-admin-quick-edit'

interface PopularCitiesProps {
  onSelectCity: (cityName: string) => void
  activeCity?: string
}

export function PopularCities({ onSelectCity, activeCity }: PopularCitiesProps) {
  const { content } = useWebsiteContent()
  const citiesData = content?.cities
  const citiesList = citiesData?.cities || []

  const handleCityClick = (cityName: string) => {
    onSelectCity(cityName)
    const target = document.getElementById('featured-properties')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="popular-cities" className="bg-white py-14 sm:py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
                <Building className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>{citiesData?.badge || 'Top Rental Hubs'}</span>
              </div>
              <SectionEditButton section="cities" label="Edit Cities" />
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#14532D] sm:text-3xl">
              {citiesData?.title || 'Explore Popular Cities'}
            </h2>
            <p className="mt-1 text-sm text-[#647067]">
              {citiesData?.subtitle ||
                'Find verified PGs, shared rooms, and independent flats across India’s major IT and educational centres.'}
            </p>
          </div>

          <button
            onClick={() => handleCityClick('all')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#16A34A] hover:underline"
          >
            <span>View all {citiesList.length} cities</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Cities Grid */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {citiesList.map((city) => {
            const isSelected = activeCity === city.name
            return (
              <div
                key={city.name}
                onClick={() => handleCityClick(city.name)}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? 'border-[#16A34A] ring-2 ring-[#16A34A] shadow-md'
                    : 'border-gray-200/80 bg-white hover:border-gray-300'
                }`}
              >
                {/* City Image Container (4:3 aspect ratio) */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Starting Price Pill */}
                  <div className="absolute top-2 right-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-[#14532D] shadow-xs backdrop-blur-xs">
                    From ₹{city.startingPrice.toLocaleString('en-IN')}/mo
                  </div>

                  {/* City Name & State Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 text-white">
                    <h3 className="text-sm sm:text-base font-bold tracking-tight">{city.name}</h3>
                    <p className="text-[10px] text-gray-200 font-medium">{city.state}</p>
                  </div>
                </div>

                {/* Card Details Bottom */}
                <div className="p-3">
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#647067]">
                    <span>{city.listingCount.toLocaleString('en-IN')} Spaces</span>
                    <span className="text-[#16A34A] font-semibold group-hover:underline">Explore →</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {city.popularLocalities.slice(0, 2).map((loc, i) => (
                      <span
                        key={i}
                        className="rounded-sm bg-gray-100 px-1.5 py-0.5 text-[9px] text-[#17211B]"
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
