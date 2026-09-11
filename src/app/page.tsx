'use client'

import React, { useState, useEffect } from 'react'
import { PropertyListing, PropertyType } from '@/types/marketplace'
import { MarketplaceNavbar } from '@/components/marketplace/marketplace-navbar'
import { HeroSearch } from '@/components/marketplace/hero-search'
import { TrustSection } from '@/components/marketplace/trust-section'
import { PopularCities } from '@/components/marketplace/popular-cities'
import { FeaturedListings } from '@/components/marketplace/featured-listings'
import { WhyChooseUs } from '@/components/marketplace/why-choose-us'
import { OwnerCtaBanner } from '@/components/marketplace/owner-cta-banner'
import { MarketplaceFooter } from '@/components/marketplace/marketplace-footer'
import { PropertyDetailModal } from '@/components/marketplace/property-detail-modal'
import { PropertyCompareDrawer } from '@/components/marketplace/property-compare-drawer'
import { ListPropertyModal } from '@/components/marketplace/list-property-modal'
import { MobileBottomNav } from '@/components/marketplace/mobile-bottom-nav'
import { FloatingWebsiteAdminBar } from '@/components/marketplace/website-admin-quick-edit'

export default function MarketplaceHomePage() {
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [comparedProperties, setComparedProperties] = useState<PropertyListing[]>([])
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [activeCity, setActiveCity] = useState<string>('all')

  // Fetch real database properties on mount
  useEffect(() => {
    let isMounted = true
    async function loadProperties() {
      try {
        setLoadingProperties(true)
        const res = await fetch('/api/properties')
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.properties)) {
          setProperties(data.properties)
        }
      } catch (err) {
        console.error('Failed to load properties:', err)
      } finally {
        if (isMounted) setLoadingProperties(false)
      }
    }
    loadProperties()
    return () => {
      isMounted = false
    }
  }, [])

  // Load wishlist favorites from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pgsetu_saved_ids') || localStorage.getItem('staysetu_saved_ids')
      if (saved) {
        setSavedIds(JSON.parse(saved))
      }
    } catch {}
  }, [])

  // Toggle Save / Wishlist
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

  // Toggle Compare
  const handleToggleCompare = (property: PropertyListing) => {
    setComparedProperties((prev) => {
      const exists = prev.some((p) => p.id === property.id)
      if (exists) {
        return prev.filter((p) => p.id !== property.id)
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 properties at a time.')
        return prev
      }
      return [...prev, property]
    })
  }

  const handleRemoveFromCompare = (propertyId: string) => {
    setComparedProperties((prev) => prev.filter((p) => p.id !== propertyId))
  }

  const handleClearCompare = () => {
    setComparedProperties([])
  }

  // Filter criteria from Hero search
  const handleHeroSearch = (criteria: {
    city: string
    locality: string
    propertyType: PropertyType | 'all'
    sharingType: string
    maxBudget: number
    quickChip?: string
  }) => {
    if (criteria.city) {
      setActiveCity(criteria.city)
    }
  }

  // Handle new listing created from 10-step wizard
  const handleListingCreated = (newListingData: any) => {
    const newProperty: PropertyListing = {
      id: `prop-custom-${Date.now()}`,
      title: newListingData.propertyName || 'New Verified Listing',
      slug: (newListingData.propertyName || 'new-listing').toLowerCase().replace(/\s+/g, '-'),
      tagline: newListingData.tagline || 'Recently added verified living space',
      propertyType: newListingData.propertyType,
      genderPreference: newListingData.genderPreference,
      city: newListingData.city,
      locality: newListingData.locality || newListingData.city,
      fullAddress: newListingData.fullAddress || newListingData.city,
      pincode: newListingData.pincode || '560001',
      distanceToMetro: newListingData.nearestMetro || 'Near metro station',
      nearestLandmark: newListingData.landmark || 'Main Road',
      price: newListingData.rentMonthly,
      deposit: newListingData.securityDeposit,
      maintenance: newListingData.maintenanceCharges,
      lockInPeriod: '1 Month',
      noticePeriod: `${newListingData.noticePeriodDays} Days`,
      electricityPolicy: newListingData.electricityRate || 'Govt. Tariff Sub-meter',
      sharingType: (newListingData.sharingOptions[0] as any) || 'Double Sharing',
      furnishing: 'fully_furnished',
      foodIncluded: newListingData.foodProvided,
      foodDetails: newListingData.foodProvided
        ? `${newListingData.mealsOffered.join(', ')} included`
        : 'Self cooking kitchen available',
      foodPlans: newListingData.mealsOffered,
      images:
        newListingData.imageUrls.length > 0
          ? newListingData.imageUrls
          : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80'],
      coverImage:
        newListingData.imageUrls[0] ||
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
      rating: 5.0,
      reviewCount: 1,
      verified: true,
      superHost: false,
      zeroBrokerage: true,
      featured: true,
      amenities: newListingData.amenities,
      rules: [
        `Gate closes at ${newListingData.gateClosingTime}`,
        newListingData.smokingAllowed ? 'Smoking allowed in designated zone' : 'No smoking on premises',
      ],
      coordinates: { lat: 12.9716, lng: 77.5946 },
      owner: {
        name: newListingData.ownerName || 'Verified Host',
        phone: newListingData.ownerPhone || '9876543210',
        whatsapp: newListingData.ownerWhatsapp || '919876543210',
        email: newListingData.ownerEmail || 'host@pgsetu.com',
        responseRate: '100%',
        responseTime: 'Instant',
        verified: true,
        propertiesCount: 1,
      },
      availableBeds: newListingData.availableBeds,
      totalBeds: newListingData.totalRooms * 2,
      availableFrom: 'Immediate',
      postedAt: 'Just now',
    }

    setProperties([newProperty, ...properties])
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17211B] flex flex-col font-sans selection:bg-[#DCFCE7] selection:text-[#14532D]">
      {/* 1. Sticky Marketplace Navbar */}
      <MarketplaceNavbar
        onOpenListModal={() => setIsListModalOpen(true)}
        savedCount={savedIds.length}
        compareCount={comparedProperties.length}
        onOpenCompare={() => {}}
      />

      {/* 2. Hero Section with Search Card */}
      <main className="flex-1">
        <HeroSearch
          onSearch={handleHeroSearch}
          selectedCity={activeCity === 'all' ? '' : activeCity}
          onCityChange={setActiveCity}
        />

        {/* 3. Trust & Value Pillars */}
        <TrustSection />

        {/* 4. Popular Cities Grid */}
        <PopularCities onSelectCity={setActiveCity} activeCity={activeCity} />

        {/* 5. Featured Properties Feed & Split Map */}
        <FeaturedListings
          properties={properties}
          isLoading={loadingProperties}
          onSelectDetails={(prop) => setSelectedProperty(prop)}
          savedIds={savedIds}
          onToggleSave={handleToggleSave}
          comparedIds={comparedProperties.map((p) => p.id)}
          onToggleCompare={handleToggleCompare}
          activeCity={activeCity}
          onCityChange={setActiveCity}
        />

        {/* 6. Why Choose PGSetu (Comparison Table) */}
        <WhyChooseUs />

        {/* 7. Owner CTA Banner */}
        <OwnerCtaBanner onOpenListModal={() => setIsListModalOpen(true)} />
      </main>

      {/* 8. Comprehensive PropTech Footer */}
      <MarketplaceFooter />

      {/* 9. Mobile Bottom Navigation */}
      <MobileBottomNav
        savedCount={savedIds.length}
        compareCount={comparedProperties.length}
        onToggleMap={() => {
          const el = document.getElementById('featured-properties')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }}
        onShowSaved={() => {
          // Scroll to listings with saved filter or open details
          const el = document.getElementById('featured-properties')
          if (el) el.scrollIntoView({ behavior: 'smooth' })
        }}
        onOpenCompare={() => {}}
      />

      {/* 10. Modals & Drawers */}
      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          isSaved={savedIds.includes(selectedProperty.id)}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* Comparison Drawer */}
      <PropertyCompareDrawer
        comparedProperties={comparedProperties}
        onRemoveFromCompare={handleRemoveFromCompare}
        onClearCompare={handleClearCompare}
        onSelectDetails={(prop) => setSelectedProperty(prop)}
      />

      {/* 10-Step List Your Property Wizard Modal */}
      <ListPropertyModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onListingCreated={handleListingCreated}
      />

      {/* Floating Website Live Admin Editor Bar */}
      <FloatingWebsiteAdminBar />
    </div>
  )
}
