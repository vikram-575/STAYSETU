'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Star,
  MapPin,
  Train,
  CheckCircle2,
  ShieldCheck,
  Utensils,
  Wifi,
  Wind,
  Zap,
  GitCompare,
  Eye,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react'
import { PropertyListing } from '@/types/marketplace'

interface PropertyCardProps {
  property: PropertyListing
  onSelectDetails?: (property: PropertyListing) => void
  isSaved?: boolean
  onToggleSave?: (propertyId: string) => void
  isCompared?: boolean
  onToggleCompare?: (property: PropertyListing) => void
}

export function PropertyCard({
  property,
  onSelectDetails,
  isSaved = false,
  onToggleSave,
  isCompared = false,
  onToggleCompare,
}: PropertyCardProps) {
  const router = useRouter()
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

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

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleSave) {
      onToggleSave(property.id)
    }
  }

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleCompare) {
      onToggleCompare(property)
    }
  }

  const getGenderBadge = () => {
    switch (property.genderPreference) {
      case 'girls':
        return { label: 'Girls Only', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
      case 'boys':
        return { label: 'Boys Only', bg: 'bg-blue-50 text-blue-700 border-blue-200' }
      case 'coed':
        return { label: 'Co-ed Living', bg: 'bg-purple-50 text-purple-700 border-purple-200' }
      default:
        return { label: 'All Welcome', bg: 'bg-gray-100 text-gray-700 border-gray-200' }
    }
  }

  const gender = getGenderBadge()

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#16A34A]/60 hover:shadow-xl cursor-pointer"
    >
      {/* Aspect Ratio Image Container */}
      <div className="relative aspect-[16/11] sm:aspect-4/3 w-full overflow-hidden bg-gray-100">
        <img
          src={property.images[currentImageIdx] || property.coverImage}
          alt={property.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges Left */}
        <div className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 flex flex-wrap items-center gap-1 sm:gap-1.5 z-10 max-w-[calc(100%-36px)]">
          {property.verified && (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-md bg-[#16A34A] px-1 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-white shadow-xs">
              <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span>Verified</span>
            </span>
          )}
          {property.zeroBrokerage && (
            <span className="hidden xs:inline-block sm:inline-block rounded-md bg-[#DCFCE7] px-1 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-[#14532D] shadow-xs">
              Zero Brokerage
            </span>
          )}
          {property.superHost && (
            <span className="hidden sm:inline-block rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#F59E0B] shadow-xs">
              ★ Super Host
            </span>
          )}
        </div>

        {/* Top Actions Right: Wishlist Heart */}
        <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5 flex items-center gap-1 z-10">
          <button
            onClick={handleSaveClick}
            className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full backdrop-blur-md transition shadow-xs ${
              isSaved
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/85 text-gray-700 hover:bg-white hover:text-rose-500'
            }`}
            aria-label="Save to favorites"
          >
            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Carousel Controls (Always touch accessible on mobile, hover on desktop) */}
        {property.images.length > 1 && (
          <div className="absolute inset-y-0 inset-x-1 sm:inset-x-2 flex items-center justify-between opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={handlePrevImage}
              className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 active:scale-90 transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 active:scale-90 transition"
              aria-label="Next image"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}

        {/* Bottom Image Overlay: Sharing & Rating */}
        <div className="absolute bottom-1.5 sm:bottom-2.5 inset-x-1.5 sm:inset-x-2.5 flex items-center justify-between text-white z-10">
          <span className="rounded-lg bg-black/60 px-2 py-0.5 text-xs font-semibold backdrop-blur-xs">
            {property.sharingType}
          </span>

          <div className="flex items-center gap-1 rounded-lg bg-white/95 px-2 py-0.5 text-xs font-bold text-[#17211B] shadow-xs">
            <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
            <span>{property.rating.toFixed(1)}</span>
            <span className="hidden xs:inline sm:inline text-xs text-[#647067]">({property.reviewCount})</span>
          </div>
        </div>

        {/* Image Dots Indicator */}
        {property.images.length > 1 && (
          <div className="absolute bottom-0.5 inset-x-0 flex justify-center gap-1">
            {property.images.slice(0, 4).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === currentImageIdx ? 'w-3 bg-white' : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-2 sm:p-4">
        <div>
          {/* Gender & Availability Pill */}
          <div className="flex items-center justify-between text-xs gap-1">
            <span className={`rounded-lg border px-2 py-0.5 font-bold shrink-0 text-xs ${gender.bg}`}>
              {gender.label}
            </span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg truncate text-xs">
              {property.availableBeds > 0
                ? `${property.availableBeds} beds`
                : 'Limited'}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-1 sm:mt-2 text-xs sm:text-base font-bold text-[#17211B] line-clamp-1 group-hover:text-[#16A34A] transition leading-tight">
            {property.title}
          </h3>

          {/* Locality */}
          <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-xs text-[#647067]">
            <MapPin className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
            <span className="truncate">
              {property.locality}, {property.city}
            </span>
          </div>

          {/* Distance to Metro (Issue 5 Fix: standardized text-xs (12px) for readability) */}
          <div className="hidden sm:flex mt-0.5 items-center gap-1.5 text-xs text-[#647067]">
            <Train className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{property.distanceToMetro}</span>
          </div>

          {/* Key Amenities Preview */}
          <div className="mt-1 sm:mt-2.5 flex flex-wrap gap-1 sm:gap-1.5 border-t border-gray-100 pt-1 sm:pt-2">
            {property.foodIncluded && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#DCFCE7]/70 px-2 py-0.5 text-xs font-semibold text-[#14532D]">
                <Utensils className="h-2.5 w-2.5" />
                <span>Meals</span>
              </span>
            )}
            {property.amenities.slice(0, 1).map((amenity, i) => (
              <span
                key={i}
                className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-[#17211B] truncate max-w-[90px]"
              >
                {amenity.replace(/\(.*?\)/g, '').trim()}
              </span>
            ))}
            {property.amenities.slice(1, 3).map((amenity, i) => (
              <span
                key={i}
                className="hidden sm:inline-block rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-medium text-[#17211B]"
              >
                {amenity.replace(/\(.*?\)/g, '').trim()}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="hidden sm:inline-block rounded-lg bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-[#647067]">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Bottom Action Row */}
        <div className="mt-1.5 sm:mt-3 border-t border-gray-100 pt-1.5 sm:pt-2.5">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-xl font-extrabold text-[#14532D]">
                  ₹{property.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#647067]">/mo</span>
              </div>
              <p className="hidden sm:block text-xs text-[#647067] truncate">
                Deposit: ₹{property.deposit.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Compare Toggle (desktop only) */}
              <button
                onClick={handleCompareClick}
                className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition active:scale-95 cursor-pointer ${
                  isCompared
                    ? 'border-[#16A34A] bg-[#DCFCE7] text-[#14532D]'
                    : 'border-gray-200 text-[#647067] hover:border-gray-300 hover:text-[#17211B]'
                }`}
                title={isCompared ? 'Remove from compare' : 'Add to compare'}
              >
                <GitCompare className="h-3.5 w-3.5" />
              </button>

              {/* View Details CTA */}
              <Link
                href={`/property/${property.id}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onSelectDetails) {
                    onSelectDetails(property)
                  }
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-[#14532D] px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#16A34A] transition active:scale-95"
              >
                <span>View</span>
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
