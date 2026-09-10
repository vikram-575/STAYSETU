'use client'

import React, { useState } from 'react'
import {
  MapPin,
  X,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Building,
  Layers,
  Star,
  ShieldCheck,
  Eye,
  ArrowRight,
} from 'lucide-react'
import { PropertyListing } from '@/types/marketplace'

interface MapDiscoveryModalProps {
  properties: PropertyListing[]
  selectedProperty: PropertyListing | null
  onSelectProperty: (property: PropertyListing) => void
  onClose?: () => void
  isModal?: boolean
}

export function MapDiscoveryModal({
  properties,
  selectedProperty,
  onSelectProperty,
  onClose,
  isModal = false,
}: MapDiscoveryModalProps) {
  const [activePin, setActivePin] = useState<PropertyListing | null>(
    selectedProperty || (properties.length > 0 ? properties[0] : null)
  )
  const [zoomLevel, setZoomLevel] = useState(1)

  // Map pins coordinates distribution for visual aesthetic
  const getPinPosition = (index: number, total: number) => {
    // Generate organic positions across an SVG viewbox 800x500
    const positions = [
      { x: 220, y: 180 }, // Bangalore Koramangala
      { x: 310, y: 140 }, // Indiranagar
      { x: 420, y: 110 }, // Gurgaon DLF
      { x: 520, y: 190 }, // Noida Sec 62
      { x: 280, y: 260 }, // Delhi Saket
      { x: 190, y: 320 }, // Pune Hinjewadi
      { x: 460, y: 290 }, // Hyderabad Gachibowli
      { x: 610, y: 220 }, // Mumbai Powai
      { x: 250, y: 390 }, // Bangalore HSR
      { x: 570, y: 340 }, // Chennai OMR
      { x: 380, y: 370 }, // Gurgaon Sec 56
      { x: 160, y: 220 }, // Delhi Hauz Khas
    ]
    return positions[index % positions.length]
  }

  const handlePinClick = (property: PropertyListing) => {
    setActivePin(property)
  }

  const content = (
    <div className="relative flex flex-col lg:flex-row h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      {/* Left / Top Map Canvas */}
      <div className="relative flex-1 bg-[#EEF2F6] overflow-hidden select-none">
        {/* Stylized Vector Map Canvas */}
        <div
          className="absolute inset-0 transition-transform duration-300 origin-center flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 800 500"
            className="h-full w-full object-cover"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Base land */}
            <rect width="800" height="500" fill="#F8FAFC" />
            <rect width="800" height="500" fill="url(#grid)" opacity="0.6" />

            {/* Simulated Water Body / Lake */}
            <path
              d="M100 240 Q160 210 210 260 T320 280 Q370 330 330 380 T200 410 Q140 370 120 310 Z"
              fill="#E0F2FE"
              stroke="#BAE6FD"
              strokeWidth="2"
            />
            <text x="180" y="320" fill="#0284C7" fontSize="11" fontWeight="600" opacity="0.6">
              Ulsoor & Agara Waters
            </text>

            {/* Simulated Green Parks */}
            <path
              d="M480 80 Q560 60 620 120 T600 200 Q520 220 470 160 Z"
              fill="#DCFCE7"
              stroke="#BBF7D0"
              strokeWidth="2"
            />
            <text x="520" y="145" fill="#16A34A" fontSize="10" fontWeight="600" opacity="0.7">
              Biodiversity Forest
            </text>

            {/* Main Road Networks */}
            <path
              d="M 50 150 L 750 160"
              stroke="#CBD5E1"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 50 150 L 750 160"
              stroke="#FFFFFF"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <path
              d="M 280 30 L 290 480"
              stroke="#CBD5E1"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 280 30 L 290 480"
              stroke="#FFFFFF"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <path
              d="M 120 400 L 680 80"
              stroke="#CBD5E1"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 120 400 L 680 80"
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Rapid Metro Line (Green dashed line) */}
            <path
              d="M 80 80 Q 300 220 720 380"
              stroke="#16A34A"
              strokeWidth="3"
              strokeDasharray="6 4"
              fill="none"
            />
            <circle cx="285" cy="195" r="5" fill="#14532D" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="510" cy="300" r="5" fill="#14532D" stroke="#FFFFFF" strokeWidth="2" />
            <text x="295" y="198" fill="#14532D" fontSize="9" fontWeight="700">
              Metro Interchange
            </text>
          </svg>

          {/* Interactive Property Pins */}
          {properties.map((prop, idx) => {
            const pos = getPinPosition(idx, properties.length)
            const isCurrent = activePin?.id === prop.id
            const priceFormatted =
              prop.price >= 10000
                ? `₹${(prop.price / 1000).toFixed(1)}k`
                : `₹${(prop.price / 1000).toFixed(0)}k`

            return (
              <div
                key={prop.id}
                onClick={() => handlePinClick(prop)}
                className={`absolute cursor-pointer transition-all duration-200 transform -translate-x-1/2 -translate-y-1/2 ${
                  isCurrent ? 'z-30 scale-110' : 'z-20 hover:scale-105'
                }`}
                style={{ left: `${(pos.x / 800) * 100}%`, top: `${(pos.y / 500) * 100}%` }}
              >
                <div
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-lg transition-all ${
                    isCurrent
                      ? 'bg-[#14532D] text-white ring-3 ring-[#F59E0B]'
                      : 'bg-white text-[#14532D] border border-gray-300 hover:bg-[#16A34A] hover:text-white'
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{priceFormatted}</span>
                </div>
                {/* Pulse ring for active pin */}
                {isCurrent && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
                )}
              </div>
            )
          })}
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md hover:bg-gray-50 active:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md hover:bg-gray-50 active:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md hover:bg-gray-50 active:bg-gray-100"
            title="Reset View"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-gray-700 shadow-md backdrop-blur-xs flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#14532D]" />
            <span>Active Space</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            <span>Verified PGs</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-0.5 w-3 bg-[#16A34A] border-b border-dashed" />
            <span>Metro Line</span>
          </div>
        </div>
      </div>

      {/* Right / Side Selected Property Preview Drawer */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white p-4 flex flex-col justify-between overflow-y-auto">
        {activePin ? (
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">
                Selected Property
              </span>
              <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#14532D]">
                Verified Space
              </span>
            </div>

            {/* Thumbnail */}
            <div className="relative mt-3 aspect-16/10 w-full overflow-hidden rounded-xl bg-gray-100">
              <img
                src={activePin.coverImage}
                alt={activePin.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-gray-900 shadow-xs">
                <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                <span>{activePin.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Info */}
            <div className="mt-3">
              <h4 className="text-sm font-bold text-[#17211B] line-clamp-1">{activePin.title}</h4>
              <p className="mt-0.5 text-xs text-[#647067] flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#16A34A] shrink-0" />
                <span>
                  {activePin.locality}, {activePin.city}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">{activePin.distanceToMetro}</p>

              {/* Price & Deposit */}
              <div className="mt-3 flex items-baseline justify-between rounded-lg bg-[#F7FAF7] p-2.5">
                <div>
                  <span className="text-base font-extrabold text-[#14532D]">
                    ₹{activePin.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#647067]">/month</span>
                </div>
                <span className="text-[11px] font-medium text-gray-600">
                  Dep: ₹{activePin.deposit.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Amenities */}
              <div className="mt-3 flex flex-wrap gap-1">
                {activePin.amenities.slice(0, 4).map((a, i) => (
                  <span key={i} className="rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                    {a.split('(')[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Click any pin on the map to preview property details
          </div>
        )}

        {/* View Details Button */}
        {activePin && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={() => onSelectProperty(activePin)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95"
            >
              <span>View Complete Property Details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div className="relative w-full max-w-5xl">
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-800 hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
          {content}
        </div>
      </div>
    )
  }

  return content
}
