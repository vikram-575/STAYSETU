'use client'

import React, { useState } from 'react'
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
  onSelectDetails: (property: PropertyListing) => void
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
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

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
      onClick={() => onSelectDetails(property)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#16A34A]/60 hover:shadow-xl cursor-pointer"
    >
      {/* 4:3 Aspect Ratio Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
        <img
          src={property.images[currentImageIdx] || property.coverImage}
          alt={property.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-103"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              <ShieldCheck className="h-3 w-3" />
              <span>Verified</span>
            </span>
          )}
          {property.zeroBrokerage && (
            <span className="rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#14532D] shadow-xs">
              Zero Brokerage
            </span>
          )}
          {property.superHost && (
            <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#F59E0B] shadow-xs">
              ★ Super Host
            </span>
          )}
        </div>

        {/* Top Actions Right: Wishlist Heart */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            onClick={handleSaveClick}
            className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition ${
              isSaved
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white/80 text-gray-700 hover:bg-white hover:text-rose-500'
            }`}
            aria-label="Save to favorites"
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Carousel Prev/Next Controls (visible on hover) */}
        {property.images.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10">
            <button
              onClick={handlePrevImage}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Bottom Image Overlay: Sharing & Rating */}
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-white z-10">
          <span className="rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-xs">
            {property.sharingType}
          </span>

          <div className="flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#17211B] shadow-xs">
            <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
            <span>{property.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-500">({property.reviewCount})</span>
          </div>
        </div>

        {/* Image Dots Indicator */}
        {property.images.length > 1 && (
          <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1">
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
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Gender & Availability Pill */}
          <div className="flex items-center justify-between text-[11px]">
            <span className={`rounded-sm border px-2 py-0.5 font-bold ${gender.bg}`}>
              {gender.label}
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
              {property.availableBeds > 0
                ? `${property.availableBeds} beds vacant`
                : 'Limited Availability'}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-2 text-base font-bold text-[#17211B] line-clamp-1 group-hover:text-[#16A34A] transition">
            {property.title}
          </h3>

          {/* Locality & Distance to Metro */}
          <div className="mt-1 flex items-center gap-1 text-xs text-[#647067]">
            <MapPin className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
            <span className="line-clamp-1">
              {property.locality}, {property.city}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
            <Train className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{property.distanceToMetro}</span>
          </div>

          {/* Key Amenities Preview */}
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2.5">
            {property.foodIncluded && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7]/70 px-2 py-0.5 text-[10px] font-semibold text-[#14532D]">
                <Utensils className="h-2.5 w-2.5" />
                <span>Meals Inc.</span>
              </span>
            )}
            {property.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
              >
                {amenity.replace(/\(.*?\)/g, '').trim()}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Bottom Action Row */}
        <div className="mt-4 border-t border-gray-100 pt-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-extrabold text-[#14532D]">
                  ₹{property.price.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#647067]">/month</span>
              </div>
              <p className="text-[10px] text-gray-500">
                Deposit: ₹{property.deposit.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Compare Toggle */}
              <button
                onClick={handleCompareClick}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition ${
                  isCompared
                    ? 'border-[#16A34A] bg-[#DCFCE7] text-[#14532D]'
                    : 'border-gray-200 text-[#647067] hover:border-gray-300 hover:text-[#17211B]'
                }`}
                title={isCompared ? 'Remove from compare' : 'Add to compare'}
              >
                <GitCompare className="h-3.5 w-3.5" />
              </button>

              {/* View Details CTA */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectDetails(property)
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-[#14532D] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#16A34A] transition"
              >
                <span>View</span>
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
