'use client'

import React, { useState } from 'react'
import {
  X,
  GitCompare,
  Trash2,
  CheckCircle,
  Eye,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
} from 'lucide-react'
import { PropertyListing } from '@/types/marketplace'

interface PropertyCompareDrawerProps {
  comparedProperties: PropertyListing[]
  onRemoveFromCompare: (propertyId: string) => void
  onClearCompare: () => void
  onSelectDetails: (property: PropertyListing) => void
}

export function PropertyCompareDrawer({
  comparedProperties,
  onRemoveFromCompare,
  onClearCompare,
  onSelectDetails,
}: PropertyCompareDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (comparedProperties.length === 0) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-[#16A34A] shadow-2xl transition-all duration-300">
      {/* Drawer Header Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#14532D]">
            <GitCompare className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#14532D]">
              Comparing {comparedProperties.length} Properties
            </span>
            <span className="ml-2 text-[11px] text-[#647067] hidden sm:inline">
              (Maximum 4 properties)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand Comparison'}</span>
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={onClearCompare}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Expanded Side-by-side Table */}
      {isExpanded && (
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 overflow-x-auto max-h-[50vh]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-400">
                <th className="py-2 pr-4 font-bold text-gray-500 uppercase tracking-wider w-36">
                  Feature
                </th>
                {comparedProperties.map((p) => (
                  <th key={p.id} className="py-2 px-3 min-w-[200px] w-64">
                    <div className="relative flex items-center justify-between">
                      <span className="font-bold text-[#17211B] line-clamp-1">{p.title}</span>
                      <button
                        onClick={() => onRemoveFromCompare(p.id)}
                        className="text-gray-400 hover:text-rose-600"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#17211B]">
              {/* Photo & Action Row */}
              <tr>
                <td className="py-2.5 font-bold text-gray-500">Preview</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2.5 px-3">
                    <div className="aspect-16/10 w-full overflow-hidden rounded-lg bg-gray-100">
                      <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover" />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Monthly Rent */}
              <tr>
                <td className="py-2 font-bold text-gray-500">Monthly Rent</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3">
                    <span className="text-sm font-extrabold text-[#14532D]">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-500"> /mo</span>
                  </td>
                ))}
              </tr>

              {/* Security Deposit */}
              <tr>
                <td className="py-2 font-bold text-gray-500">Security Deposit</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3 font-semibold">
                    ₹{p.deposit.toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              {/* Sharing / Room Type */}
              <tr>
                <td className="py-2 font-bold text-gray-500">Room Type</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3 font-medium">
                    <span className="rounded-sm bg-gray-100 px-2 py-0.5 text-[11px]">
                      {p.sharingType}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Food & Meals */}
              <tr>
                <td className="py-2 font-bold text-gray-500">Food / Meals</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3">
                    {p.foodIncluded ? (
                      <span className="font-semibold text-[#16A34A]">✓ 3 Meals Included</span>
                    ) : (
                      <span className="text-gray-400">Self Cooking / None</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Furnishing */}
              <tr>
                <td className="py-2 font-bold text-gray-500">Furnishing</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3 capitalize">
                    {p.furnishing.replace('_', ' ')}
                  </td>
                ))}
              </tr>

              {/* Metro & Locality */}
              <tr>
                <td className="py-2 font-bold text-gray-500">Location</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3 text-[11px] text-gray-600">
                    <div>
                      {p.locality}, {p.city}
                    </div>
                    <div className="text-[10px] text-gray-400">{p.distanceToMetro}</div>
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr>
                <td className="py-2 font-bold text-gray-500">User Rating</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3">
                    <div className="flex items-center gap-1 font-bold">
                      <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                      <span>{p.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-gray-400">({p.reviewCount})</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* View Action */}
              <tr>
                <td className="py-2 font-bold text-gray-500">Action</td>
                {comparedProperties.map((p) => (
                  <td key={p.id} className="py-2 px-3">
                    <button
                      onClick={() => onSelectDetails(p)}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-[#14532D] py-1.5 text-xs font-bold text-white hover:bg-[#16A34A]"
                    >
                      <span>View Details</span>
                      <Eye className="h-3 w-3" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
