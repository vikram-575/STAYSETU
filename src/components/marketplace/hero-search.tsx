'use client'

import React, { useState } from 'react'
import {
  Search,
  MapPin,
  Home,
  IndianRupee,
  Calendar,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { PropertyType } from '@/types/marketplace'
import { useWebsiteContent } from '@/context/website-content-context'

interface HeroSearchProps {
  onSearch: (criteria: {
    city: string
    locality: string
    propertyType: PropertyType | 'all'
    sharingType: string
    maxBudget: number
    quickChip?: string
  }) => void
  selectedCity: string
  onCityChange: (city: string) => void
}

const SEARCH_TABS: { id: PropertyType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Spaces' },
  { id: 'pg', label: 'PG / Co-living' },
  { id: 'flat', label: 'Independent Flat' },
  { id: 'room', label: 'Private Room' },
  { id: 'apartment', label: 'Luxury Apartment' },
]

const POPULAR_SUGGESTIONS = [
  { city: 'Bangalore', locality: 'Koramangala' },
  { city: 'Bangalore', locality: 'Indiranagar' },
  { city: 'Bangalore', locality: 'HSR Layout' },
  { city: 'Gurgaon', locality: 'DLF Cyber City' },
  { city: 'Gurgaon', locality: 'Sector 56' },
  { city: 'Noida', locality: 'Sector 62' },
  { city: 'Delhi', locality: 'Saket' },
  { city: 'Delhi', locality: 'Hauz Khas' },
  { city: 'Pune', locality: 'Hinjewadi Phase 1' },
  { city: 'Hyderabad', locality: 'Gachibowli' },
  { city: 'Mumbai', locality: 'Powai' },
]

export function HeroSearch({ onSearch, selectedCity, onCityChange }: HeroSearchProps) {
  const { content } = useWebsiteContent()
  const hero = content?.hero

  const [activeTab, setActiveTab] = useState<PropertyType | 'all'>('all')
  const [locationQuery, setLocationQuery] = useState(selectedCity ? selectedCity : '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sharingType, setSharingType] = useState('all')
  const [budgetRange, setBudgetRange] = useState<number>(0)
  const [moveInTiming, setMoveInTiming] = useState('immediate')
  const [activeChip, setActiveChip] = useState<string | null>(null)

  const handleCitySelect = (city: string, locality?: string) => {
    onCityChange(city)
    setLocationQuery(locality ? `${locality}, ${city}` : city)
    setShowSuggestions(false)
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    onSearch({
      city: selectedCity,
      locality: locationQuery,
      propertyType: activeTab,
      sharingType,
      maxBudget: budgetRange,
      quickChip: activeChip || undefined,
    })
    // Smooth scroll down to listings
    const target = document.getElementById('featured-properties')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleChipClick = (chipKey: string) => {
    const nextChip = activeChip === chipKey ? null : chipKey
    setActiveChip(nextChip)
    onSearch({
      city: selectedCity,
      locality: locationQuery,
      propertyType: activeTab,
      sharingType,
      maxBudget: budgetRange,
      quickChip: nextChip || undefined,
    })
    const target = document.getElementById('featured-properties')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7FAF7] via-white to-[#F7FAF7] pt-10 pb-16 lg:pt-16 lg:pb-24">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
        <div className="h-[450px] w-full max-w-7xl bg-radial from-[#DCFCE7]/50 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Tagline Pill */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#16A34A]/25 bg-[#DCFCE7]/60 px-3.5 py-1.5 text-xs font-semibold text-[#14532D] shadow-2xs backdrop-blur-xs">
            <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
            <span>{hero?.badge || '#1 PropTech & PG Rental Network'}</span>
          </div>
        </div>

        {/* Main Hero Typography */}
        <div className="mx-auto mt-6 max-w-4xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14532D] sm:text-5xl lg:text-6xl">
            {hero?.headline || 'Find Your Ideal PG or Flat'}{' '}
            <span className="bg-gradient-to-r from-[#16A34A] to-[#14532D] bg-clip-text text-transparent">
              {hero?.highlightText || 'Without Brokerage Hassle'}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-[#647067] leading-relaxed">
            {hero?.subtitle ||
              'Discover verified PGs, rooms and flats with transparent digital rent passbooks, live electricity meter readings, and zero middleman commissions.'}
          </p>

          {/* 4 Stats Counters */}
          {hero?.stats && hero.stats.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-center">
              {hero.stats.map((st, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-lg sm:text-xl font-black text-[#14532D]">{st.value}</span>
                  <span className="text-xs text-[#647067] font-medium">{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Multi-Tab Search Box Card */}
        <div className="mx-auto mt-10 max-w-5xl">
          <div className="rounded-2xl border border-gray-200/90 bg-white p-3 sm:p-5 shadow-xl shadow-gray-200/60 ring-1 ring-black/5">
            {/* Property Type Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
              {SEARCH_TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#14532D] text-white shadow-xs'
                        : 'text-[#647067] hover:bg-gray-100/80 hover:text-[#17211B]'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Form Input Fields Grid */}
            <form onSubmit={handleSearchSubmit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
              {/* 1. Location / City Input */}
              <div className="relative lg:col-span-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#647067] mb-1">
                  Location or City
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 h-4 w-4 text-[#16A34A]" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => {
                      setLocationQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="e.g. Koramangala, Bangalore"
                    className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-2.5 pl-10 pr-3 text-sm font-medium text-[#17211B] placeholder-gray-400 focus:border-[#16A34A] focus:bg-white focus:outline-hidden transition"
                  />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 z-30 mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                    <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Popular Localities
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {POPULAR_SUGGESTIONS.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCitySelect(item.city, item.locality)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-[#DCFCE7]/40 transition"
                        >
                          <span className="font-semibold text-[#17211B]">{item.locality}</span>
                          <span className="rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                            {item.city}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Room / Sharing Dropdown */}
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#647067] mb-1">
                  Occupancy / BHK
                </label>
                <div className="relative flex items-center">
                  <Home className="absolute left-3.5 h-4 w-4 text-[#16A34A]" />
                  <select
                    value={sharingType}
                    onChange={(e) => setSharingType(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-[#F7FAF7] py-2.5 pl-10 pr-8 text-sm font-medium text-[#17211B] focus:border-[#16A34A] focus:bg-white focus:outline-hidden transition"
                  >
                    <option value="all">Any Sharing / BHK</option>
                    <option value="Single Room">Private Single Room</option>
                    <option value="Double Sharing">Double Sharing (2 Beds)</option>
                    <option value="Triple Sharing">Triple Sharing (3 Beds)</option>
                    <option value="1 BHK">1 BHK Apartment</option>
                    <option value="2 BHK">2 BHK Apartment</option>
                    <option value="3 BHK">3 BHK Luxury</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* 3. Budget Dropdown */}
              <div className="lg:col-span-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#647067] mb-1">
                  Max Monthly Budget
                </label>
                <div className="relative flex items-center">
                  <IndianRupee className="absolute left-3.5 h-4 w-4 text-[#16A34A]" />
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-[#F7FAF7] py-2.5 pl-10 pr-8 text-sm font-medium text-[#17211B] focus:border-[#16A34A] focus:bg-white focus:outline-hidden transition"
                  >
                    <option value={0}>Any Budget</option>
                    <option value={8000}>Up to ₹8,000 / mo</option>
                    <option value={12000}>Up to ₹12,000 / mo</option>
                    <option value={18000}>Up to ₹18,000 / mo</option>
                    <option value={25000}>Up to ₹25,000 / mo</option>
                    <option value={40000}>Up to ₹40,000 / mo</option>
                    <option value={60000}>Up to ₹60,000 / mo</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* 4. Search CTA Button */}
              <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-2.5 px-4 text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Search Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-[#647067] mr-1 hidden sm:inline">Quick Filters:</span>
            {(hero?.quickChips || []).map((chip) => {
              const isSelected = activeChip === chip.filterKey
              return (
                <button
                  key={chip.filterKey}
                  onClick={() => handleChipClick(chip.filterKey)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                    isSelected
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'border border-gray-200/90 bg-white text-[#17211B] hover:border-[#16A34A] hover:bg-[#DCFCE7]/30'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
