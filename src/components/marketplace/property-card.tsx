'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Star,
  MapPin,
  ShieldCheck,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { PropertyListing } from '@/types/marketplace'

interface PropertyCardProps {
  property: PropertyListing
  onSelectDetails?: (property: PropertyListing) => void
  isSaved?: boolean
  onToggleSave?: (propertyId: string) => void
  isCompared?: boolean
  onToggleCompare?: (property: PropertyListing) => void
  distanceKm?: number
}

function formatAmenity(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/_/g, ' ')
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function PropertyCard({
  property,
  onSelectDetails,
  isSaved = false,
  onToggleSave,
  distanceKm,
}: PropertyCardProps) {
  const router = useRouter()
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  // Mobile Touch Swipe State
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  const handleCardClick = () => {
    if (onSelectDetails) {
      onSelectDetails(property)
    } else {
      router.push(`/property/${property.id}`)
    }
  }

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : property.images.length - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIdx((prev) => (prev < property.images.length - 1 ? prev + 1 : 0))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchEndX === null) return
    const distance = touchStartX - touchEndX
    const minSwipeDistance = 40

    if (distance > minSwipeDistance && property.images.length > 1) {
      // Swiped Left -> Next image
      e.stopPropagation()
      setCurrentImageIdx((prev) => (prev < property.images.length - 1 ? prev + 1 : 0))
    } else if (distance < -minSwipeDistance && property.images.length > 1) {
      // Swiped Right -> Previous image
      e.stopPropagation()
      setCurrentImageIdx((prev) => (prev > 0 ? prev - 1 : property.images.length - 1))
    }

    setTouchStartX(null)
    setTouchEndX(null)
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleSave) {
      onToggleSave(property.id)
    }
  }

  const getGenderBadge = () => {
    switch (property.genderPreference) {
      case 'girls':
        return { label: 'Girls Only', bg: 'bg-rose-50 text-rose-700 border-rose-200/80' }
      case 'boys':
        return { label: 'Boys Only', bg: 'bg-blue-50 text-blue-700 border-blue-200/80' }
      case 'coed':
        return { label: 'Co-ed Living', bg: 'bg-purple-50 text-purple-700 border-purple-200/80' }
      default:
        return { label: 'All Welcome', bg: 'bg-gray-100 text-gray-700 border-gray-200/80' }
    }
  }

  const gender = getGenderBadge()

  // Format Street Address
  const streetAddress =
    property.fullAddress ||
    (property.locality && property.locality.toLowerCase() !== property.city.toLowerCase()
      ? `${property.locality}, ${property.city}`
      : `${property.city || 'India'}`)

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/85 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/50 hover:shadow-xl cursor-pointer"
    >
      {/* Aspect Ratio Image Container with Touch Swipe */}
      <div
        className="relative aspect-[16/10] sm:aspect-4/3 w-full overflow-hidden bg-gray-100 select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={property.images[currentImageIdx] || property.coverImage}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 pointer-events-none" />

        {/* Top Badges Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 max-w-[calc(100%-48px)]">
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#16A34A]/95 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified</span>
            </span>
          )}
          {property.zeroBrokerage && (
            <span className="hidden xs:inline-block rounded-full bg-emerald-950/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              Zero Brokerage
            </span>
          )}
          {distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-black text-emerald-300 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)}m away`
                  : `${distanceKm.toFixed(1)} km`}
              </span>
            </span>
          )}
        </div>

        {/* Top Action Right: Wishlist Heart */}
        <div className="absolute top-2.5 right-2.5 flex items-center z-10">
          <button
            onClick={handleSaveClick}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm active:scale-90 ${
              isSaved
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : 'bg-white/90 text-gray-700 hover:bg-white hover:text-rose-500'
            }`}
            aria-label="Save to favorites"
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Desktop Carousel Controls (Hover only, hidden on mobile touch) */}
        {property.images.length > 1 && (
          <div className="hidden sm:flex absolute inset-y-0 inset-x-2 items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
            <button
              onClick={handlePrevImage}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 active:scale-90 transition shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 active:scale-90 transition shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Bottom Image Overlay: Sharing & Rating */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-white z-10">
          <span className="rounded-full bg-black/65 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold tracking-wide">
            {property.sharingType}
          </span>

          {property.rating > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-[#17211B] shadow-xs">
              <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
              <span>{property.rating.toFixed(1)}</span>
              {property.reviewCount > 0 && (
                <span className="text-[10px] text-[#647067] font-medium">({property.reviewCount})</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-xs">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>New</span>
            </div>
          )}
        </div>

        {/* Carousel Dots */}
        {property.images.length > 1 && (
          <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1 z-10 pointer-events-none">
            {property.images.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentImageIdx ? 'w-3.5 bg-white shadow-xs' : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div>
          {/* Gender & Availability Pill Row */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            <span className={`rounded-md border px-2 py-0.5 font-bold shrink-0 text-[11px] ${gender.bg}`}>
              {gender.label}
            </span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md truncate text-[11px] border border-emerald-200/50">
              {property.availableBeds > 0
                ? `${property.availableBeds} beds available`
                : 'Fast Filling'}
            </span>
          </div>

          {/* PG Name */}
          <h3 className="mt-2 text-base sm:text-lg font-black text-[#17211B] line-clamp-1 group-hover:text-[#16A34A] transition leading-snug">
            {property.title}
          </h3>

          {/* Street Address */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#647067]">
            <MapPin className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
            <span className="truncate font-medium" title={streetAddress}>
              {streetAddress}
            </span>
          </div>

          {/* Key Amenities Preview */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-2">
            {property.foodIncluded && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-semibold text-[#14532D]">
                <Utensils className="h-2.5 w-2.5" />
                <span>Meals</span>
              </span>
            )}
            {property.amenities.slice(0, 2).map((amenity, i) => (
              <span
                key={i}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-[#17211B] truncate max-w-[120px]"
              >
                {formatAmenity(amenity)}
              </span>
            ))}
            {property.amenities.length > 2 && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-[#647067]">
                +{property.amenities.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA Row */}
        <div className="mt-3.5 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black text-[#14532D] tracking-tight">
                  ₹{property.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#647067] font-semibold">/mo</span>
              </div>
              <p className="text-[11px] text-[#647067] truncate font-medium">
                Deposit: ₹{property.deposit.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#DCFCE7] text-[#14532D] text-xs font-black group-hover:bg-[#16A34A] group-hover:text-white transition shadow-2xs shrink-0">
              <span>Explore</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
