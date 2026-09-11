'use client'

import React, { useState, useMemo } from 'react'
import {
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Search,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  X,
  Building,
  Sparkles,
  MapPin,
} from 'lucide-react'
import { PropertyListing, PropertyType, GenderPreference } from '@/types/marketplace'
import { PropertyCard } from './property-card'
import { MapDiscoveryModal } from './map-discovery-modal'

interface FeaturedListingsProps {
  properties: PropertyListing[]
  onSelectDetails: (property: PropertyListing) => void
  savedIds: string[]
  onToggleSave: (propertyId: string) => void
  comparedIds: string[]
  onToggleCompare: (property: PropertyListing) => void
  activeCity: string
  onCityChange: (city: string) => void
  isLoading?: boolean
  initialFilterCriteria?: {
    city?: string
    locality?: string
    propertyType?: PropertyType | 'all'
    sharingType?: string
    maxBudget?: number
    quickChip?: string
  }
}

type TabCategory = 'all' | 'pg' | 'flat' | 'room' | 'girls' | 'boys'

export function FeaturedListings({
  properties,
  onSelectDetails,
  savedIds,
  onToggleSave,
  comparedIds,
  onToggleCompare,
  activeCity,
  onCityChange,
  isLoading = false,
  initialFilterCriteria,
}: FeaturedListingsProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSharing, setSelectedSharing] = useState('all')
  const [maxBudget, setMaxBudget] = useState<number>(0)
  const [foodOnly, setFoodOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'rating'>(
    'recommended'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)

  // Dynamically compute unique cities present in actual listings
  const availableCities = useMemo(() => {
    const set = new Set<string>()
    properties.forEach((p) => {
      if (p.city && p.city.trim()) set.add(p.city.trim())
    })
    return Array.from(set).sort()
  }, [properties])

  // Filtered & Sorted properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter((item) => {
        // City filter
        if (activeCity && activeCity !== 'all' && item.city.toLowerCase() !== activeCity.toLowerCase()) {
          return false
        }

        // Tab category filter
        if (activeTab === 'pg' && item.propertyType !== 'pg') return false
        if (activeTab === 'flat' && item.propertyType !== 'flat' && item.propertyType !== 'apartment')
          return false
        if (activeTab === 'room' && item.propertyType !== 'room') return false
        if (activeTab === 'girls' && item.genderPreference !== 'girls') return false
        if (activeTab === 'boys' && item.genderPreference !== 'boys') return false

        // Search text filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matches =
            item.title.toLowerCase().includes(q) ||
            item.locality.toLowerCase().includes(q) ||
            item.city.toLowerCase().includes(q) ||
            item.distanceToMetro.toLowerCase().includes(q) ||
            item.amenities.some((a) => a.toLowerCase().includes(q))
          if (!matches) return false
        }

        // Sharing filter
        if (selectedSharing !== 'all' && !item.sharingType.includes(selectedSharing)) {
          return false
        }

        // Budget filter
        if (maxBudget > 0 && item.price > maxBudget) {
          return false
        }

        // Food filter
        if (foodOnly && !item.foodIncluded) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price
        if (sortBy === 'price_high') return b.price - a.price
        if (sortBy === 'rating') return b.rating - a.rating
        return b.reviewCount - a.reviewCount // recommended
      })
  }, [properties, activeCity, activeTab, searchQuery, selectedSharing, maxBudget, foodOnly, sortBy])

  const resetFilters = () => {
    setActiveTab('all')
    setSearchQuery('')
    setSelectedSharing('all')
    setMaxBudget(0)
    setFoodOnly(false)
    onCityChange('all')
  }

  return (
    <section id="featured-properties" className="bg-[#F7FAF7] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
              <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>Verified Market Feed</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#14532D] sm:text-3xl lg:text-4xl">
              Featured PGs, Flats & Rooms for Rent
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#647067]">
              Showing {filteredProperties.length} verified spaces
              {activeCity !== 'all' ? ` in ${activeCity}` : ' across India'} with direct owner connect.
            </p>
          </div>

          {/* View Toggle (Grid vs Split Map) */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'grid'
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-[#647067] hover:text-[#17211B]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'map'
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-[#647067] hover:text-[#17211B]'
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>Interactive Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="mt-8 rounded-2xl border border-gray-200/90 bg-white p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Spaces' },
                { id: 'pg', label: 'Verified PGs' },
                { id: 'flat', label: '1 & 2 BHK Flats' },
                { id: 'room', label: 'Private Rooms' },
                { id: 'girls', label: 'Girls Only' },
                { id: 'boys', label: 'Boys Only' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabCategory)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    activeTab === tab.id
                      ? 'bg-[#14532D] text-white shadow-xs'
                      : 'bg-gray-100/80 text-[#647067] hover:bg-gray-200/70 hover:text-[#17211B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Controls Right: Search + Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search text */}
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by metro, locality..."
                  className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-1.5 pl-8 pr-3 text-xs font-medium focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* City filter */}
              <select
                value={activeCity}
                onChange={(e) => onCityChange(e.target.value)}
                className="rounded-xl border border-gray-200 bg-[#F7FAF7] py-1.5 px-3 text-xs font-semibold text-[#17211B] focus:border-[#16A34A] focus:outline-hidden"
              >
                <option value="all">All Cities ({properties.length})</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Sort By */}
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-[#F7FAF7] px-2 py-1">
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#17211B] focus:outline-hidden"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* View Content: Grid or Interactive Split Map */}
        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs animate-pulse space-y-4">
                <div className="aspect-16/10 w-full bg-gray-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div className="mt-6">
            <MapDiscoveryModal
              properties={filteredProperties}
              selectedProperty={filteredProperties[0] || null}
              onSelectProperty={onSelectDetails}
              isModal={false}
            />
          </div>
        ) : (
          <div className="mt-8">
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onSelectDetails={onSelectDetails}
                    isSaved={savedIds.includes(property.id)}
                    onToggleSave={onToggleSave}
                    isCompared={comparedIds.includes(property.id)}
                    onToggleCompare={onToggleCompare}
                  />
                ))}
              </div>
            ) : (
              <div className="my-16 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                <Building className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-base font-bold text-[#17211B]">
                  No Properties Match Your Filters
                </h3>
                <p className="mt-1 text-xs text-[#647067]">
                  Try expanding your budget range or clearing search criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#16A34A]"
                >
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
