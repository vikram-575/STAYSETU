'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  X,
  Filter,
  CheckCircle2,
  Building,
  Sparkles,
  MapPin,
  IndianRupee,
  Home,
  ShieldCheck,
  Utensils,
  Wifi,
  Wind,
  Zap,
  ArrowUpDown,
  RotateCcw,
  Share2,
  ChevronDown,
  Heart,
} from 'lucide-react'
import { PropertyListing, PropertyType, GenderPreference, SharingType } from '@/types/marketplace'
import { MarketplaceNavbar } from '@/components/marketplace/marketplace-navbar'
import { MarketplaceFooter } from '@/components/marketplace/marketplace-footer'
import { PropertyCard } from '@/components/marketplace/property-card'
import dynamic from 'next/dynamic'
import { MobileBottomNav } from '@/components/marketplace/mobile-bottom-nav'
import { SavedPropertiesModal } from '@/components/marketplace/saved-properties-modal'

const PropertyDetailModal = dynamic(
  () => import('@/components/marketplace/property-detail-modal').then((mod) => mod.PropertyDetailModal),
  { ssr: false }
)
const PropertyCompareDrawer = dynamic(
  () => import('@/components/marketplace/property-compare-drawer').then((mod) => mod.PropertyCompareDrawer),
  { ssr: false }
)
const MapDiscoveryModal = dynamic(
  () => import('@/components/marketplace/map-discovery-modal').then((mod) => mod.MapDiscoveryModal),
  { ssr: false }
)
const ListPropertyModal = dynamic(
  () => import('@/components/marketplace/list-property-modal').then((mod) => mod.ListPropertyModal),
  { ssr: false }
)
import { POPULAR_CITIES } from '@/data/mock-properties'

const CITIES_LIST = [
  'All Cities',
  'Bangalore',
  'Gurgaon',
  'Noida',
  'Delhi',
  'Pune',
  'Hyderabad',
  'Mumbai',
  'Chennai',
  'Ahmedabad',
  'Jaipur',
]

const PROPERTY_TYPES: { id: PropertyType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Spaces' },
  { id: 'pg', label: 'PG / Co-living' },
  { id: 'flat', label: 'Independent Flat' },
  { id: 'room', label: 'Private Room' },
  { id: 'apartment', label: 'Luxury Apartment' },
]

const GENDER_OPTIONS: { id: GenderPreference | 'all'; label: string }[] = [
  { id: 'all', label: 'Any Gender / Co-ed' },
  { id: 'girls', label: 'Girls Only (Women)' },
  { id: 'boys', label: 'Boys Only (Men)' },
  { id: 'coed', label: 'Co-ed Spaces' },
]

const SHARING_OPTIONS = [
  { id: 'all', label: 'Any Occupancy' },
  { id: 'Single Room', label: 'Private Single Room' },
  { id: 'Double Sharing', label: 'Double Sharing (2 Beds)' },
  { id: 'Triple Sharing', label: 'Triple Sharing (3 Beds)' },
  { id: '1 BHK', label: '1 BHK Flat' },
  { id: '2 BHK', label: '2 BHK Flat' },
  { id: '3 BHK', label: '3 BHK Apartment' },
]

const BUDGET_PRESETS = [
  { label: 'Any Budget', value: 0 },
  { label: '≤ ₹8,000', value: 8000 },
  { label: '≤ ₹12,000', value: 12000 },
  { label: '≤ ₹18,000', value: 18000 },
  { label: '≤ ₹25,000', value: 25000 },
  { label: '≤ ₹40,000', value: 40000 },
]

const AMENITY_FILTERS = [
  { id: 'wifi', label: 'High-speed WiFi' },
  { id: 'ac', label: 'Air Conditioner (AC)' },
  { id: 'power_backup', label: 'Power Backup 24x7' },
  { id: 'food_included', label: 'Food / Meals Included' },
  { id: 'attached_washroom', label: 'Attached Washroom' },
  { id: 'housekeeping', label: 'Daily Housekeeping' },
  { id: 'cctv', label: 'CCTV & Biometric Security' },
  { id: 'washing_machine', label: 'Washing Machine' },
  { id: 'near_metro', label: 'Near Metro (< 500m)' },
]

function SearchPGContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Properties list and UI states
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [comparedProperties, setComparedProperties] = useState<PropertyListing[]>([])
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false)
  const [filterSavedOnly, setFilterSavedOnly] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Filter States initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('locality') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'All Cities')
  const [propertyType, setPropertyType] = useState<PropertyType | 'all'>(
    (searchParams.get('type') as PropertyType) || 'all'
  )
  const [genderPref, setGenderPref] = useState<GenderPreference | 'all'>(
    (searchParams.get('gender') as GenderPreference) || 'all'
  )
  const [sharingType, setSharingType] = useState(searchParams.get('sharing') || 'all')
  const [maxBudget, setMaxBudget] = useState<number>(Number(searchParams.get('budget')) || 0)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [foodOnly, setFoodOnly] = useState(searchParams.get('quickChip') === 'food' || false)
  const [zeroBrokerageOnly, setZeroBrokerageOnly] = useState(true)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'rating'>('recommended')

  // Load properties from API
  useEffect(() => {
    let isMounted = true
    async function fetchProperties() {
      try {
        setLoading(true)
        const res = await fetch('/api/properties')
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.properties)) {
          setProperties(data.properties)
        }
      } catch (err) {
        console.error('Failed to load properties in search page:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchProperties()
    return () => {
      isMounted = false
    }
  }, [])

  // Sync quickChip from URL
  useEffect(() => {
    const quickChip = searchParams.get('quickChip')
    if (quickChip) {
      if (quickChip === 'metro') {
        setSelectedAmenities((prev) => (prev.includes('near_metro') ? prev : [...prev, 'near_metro']))
      } else if (quickChip === 'food') {
        setFoodOnly(true)
      } else if (quickChip === 'single') {
        setSharingType('Single Room')
      } else if (quickChip === 'girls') {
        setGenderPref('girls')
      } else if (quickChip === 'boys') {
        setGenderPref('boys')
      } else if (quickChip === 'under10k') {
        setMaxBudget(10000)
      }
    }
  }, [searchParams])

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pgsetu_saved_ids') || localStorage.getItem('staysetu_saved_ids')
      if (saved) setSavedIds(JSON.parse(saved))
    } catch {}
  }, [])

  // Wishlist Toggle
  const handleToggleSave = (propertyId: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
      try {
        localStorage.setItem('pgsetu_saved_ids', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Compare Toggle
  const handleToggleCompare = (property: PropertyListing) => {
    setComparedProperties((prev) => {
      if (prev.some((p) => p.id === property.id)) {
        return prev.filter((p) => p.id !== property.id)
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 properties at a time.')
        return prev
      }
      return [...prev, property]
    })
  }

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCity('All Cities')
    setPropertyType('all')
    setGenderPref('all')
    setSharingType('all')
    setMaxBudget(0)
    setSelectedAmenities([])
    setFoodOnly(false)
    setVerifiedOnly(false)
    setSortBy('recommended')
    router.replace('/search')
  }

  // Toggle amenity
  const handleToggleAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((a) => a !== amenityId) : [...prev, amenityId]
    )
  }

  // Share search URL
  const handleShareSearch = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  // Active filters count for badges
  const activeFiltersCount = useMemo(() => {
    return (
      selectedAmenities.length +
      (propertyType !== 'all' ? 1 : 0) +
      (genderPref !== 'all' ? 1 : 0) +
      (sharingType !== 'all' ? 1 : 0) +
      (maxBudget > 0 ? 1 : 0) +
      (foodOnly ? 1 : 0) +
      (filterSavedOnly ? 1 : 0)
    )
  }, [
    selectedAmenities,
    propertyType,
    genderPref,
    sharingType,
    maxBudget,
    foodOnly,
    filterSavedOnly,
  ])

  // Filtered & Sorted properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter((item) => {
        // City filter
        if (
          selectedCity &&
          selectedCity !== 'All Cities' &&
          selectedCity !== 'all' &&
          item.city.toLowerCase() !== selectedCity.toLowerCase()
        ) {
          return false
        }

        // Property Type filter
        if (propertyType !== 'all') {
          if (propertyType === 'flat' && item.propertyType !== 'flat' && item.propertyType !== 'apartment') {
            return false
          } else if (propertyType !== 'flat' && item.propertyType !== propertyType) {
            return false
          }
        }

        // Gender filter
        if (genderPref !== 'all') {
          if (genderPref === 'girls' && item.genderPreference !== 'girls') return false
          if (genderPref === 'boys' && item.genderPreference !== 'boys') return false
          if (genderPref === 'coed' && item.genderPreference !== 'coed') return false
        }

        // Sharing / Occupancy
        if (sharingType !== 'all') {
          if (sharingType === 'Single Room' && item.sharingType !== 'Single Room') return false
          if (sharingType === 'Double Sharing' && item.sharingType !== 'Double Sharing') return false
          if (sharingType === 'Triple Sharing' && item.sharingType !== 'Triple Sharing') return false
          if (sharingType.includes('BHK')) {
            const hasBhk = item.title.toLowerCase().includes(sharingType.toLowerCase()) ||
              item.sharingType.toLowerCase().includes(sharingType.toLowerCase())
            if (!hasBhk) return false
          }
        }

        // Budget filter
        if (maxBudget > 0 && item.price > maxBudget) {
          return false
        }

        // Food Included filter
        if (foodOnly && !item.foodIncluded) {
          return false
        }

        // Verified filter
        if (verifiedOnly && !item.verified) {
          return false
        }

        // Amenities filter
        if (selectedAmenities.length > 0) {
          for (const a of selectedAmenities) {
            if (a === 'near_metro') {
              const isNearMetro =
                item.distanceToMetro.toLowerCase().includes('metro') ||
                item.distanceToMetro.toLowerCase().includes('min') ||
                item.distanceToMetro.toLowerCase().includes('m')
              if (!isNearMetro) return false
            } else if (a === 'food_included') {
              if (!item.foodIncluded) return false
            } else {
              const hasAmenity = item.amenities.some((itemA) =>
                itemA.toLowerCase().includes(a.replace('_', ' '))
              )
              if (!hasAmenity) return false
            }
          }
        }

        // Saved / Bookmarked filter
        if (filterSavedOnly && !savedIds.includes(item.id)) {
          return false
        }

        // Search text query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matches =
            item.title.toLowerCase().includes(q) ||
            item.locality.toLowerCase().includes(q) ||
            item.city.toLowerCase().includes(q) ||
            item.fullAddress.toLowerCase().includes(q) ||
            item.nearestLandmark.toLowerCase().includes(q) ||
            item.distanceToMetro.toLowerCase().includes(q) ||
            item.amenities.some((a) => a.toLowerCase().includes(q))
          if (!matches) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price
        if (sortBy === 'price_high') return b.price - a.price
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
        // Recommended default: featured, superhost, verified first
        const scoreA = (a.featured ? 4 : 0) + (a.superHost ? 2 : 0) + (a.verified ? 1 : 0)
        const scoreB = (b.featured ? 4 : 0) + (b.superHost ? 2 : 0) + (b.verified ? 1 : 0)
        return scoreB - scoreA
      })
  }, [
    properties,
    selectedCity,
    propertyType,
    genderPref,
    sharingType,
    maxBudget,
    foodOnly,
    verifiedOnly,
    selectedAmenities,
    searchQuery,
    sortBy,
    filterSavedOnly,
    savedIds,
  ])

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col selection:bg-[#DCFCE7] selection:text-[#14532D]">
      {/* Marketplace Top Navigation */}
      <MarketplaceNavbar
        onOpenListModal={() => setIsListModalOpen(true)}
        savedCount={savedIds.length}
        compareCount={comparedProperties.length}
        onOpenCompare={() => {}}
        onShowSaved={() => setIsSavedDrawerOpen(true)}
      />

      {/* Search Header Banner */}
      <div className="bg-gradient-to-b from-white to-[#F7FAF7] border-b border-gray-200/80 pt-3 pb-3 sm:pt-6 sm:pb-6 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Desktop Only: Breadcrumb & Title */}
          <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#647067] mb-1.5">
                <Link href="/" className="hover:text-[#16A34A] transition">Home</Link>
                <span>/</span>
                <span className="text-[#14532D] font-bold">Search PG & Flats</span>
                {selectedCity !== 'All Cities' && (
                  <>
                    <span>/</span>
                    <span className="text-[#16A34A] font-bold">{selectedCity}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#14532D]">
                Search Verified PGs, Flats & Rooms
              </h1>
              <p className="text-xs sm:text-sm text-[#647067] mt-1">
                Explore transparent living spaces with zero brokerage, verified owner passbooks, and instant booking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareSearch}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#17211B] shadow-2xs hover:border-gray-300 transition"
              >
                <Share2 className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>{copySuccess ? 'Copied Link!' : 'Share Filter'}</span>
              </button>
              <button
                onClick={() => setIsMapModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition"
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span>Map Search</span>
              </button>
            </div>
          </div>

          {/* Search Controls (Mobile-First Compact Row) */}
          <div className="mt-1 sm:mt-5 flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-[#16A34A]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search locality, PG name, metro..."
                  className="w-full rounded-xl sm:rounded-2xl border border-gray-200 bg-white py-2 sm:py-2.5 pl-9 sm:pl-10 pr-8 text-xs sm:text-sm font-medium text-[#17211B] placeholder-gray-400 focus:border-[#16A34A] focus:outline-hidden shadow-2xs transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 sm:top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className={`flex lg:hidden items-center gap-1 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-bold transition shadow-xs shrink-0 active:scale-95 ${
                  activeFiltersCount > 0
                    ? 'bg-[#14532D] text-white border border-[#14532D]'
                    : 'bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]'
                }`}
                aria-label="Open Filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#14532D]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Mobile Map Icon Button */}
              <button
                onClick={() => setIsMapModalOpen(true)}
                className="flex sm:hidden items-center justify-center h-9 w-9 rounded-xl bg-white border border-gray-200 text-[#14532D] shadow-xs shrink-0 active:scale-95"
                title="Map View"
                aria-label="Map View"
              >
                <MapIcon className="h-4 w-4 text-[#16A34A]" />
              </button>
            </div>

            {/* City Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
              <span className="text-xs font-bold text-[#647067] mr-1 shrink-0 hidden sm:inline">Cities:</span>
              {CITIES_LIST.map((city) => {
                const isSelected = selectedCity === city
                return (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold shrink-0 transition active:scale-95 ${
                      isSelected
                        ? 'bg-[#14532D] text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-[#17211B] hover:border-[#16A34A] hover:bg-[#DCFCE7]/30'
                    }`}
                  >
                    {city}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter & Results Container */}
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 py-3 sm:py-6 flex-1 w-full pb-28 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Desktop Filter Sidebar (4 cols) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 no-scrollbar">
            <div className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1.5 font-bold text-[#14532D] text-sm">
                  <SlidersHorizontal className="h-4 w-4 text-[#16A34A]" />
                  <span>Refine Search</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset All</span>
                </button>
              </div>

              {/* Property Type Radio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">
                  Space Type
                </label>
                <div className="space-y-1.5">
                  {PROPERTY_TYPES.map((pt) => (
                    <label
                      key={pt.id}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-[#F7FAF7] transition"
                    >
                      <span className={propertyType === pt.id ? 'text-[#14532D] font-bold' : 'text-[#17211B]'}>
                        {pt.label}
                      </span>
                      <input
                        type="radio"
                        name="propertyType"
                        checked={propertyType === pt.id}
                        onChange={() => setPropertyType(pt.id)}
                        className="accent-[#16A34A] h-3.5 w-3.5"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Gender Preference */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">
                  Tenant Gender
                </label>
                <div className="space-y-1.5">
                  {GENDER_OPTIONS.map((g) => (
                    <label
                      key={g.id}
                      className="flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-[#F7FAF7] transition"
                    >
                      <span className={genderPref === g.id ? 'text-[#14532D] font-bold' : 'text-[#17211B]'}>
                        {g.label}
                      </span>
                      <input
                        type="radio"
                        name="genderPref"
                        checked={genderPref === g.id}
                        onChange={() => setGenderPref(g.id)}
                        className="accent-[#16A34A] h-3.5 w-3.5"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Occupancy / Sharing */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">
                  Sharing & Occupancy
                </label>
                <select
                  value={sharingType}
                  onChange={(e) => setSharingType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-2 px-3 text-xs font-semibold text-[#17211B] focus:border-[#16A34A] focus:bg-white focus:outline-hidden transition"
                >
                  {SHARING_OPTIONS.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      {sh.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Range */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#647067]">
                    Max Rent / Mo
                  </label>
                  <span className="text-xs font-extrabold text-[#14532D]">
                    {maxBudget > 0 ? `₹${maxBudget.toLocaleString('en-IN')}` : 'Any Budget'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  {BUDGET_PRESETS.map((bp) => (
                    <button
                      key={bp.value}
                      onClick={() => setMaxBudget(bp.value)}
                      className={`py-1 px-2 rounded-lg text-[11px] font-semibold transition ${
                        maxBudget === bp.value
                          ? 'bg-[#16A34A] text-white'
                          : 'bg-[#F7FAF7] text-[#17211B] hover:bg-gray-100'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food / Mess toggle */}
              <div className="border-t border-gray-100 pt-3">
                <label className="flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-[#F7FAF7] transition">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-[#16A34A]" />
                    <span>Food Included Only</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={foodOnly}
                    onChange={(e) => setFoodOnly(e.target.checked)}
                    className="accent-[#16A34A] h-4 w-4 rounded-sm"
                  />
                </label>
              </div>

              {/* Amenities Checklist */}
              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">
                  Amenities & Facilities
                </label>
                <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar pr-1">
                  {AMENITY_FILTERS.map((am) => (
                    <label
                      key={am.id}
                      className="flex items-center justify-between p-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-[#F7FAF7] transition"
                    >
                      <span className={selectedAmenities.includes(am.id) ? 'font-bold text-[#14532D]' : 'text-gray-700'}>
                        {am.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(am.id)}
                        onChange={() => handleToggleAmenity(am.id)}
                        className="accent-[#16A34A] h-3.5 w-3.5 rounded-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results Grid Area (9 cols on desktop, 12 on mobile) */}
          <main className="col-span-1 lg:col-span-9 space-y-4">
            {/* Top Toolbar: Count, Quick Filters, Sort Dropdown */}
            <div className="rounded-xl sm:rounded-2xl border border-gray-200/90 bg-white p-2 sm:p-3.5 shadow-2xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs sm:text-sm font-extrabold text-[#14532D] truncate">
                  {filteredProperties.length} {filteredProperties.length === 1 ? 'Space' : 'Spaces'}
                </span>
                {selectedCity !== 'All Cities' && (
                  <span className="rounded-md bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#14532D] truncate">
                    in {selectedCity}
                  </span>
                )}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[10px] font-bold text-rose-600 hover:underline shrink-0 ml-1"
                  >
                    Clear ({activeFiltersCount})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <ArrowUpDown className="h-3 w-3 text-[#16A34A] hidden sm:inline" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="rounded-lg sm:rounded-xl border border-gray-200 bg-[#F7FAF7] py-1 pl-2 pr-6 text-[11px] sm:text-xs font-bold text-[#17211B] focus:border-[#16A34A] focus:outline-hidden transition"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Badges Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {/* Saved Properties Pill */}
              <button
                onClick={() => {
                  if (savedIds.length === 0) {
                    setIsSavedDrawerOpen(true)
                  } else {
                    setFilterSavedOnly(!filterSavedOnly)
                  }
                }}
                className={`rounded-full px-3 py-1 text-xs font-bold shrink-0 transition active:scale-95 inline-flex items-center gap-1.5 ${
                  filterSavedOnly
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                }`}
              >
                <Heart className={`h-3 w-3 ${filterSavedOnly ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
                <span>Saved ({savedIds.length})</span>
              </button>
              {[
                { label: 'Near Metro', key: 'near_metro' },
                { label: 'Food Included', key: 'food_included' },
                { label: 'Private Single Room', key: 'single_room' },
                { label: 'Girls Only', key: 'girls_only' },
                { label: 'Under ₹12k', key: 'under_12k' },
                { label: 'AC Rooms', key: 'ac_rooms' },
              ].map((pill) => {
                const isActive =
                  (pill.key === 'near_metro' && selectedAmenities.includes('near_metro')) ||
                  (pill.key === 'food_included' && foodOnly) ||
                  (pill.key === 'single_room' && sharingType === 'Single Room') ||
                  (pill.key === 'girls_only' && genderPref === 'girls') ||
                  (pill.key === 'under_12k' && maxBudget === 12000) ||
                  (pill.key === 'ac_rooms' && selectedAmenities.includes('ac'))

                return (
                  <button
                    key={pill.key}
                    onClick={() => {
                      if (pill.key === 'near_metro') handleToggleAmenity('near_metro')
                      else if (pill.key === 'food_included') setFoodOnly(!foodOnly)
                      else if (pill.key === 'single_room') setSharingType(sharingType === 'Single Room' ? 'all' : 'Single Room')
                      else if (pill.key === 'girls_only') setGenderPref(genderPref === 'girls' ? 'all' : 'girls')
                      else if (pill.key === 'under_12k') setMaxBudget(maxBudget === 12000 ? 0 : 12000)
                      else if (pill.key === 'ac_rooms') handleToggleAmenity('ac')
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition active:scale-95 ${
                      isActive
                        ? 'bg-[#16A34A] text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-[#17211B] hover:border-[#16A34A] hover:bg-[#DCFCE7]/30'
                    }`}
                  >
                    {isActive ? `✓ ${pill.label}` : pill.label}
                  </button>
                )
              })}
            </div>

            {/* Loading Skeleton or Empty State or Grid Results */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 rounded-2xl bg-white border border-gray-200/80 animate-pulse p-4 space-y-3">
                    <div className="h-44 bg-gray-200 rounded-xl w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="rounded-3xl border border-gray-200/90 bg-white p-10 text-center space-y-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#16A34A]">
                  <Home className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-[#14532D]">No spaces match your exact criteria</h3>
                <p className="text-xs sm:text-sm text-[#647067] max-w-md mx-auto">
                  Try broadening your budget, clearing selected amenities, or switching to &ldquo;All Cities&rdquo; to view more verified spaces.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-3">
                {filteredProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    onSelectDetails={(p) => router.push(`/property/${p.id}`)}
                    isSaved={savedIds.includes(prop.id)}
                    onToggleSave={handleToggleSave}
                    isCompared={comparedProperties.some((cp) => cp.id === prop.id)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Slide-over Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs lg:hidden animate-in fade-in">
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#14532D] text-base">Filter Spaces</h3>
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-[#DCFCE7] text-[#14532D] font-bold text-[10px] px-2 py-0.5">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Space Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">Space Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      onClick={() => setPropertyType(pt.id)}
                      className={`p-2 rounded-xl text-xs font-semibold text-left transition active:scale-98 ${
                        propertyType === pt.id
                          ? 'bg-[#14532D] text-white shadow-xs font-bold'
                          : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occupancy / Sharing Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">Occupancy & Sharing</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SHARING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSharingType(opt.id)}
                      className={`p-2 rounded-xl text-xs font-semibold text-left transition active:scale-98 ${
                        sharingType === opt.id
                          ? 'bg-[#14532D] text-white shadow-xs font-bold'
                          : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Preference */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">Gender Preference</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGenderPref(g.id)}
                      className={`p-2 rounded-xl text-xs font-semibold text-left transition active:scale-98 ${
                        genderPref === g.id
                          ? 'bg-[#14532D] text-white shadow-xs font-bold'
                          : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">Max Budget</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {BUDGET_PRESETS.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setMaxBudget(b.value)}
                      className={`p-2 rounded-xl text-xs font-semibold text-left transition active:scale-98 ${
                        maxBudget === b.value
                          ? 'bg-[#16A34A] text-white shadow-xs font-bold'
                          : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Only */}
              <div>
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 text-xs font-bold cursor-pointer">
                  <span>Food / Meals Included</span>
                  <input
                    type="checkbox"
                    checked={foodOnly}
                    onChange={(e) => setFoodOnly(e.target.checked)}
                    className="accent-[#16A34A] h-4 w-4 rounded-sm"
                  />
                </label>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">Amenities</label>
                <div className="space-y-1.5">
                  {AMENITY_FILTERS.map((a) => (
                    <label key={a.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 text-xs font-medium cursor-pointer hover:bg-gray-100">
                      <span>{a.label}</span>
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(a.id)}
                        onChange={() => handleToggleAmenity(a.id)}
                        className="accent-[#16A34A] h-4 w-4 rounded-sm"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="p-3 border-t border-gray-100 bg-white/95 backdrop-blur-md flex items-center gap-2 shrink-0 shadow-lg safe-bottom">
              <button
                onClick={handleResetFilters}
                className="w-1/3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] text-xs font-bold text-white shadow-xs active:scale-95 transition"
              >
                Apply ({filteredProperties.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          isSaved={savedIds.includes(selectedProperty.id)}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* Property Compare Drawer */}
      <PropertyCompareDrawer
        comparedProperties={comparedProperties}
        onRemoveFromCompare={(id) => setComparedProperties((prev) => prev.filter((p) => p.id !== id))}
        onClearCompare={() => setComparedProperties([])}
        onSelectDetails={(p) => router.push(`/property/${p.id}`)}
      />

      {/* Interactive Map Discovery Modal */}
      {isMapModalOpen && (
        <MapDiscoveryModal
          properties={filteredProperties}
          selectedProperty={selectedProperty}
          onSelectProperty={(p) => router.push(`/property/${p.id}`)}
          onClose={() => setIsMapModalOpen(false)}
          isModal={true}
        />
      )}

      {/* List Property Modal */}
      <ListPropertyModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onListingCreated={(newP) => {
          setProperties((prev) => [newP, ...prev])
          setSelectedProperty(newP)
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        savedCount={savedIds.length}
        compareCount={comparedProperties.length}
        onShowSaved={() => setIsSavedDrawerOpen(true)}
        onOpenCompare={() => {}}
        onOpenListModal={() => setIsListModalOpen(true)}
      />

      {/* Saved Properties Drawer */}
      <SavedPropertiesModal
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        properties={properties}
        savedIds={savedIds}
        onToggleSave={handleToggleSave}
      />

      {/* Footer */}
      <MarketplaceFooter />
    </div>
  )
}

export default function SearchPGPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7FAF7]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#16A34A] border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-[#647067]">Loading Search Spaces...</span>
          </div>
        </div>
      }
    >
      <SearchPGContent />
    </Suspense>
  )
}
