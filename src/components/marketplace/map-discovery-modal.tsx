'use client'

// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  MapPin,
  X,
  Navigation,
  ZoomIn,
  ZoomOut,
  Building,
  Layers,
  Star,
  ShieldCheck,
  ArrowRight,
  Compass,
  Map as MapIcon,
  Maximize2,
} from 'lucide-react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps'
import { PropertyListing } from '@/types/marketplace'

interface MapDiscoveryModalProps {
  properties: PropertyListing[]
  selectedProperty: PropertyListing | null
  onSelectProperty: (property: PropertyListing) => void
  onClose?: () => void
  isModal?: boolean
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  Bangalore: { lat: 12.9352, lng: 77.6245, zoom: 12 },
  Gurgaon: { lat: 28.4600, lng: 77.0800, zoom: 12 },
  Noida: { lat: 28.6280, lng: 77.3649, zoom: 13 },
  Delhi: { lat: 28.5355, lng: 77.2100, zoom: 12 },
  Pune: { lat: 18.5913, lng: 73.7389, zoom: 13 },
  Hyderabad: { lat: 17.4401, lng: 78.3489, zoom: 13 },
  Mumbai: { lat: 19.1176, lng: 72.9060, zoom: 12 },
}

/**
 * Controller inside Google Map context to pan, zoom, and fit bounds
 */
function MapCameraHandler({
  targetPin,
  cityTarget,
  properties,
}: {
  targetPin: PropertyListing | null
  cityTarget: string
  properties: PropertyListing[]
}) {
  const map = useMap()

  // Pan to individual selected property pin
  useEffect(() => {
    if (!map || !targetPin) return
    const lat = targetPin.coordinates?.lat
    const lng = targetPin.coordinates?.lng
    if (typeof lat === 'number' && typeof lng === 'number') {
      map.panTo({ lat, lng })
      map.setZoom(15)
    }
  }, [map, targetPin])

  // Center on city if city target chosen and no target pin
  useEffect(() => {
    if (!map || targetPin) return

    if (cityTarget && cityTarget !== 'all' && CITY_COORDINATES[cityTarget]) {
      const { lat, lng, zoom } = CITY_COORDINATES[cityTarget]
      map.panTo({ lat, lng })
      map.setZoom(zoom)
      return
    }

    // Auto-fit bounds of all properties
    if (properties.length > 0 && typeof google !== 'undefined' && google.maps) {
      const bounds = new google.maps.LatLngBounds()
      let count = 0
      properties.forEach((p) => {
        if (p.coordinates?.lat && p.coordinates?.lng) {
          bounds.extend({ lat: p.coordinates.lat, lng: p.coordinates.lng })
          count++
        }
      })
      if (count > 0) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
      }
    }
  }, [map, cityTarget, properties, targetPin])

  return null
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
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap')

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_MAPS_API_KEY ||
    ''

  // Update activePin if parent passes a new selectedProperty
  useEffect(() => {
    if (selectedProperty) {
      setActivePin(selectedProperty)
    }
  }, [selectedProperty])

  // Filter properties by city if selected
  const displayedProperties = useMemo(() => {
    if (selectedCity === 'all') return properties
    return properties.filter((p) => p.city.toLowerCase() === selectedCity.toLowerCase())
  }, [properties, selectedCity])

  // Available cities from properties
  const availableCities = useMemo(() => {
    const set = new Set<string>()
    properties.forEach((p) => {
      if (p.city && p.city.trim()) set.add(p.city.trim())
    })
    return Array.from(set).sort()
  }, [properties])

  // Initial center: India tech hub or first property
  const initialCenter = useMemo(() => {
    if (activePin?.coordinates) {
      return { lat: activePin.coordinates.lat, lng: activePin.coordinates.lng }
    }
    if (properties.length > 0 && properties[0].coordinates) {
      return { lat: properties[0].coordinates.lat, lng: properties[0].coordinates.lng }
    }
    return { lat: 20.5937, lng: 78.9629 } // Center of India
  }, [activePin, properties])

  const handlePinClick = (property: PropertyListing) => {
    setActivePin(property)
  }

  const handleCityFilter = (city: string) => {
    setSelectedCity(city)
    const matching = properties.filter(
      (p) => city === 'all' || p.city.toLowerCase() === city.toLowerCase()
    )
    if (matching.length > 0) {
      setActivePin(matching[0])
    }
  }

  const content = (
    <div className="relative flex flex-col lg:flex-row h-[620px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      {/* Left Map Viewport */}
      <div className="relative flex-1 bg-gray-100 overflow-hidden flex flex-col">
        {/* City Filter Floating Bar */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 rounded-xl bg-white/90 p-1.5 shadow-md backdrop-blur-md max-w-[calc(100%-80px)]">
          <button
            onClick={() => handleCityFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              selectedCity === 'all'
                ? 'bg-[#14532D] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Tech Hubs ({properties.length})
          </button>
          {availableCities.map((city) => {
            const count = properties.filter((p) => p.city.toLowerCase() === city.toLowerCase()).length
            return (
              <button
                key={city}
                onClick={() => handleCityFilter(city)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  selectedCity.toLowerCase() === city.toLowerCase()
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {city} ({count})
              </button>
            )
          })}
        </div>

        {/* Map Type Switcher & Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={() => setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="flex h-8 items-center gap-1 rounded-lg bg-white/95 px-2 text-xs font-bold text-gray-700 shadow-md backdrop-blur-xs hover:bg-white"
            title="Toggle Satellite / Hybrid View"
          >
            <Layers className="h-3.5 w-3.5 text-[#16A34A]" />
            <span className="hidden sm:inline">{mapType === 'roadmap' ? 'Satellite' : 'Roadmap'}</span>
          </button>
        </div>

        {/* Real Interactive Google Map */}
        <div className="relative h-full w-full">
          <APIProvider apiKey={apiKey} libraries={['marker']}>
            <Map
              mapId="DEMO_MAP_ID"
              defaultCenter={initialCenter}
              defaultZoom={properties.length > 3 ? 11 : 12}
              mapTypeId={mapType}
              gestureHandling="greedy"
              disableDefaultUI={false}
              zoomControl={true}
              streetViewControl={true}
              fullscreenControl={false}
              internalUsageAttributionIds={['gmp_git_agentskills_v1']}
              style={{ width: '100%', height: '100%' }}
            >
              <MapCameraHandler
                targetPin={activePin}
                cityTarget={selectedCity}
                properties={displayedProperties}
              />

              {/* Render AdvancedMarker for every real PG listing */}
              {displayedProperties.map((prop) => {
                const isCurrent = activePin?.id === prop.id
                const priceFormatted =
                  prop.price >= 10000
                    ? `₹${(prop.price / 1000).toFixed(1)}k`
                    : `₹${(prop.price / 1000).toFixed(0)}k`

                const lat = prop.coordinates?.lat || 28.5355
                const lng = prop.coordinates?.lng || 77.3910

                return (
                  <AdvancedMarker
                    key={prop.id}
                    position={{ lat, lng }}
                    onClick={() => handlePinClick(prop)}
                    title={`${prop.title} - ₹${prop.price.toLocaleString('en-IN')}/mo`}
                    zIndex={isCurrent ? 50 : 10}
                  >
                    <div
                      className={`group flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-lg transition-transform cursor-pointer ${
                        isCurrent
                          ? 'bg-[#14532D] text-white ring-3 ring-[#F59E0B] scale-110'
                          : 'bg-white text-[#14532D] border border-gray-300 hover:bg-[#16A34A] hover:text-white hover:scale-105'
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{priceFormatted}</span>
                      {isCurrent && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[#F59E0B] animate-ping" />
                      )}
                    </div>
                  </AdvancedMarker>
                )
              })}
            </Map>
          </APIProvider>
        </div>

        {/* Legend Overlay bottom-left */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-lg bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-gray-700 shadow-md backdrop-blur-xs">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#14532D]" />
            <span>Selected PG</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            <span>Verified PGs ({displayedProperties.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-[#16A34A]" />
            <span>Direct Owner</span>
          </div>
        </div>
      </div>

      {/* Right Property Preview Drawer */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white p-4 flex flex-col justify-between overflow-y-auto">
        {activePin ? (
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">
                Selected Property
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#14532D]">
                <ShieldCheck className="h-3 w-3 text-[#16A34A]" />
                <span>Verified Space</span>
              </span>
            </div>

            {/* Thumbnail */}
            <div className="relative mt-3 aspect-16/10 w-full overflow-hidden rounded-xl bg-gray-100">
              <img
                src={activePin.coverImage}
                alt={activePin.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
                }}
              />
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-bold text-gray-900 shadow-xs">
                <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                <span>{(activePin.rating || 4.8).toFixed(1)}</span>
                <span className="text-[10px] text-gray-500">({activePin.reviewCount || 32})</span>
              </div>
            </div>

            {/* Title and Address */}
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
                  Deposit: ₹{activePin.deposit.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Beds Availability */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Sharing: <strong className="text-gray-900">{activePin.sharingType}</strong>
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {activePin.availableBeds} of {activePin.totalBeds} Beds Free
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

        {/* View Details Action Button */}
        {activePin && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={() => onSelectProperty(activePin)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
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
