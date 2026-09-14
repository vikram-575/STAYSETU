'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  X,
  MapPin,
  Building2,
  Trash2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { PropertyListing } from '@/types/marketplace'

interface SavedPropertiesModalProps {
  isOpen: boolean
  onClose: () => void
  properties?: PropertyListing[]
  savedIds: string[]
  onToggleSave: (propertyId: string) => void
  onClearAll?: () => void
}

export function SavedPropertiesModal({
  isOpen,
  onClose,
  properties = [],
  savedIds = [],
  onToggleSave,
  onClearAll,
}: SavedPropertiesModalProps) {
  const router = useRouter()
  const [localProperties, setLocalProperties] = useState<PropertyListing[]>(properties)
  const [loading, setLoading] = useState(false)

  // Fetch properties if empty
  useEffect(() => {
    if (properties.length > 0) {
      setLocalProperties(properties)
    } else if (isOpen) {
      let isMounted = true
      async function loadProps() {
        setLoading(true)
        try {
          const res = await fetch('/api/properties')
          const data = await res.json()
          if (isMounted && data.success && Array.isArray(data.properties)) {
            setLocalProperties(data.properties)
          }
        } catch {} finally {
          if (isMounted) setLoading(false)
        }
      }
      loadProps()
      return () => {
        isMounted = false
      }
    }
  }, [properties, isOpen])

  if (!isOpen) return null

  const savedListings = localProperties.filter((p) => savedIds.includes(p.id))

  const handleCardClick = (id: string) => {
    onClose()
    router.push(`/property/${id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden max-h-[88dvh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3.5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Heart className="h-4.5 w-4.5 fill-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#17211B]">
                Saved PGs & Flats
              </h3>
              <p className="text-[11px] text-[#647067]">
                {savedListings.length} {savedListings.length === 1 ? 'space bookmarked' : 'spaces bookmarked'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition"
            aria-label="Close saved drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedListings.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-400 mb-3">
                <Heart className="h-7 w-7" />
              </div>
              <h4 className="text-base font-bold text-[#14532D]">No saved spaces yet</h4>
              <p className="text-xs text-[#647067] max-w-xs mx-auto mt-1">
                Tap the heart icon on any PG card to bookmark it for later review and comparison.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => {
                    onClose()
                    router.push('/search')
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Browse Verified PGs</span>
                </button>
              </div>
            </div>
          ) : (
            savedListings.map((property) => (
              <div
                key={property.id}
                onClick={() => handleCardClick(property.id)}
                className="group relative flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-white p-2.5 shadow-2xs hover:border-[#16A34A]/60 hover:shadow-md transition cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={property.coverImage || property.images[0]}
                    alt={property.title}
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.2 text-[8px] font-bold text-white">
                    {property.sharingType.split(' ')[0]}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                    {property.verified && (
                      <span className="inline-flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3 text-[#16A34A]" />
                        <span>Verified</span>
                      </span>
                    )}
                    <span>·</span>
                    <span className="truncate">{property.city}</span>
                  </div>

                  <h4 className="text-xs font-bold text-[#17211B] line-clamp-1 group-hover:text-[#16A34A] transition">
                    {property.title}
                  </h4>

                  <div className="flex items-center gap-0.5 text-[10px] text-[#647067] truncate mt-0.5">
                    <MapPin className="h-2.5 w-2.5 text-[#16A34A] shrink-0" />
                    <span className="truncate">{property.locality}</span>
                  </div>

                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xs font-black text-[#14532D]">
                      ₹{property.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-[#647067]">/mo</span>
                  </div>
                </div>

                {/* Right Action: Unsave */}
                <div className="flex flex-col items-end justify-between h-full shrink-0 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleSave(property.id)
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-90 transition"
                    title="Remove from saved"
                  >
                    <Heart className="h-3.5 w-3.5 fill-rose-600" />
                  </button>

                  <span className="text-[10px] font-bold text-[#14532D] group-hover:text-[#16A34A] flex items-center gap-0.5">
                    <span>View</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedListings.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/80 p-3 flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => {
                if (confirm('Clear all saved properties?')) {
                  savedListings.forEach((p) => onToggleSave(p.id))
                  if (onClearAll) onClearAll()
                }
              }}
              className="text-[11px] font-semibold text-gray-500 hover:text-rose-600 transition"
            >
              Clear All
            </button>

            <button
              onClick={() => {
                onClose()
                router.push('/search')
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#14532D] hover:text-[#16A34A] transition"
            >
              <span>Explore More Spaces</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
