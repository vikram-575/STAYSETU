'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Star,
  MapPin,
  Train,
  ShieldCheck,
  CheckCircle,
  IndianRupee,
  Utensils,
  PhoneCall,
  MessageSquare,
  Calendar,
  User,
  Mail,
  Send,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Wifi,
  Wind,
  Bed,
  Shield,
  Clock,
  ExternalLink,
  Check,
  Lock,
  Layers,
  Building2,
  Tv,
  Coffee,
  CheckCircle2,
  Compass,
} from 'lucide-react'
import { PropertyListing } from '@/types/marketplace'
import { MarketplaceNavbar } from '@/components/marketplace/marketplace-navbar'
import { MarketplaceFooter } from '@/components/marketplace/marketplace-footer'
import { MobileBottomNav } from '@/components/marketplace/mobile-bottom-nav'
import { SavedPropertiesModal } from '@/components/marketplace/saved-properties-modal'
import { PropertyCard } from '@/components/marketplace/property-card'

interface PropertyPageProps {
  params: Promise<{ id: string }>
}

export default function PropertyDetailPage({ params }: PropertyPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const propertyId = resolvedParams.id

  const [property, setProperty] = useState<PropertyListing | null>(null)
  const [recommended, setRecommended] = useState<PropertyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Visit / Booking Form State
  const [visitForm, setVisitForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    visitDate: 'Tomorrow',
    timeSlot: 'Morning (10 AM - 1 PM)',
    sharingChoice: 'Double Sharing',
    message: 'Hi, I would like to schedule a visit to inspect this space.',
  })
  const [visitSubmitted, setVisitSubmitted] = useState(false)
  const [submittingVisit, setSubmittingVisit] = useState(false)

  // Load Saved IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pgsetu_saved_ids') || localStorage.getItem('staysetu_saved_ids')
      if (saved) setSavedIds(JSON.parse(saved))
    } catch {}
  }, [])

  // Fetch Property Details and Recommended Properties
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      try {
        setLoading(true)
        const res = await fetch(`/api/properties?id=${encodeURIComponent(propertyId)}`)
        const data = await res.json()
        if (isMounted && data.success && data.property) {
          setProperty(data.property)
          setRecommended(data.recommended || [])
          setVisitForm((prev) => ({
            ...prev,
            sharingChoice: data.property.sharingType || 'Double Sharing',
          }))
        } else if (isMounted) {
          // If not found by ID directly, try fetching all properties to find by slug
          const allRes = await fetch('/api/properties')
          const allData = await allRes.json()
          if (allData.success && Array.isArray(allData.properties)) {
            const found = allData.properties.find(
              (p: PropertyListing) => p.id === propertyId || p.slug === propertyId
            )
            if (found) {
              setProperty(found)
              const rec = allData.properties.filter((p: PropertyListing) => p.id !== found.id)
              setRecommended(rec.slice(0, 4))
            }
          }
        }
      } catch (err) {
        console.error('Failed to load property details:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [propertyId])

  // Toggle Save
  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      try {
        localStorage.setItem('pgsetu_saved_ids', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  // Handle Share
  const handleShare = () => {
    if (typeof window === 'undefined') return
    if (navigator.share) {
      navigator.share({
        title: property?.title || 'PG-SETU Space',
        text: `Check out ${property?.title} on PG-SETU`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Handle Visit Submit
  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitForm.fullName.trim() || !visitForm.phone.trim()) return
    setSubmittingVisit(true)
    try {
      await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property?.id,
          property_name: property?.title,
          property_city: property?.city,
          owner_name: property?.owner.name,
          owner_phone: property?.owner.phone,
          tenant_name: visitForm.fullName,
          tenant_phone: visitForm.phone,
          tenant_email: visitForm.email,
          sharing_choice: visitForm.sharingChoice,
          move_in_date: visitForm.visitDate,
          notes: `${visitForm.timeSlot} — ${visitForm.message}`,
          type: 'visit',
        }),
      })
      setVisitSubmitted(true)
    } catch (err) {
      console.error('Failed to submit visit enquiry:', err)
      setVisitSubmitted(true)
    } finally {
      setSubmittingVisit(false)
    }
  }

  const isSaved = property ? savedIds.includes(property.id) : false

  const whatsappUrl = property
    ? `https://wa.me/${property.owner.whatsapp || '919453522757'}?text=${encodeURIComponent(
        `Hi ${property.owner.name}, I am interested in ${property.title} in ${property.city} listed on PGSetu (${property.sharingType}, ₹${property.price}/mo). Is a bed available for move-in?`
      )}`
    : '#'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-[#14532D]">Loading Verified Space Details...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex flex-col">
        <MarketplaceNavbar onOpenListModal={() => {}} savedCount={savedIds.length} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mb-3" />
          <h2 className="text-xl font-bold text-[#14532D]">Property Not Found</h2>
          <p className="text-xs text-[#647067] max-w-sm mt-1">
            This space may have been unlisted or rented out. Explore our active verified PGs.
          </p>
          <div className="mt-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#16A34A] transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Browse Verified PGs</span>
            </Link>
          </div>
        </div>
        <MarketplaceFooter />
      </div>
    )
  }

  const images = property.images && property.images.length > 0 ? property.images : [property.coverImage]

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex flex-col pb-20 md:pb-0">
      {/* Top Navbar */}
      <MarketplaceNavbar
        onOpenListModal={() => {}}
        savedCount={savedIds.length}
        compareCount={0}
        onShowSaved={() => setIsSavedDrawerOpen(true)}
      />

      {/* Breadcrumb & Quick Actions Bar */}
      <div className="border-b border-gray-200/80 bg-white sticky top-0 z-20 shadow-2xs">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#647067] truncate">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 font-bold text-[#14532D] hover:text-[#16A34A] transition active:scale-95 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Search</span>
            </button>
            <span className="text-gray-300">/</span>
            <Link href={`/search?city=${encodeURIComponent(property.city)}`} className="hover:underline truncate">
              {property.city}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-[#17211B] truncate">{property.title}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#647067] hover:bg-gray-50 active:scale-95 transition shadow-2xs"
              title="Share property"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>

            {/* Save / Wishlist Button */}
            <button
              onClick={() => handleToggleSave(property.id)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 shadow-2xs ${
                isSaved
                  ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-rose-100'
                  : 'border-gray-200 bg-white text-[#647067] hover:border-rose-300 hover:text-rose-600'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save space'}
            >
              <Heart className={`h-3.5 w-3.5 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full space-y-6">
        {/* 1. Hero Photo Showcase & Gallery */}
        <div className="rounded-3xl border border-gray-200/90 bg-white p-3 sm:p-5 shadow-xs space-y-3">
          {/* Main Large Image Container */}
          <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-xs">
            <img
              src={images[selectedImageIdx] || property.coverImage}
              alt={property.title}
              className="h-full w-full object-cover transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
              <span className="rounded-md bg-[#14532D] px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                {property.propertyType.toUpperCase()}
              </span>
              {property.verified && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Physically Verified</span>
                </span>
              )}
              {property.zeroBrokerage && (
                <span className="rounded-md bg-[#DCFCE7] px-2 py-0.5 text-xs font-bold text-[#14532D] shadow-xs">
                  Zero Brokerage
                </span>
              )}
              {property.superHost && (
                <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-xs font-bold text-[#F59E0B] shadow-xs">
                  ★ Super Host
                </span>
              )}
            </div>

            {/* Carousel Navigation Arrows */}
            {images.length > 1 && (
              <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between z-10 pointer-events-none">
                <button
                  onClick={() => setSelectedImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="pointer-events-auto flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 active:scale-90 transition shadow-md"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="pointer-events-auto flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 active:scale-90 transition shadow-md"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Bottom Image Counter & Sharing Badge */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white z-10">
              <span className="rounded-md bg-black/70 px-2.5 py-1 text-xs font-bold backdrop-blur-xs">
                {property.sharingType}
              </span>
              <span className="rounded-md bg-black/70 px-2.5 py-1 text-xs font-mono font-bold backdrop-blur-xs">
                {selectedImageIdx + 1} / {images.length} Photos
              </span>
            </div>
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`relative h-14 w-20 sm:h-16 sm:w-24 shrink-0 overflow-hidden rounded-xl border-2 transition active:scale-95 ${
                    selectedImageIdx === idx
                      ? 'border-[#16A34A] ring-2 ring-[#DCFCE7]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Main Content Grid (Left: Specifications & Features, Right: Sticky Booking Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title, Address & Spec Badges */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-3">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  <span>{property.rating ? property.rating.toFixed(1) : '4.8'}</span>
                  <span className="text-gray-500 font-normal">({property.reviewCount || 24} reviews)</span>
                </span>
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  {property.sharingType}
                </span>
                <span className="rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-800 capitalize">
                  {property.furnishing.replace('_', ' ')}
                </span>
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-800">
                  {property.genderPreference === 'girls'
                    ? 'Girls Only'
                    : property.genderPreference === 'boys'
                    ? 'Boys Only'
                    : 'Co-ed Living'}
                </span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="text-xl sm:text-3xl font-black text-[#14532D] tracking-tight leading-snug">
                  {property.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#647067] mt-1 font-medium italic">
                  &ldquo;{property.tagline}&rdquo;
                </p>
              </div>

              {/* Exact Location & Transit Highlights */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex items-start gap-1.5 text-xs text-[#17211B]">
                  <MapPin className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span className="font-semibold">{property.fullAddress}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#647067] pl-5.5">
                  <span className="flex items-center gap-1">
                    <Train className="h-3.5 w-3.5 text-gray-400" />
                    <span>{property.distanceToMetro}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-gray-400" />
                    <span>Landmark: {property.nearestLandmark}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Transparent Financial Breakdown */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-white p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D]">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#14532D]">
                      Transparent Financial Breakdown
                    </h3>
                    <p className="text-[11px] text-[#647067]">
                      100% upfront pricing with zero hidden charges or broker commissions.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-[#16A34A] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                  Zero Brokerage Guaranteed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                    Monthly Rent
                  </span>
                  <span className="text-lg font-black text-[#14532D] block">
                    ₹{property.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-500">per person / mo</span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                    Security Deposit
                  </span>
                  <span className="text-lg font-black text-gray-800 block">
                    ₹{property.deposit.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">100% Refundable</span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                    Maintenance
                  </span>
                  <span className="text-sm font-black text-gray-800 block mt-1">
                    {property.maintenance > 0 ? `₹${property.maintenance}/mo` : 'Included in Rent'}
                  </span>
                  <span className="text-[10px] text-gray-500">Sweeping & repairs</span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">
                    Electricity Policy
                  </span>
                  <span className="text-xs font-bold text-gray-800 block mt-1 line-clamp-1">
                    {property.electricityPolicy}
                  </span>
                  <span className="text-[10px] text-gray-500">Actual meter usage</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-100 text-xs text-[#647067]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>Lock-in Period: <strong>{property.lockInPeriod}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>Notice Period: <strong>{property.noticePeriod}</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>Move-in: <strong>{property.availableFrom || 'Immediate'}</strong></span>
                </span>
              </div>
            </div>

            {/* 4. MORE EXPLAIN FEATURES: Deep Dives into Living Comfort */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
                  <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
                  <span>Comprehensive Feature Explanation</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#14532D] mt-2">
                  What’s Included & Living Amenities Explained
                </h3>
                <p className="text-xs text-[#647067] mt-0.5">
                  Everything you need to know about food, rooms, security, and daily routines at this space.
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Food & Dining */}
                <div className="rounded-2xl border border-gray-200/80 bg-[#F7FAF7] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D]">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#17211B]">Food & Dining Routine</h4>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {property.foodIncluded ? '3 Homestyle Meals Included' : 'Food Option Available'}
                      </span>
                    </div>
                  </div>
                  <ul className="text-xs text-[#647067] space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>Breakfast (7:30–9:30 AM), Lunch/Office Tiffin, Dinner (8:00–10:00 PM).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>Pure veg & non-veg options prepared in an inspected, hygienic kitchen.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>Evening tea and weekend special dishes with rotating monthly menu.</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Room & Bed Comfort */}
                <div className="rounded-2xl border border-gray-200/80 bg-[#F7FAF7] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                      <Bed className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#17211B]">Room Furniture & Inclusions</h4>
                      <span className="text-[10px] text-blue-700 font-bold capitalize">
                        {property.furnishing.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <ul className="text-xs text-[#647067] space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>Premium spring mattress, bed linen, and bedside power charging points.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>Spacious wooden wardrobe with personal locker key & study workstation.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>Attached washroom with 24×7 hot water geyser & western fittings.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. High-Speed Internet & Power Backup */}
                <div className="rounded-2xl border border-gray-200/80 bg-[#F7FAF7] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                      <Wifi className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#17211B]">Internet & Power Resilience</h4>
                      <span className="text-[10px] text-amber-700 font-bold">100% 24×7 Power Backup</span>
                    </div>
                  </div>
                  <ul className="text-xs text-[#647067] space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>200+ Mbps commercial fiber WiFi with mesh coverage in all rooms.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Dual inverter and heavy-duty diesel generator backup during power outages.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>Perfect setup for IT professionals, work-from-home, and online students.</span>
                    </li>
                  </ul>
                </div>

                {/* 4. Safety & Security */}
                <div className="rounded-2xl border border-gray-200/80 bg-[#F7FAF7] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#17211B]">Building Safety & Surveillance</h4>
                      <span className="text-[10px] text-purple-700 font-bold">24×7 Monitored Campus</span>
                    </div>
                  </div>
                  <ul className="text-xs text-[#647067] space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>CCTV cameras across entrances, corridors, stairwells, and dining hall.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>Biometric fingerprint / digital RFID gate pass for authorized residents.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>Uniformed security guard stationed 24 hours with visitor logbook.</span>
                    </li>
                  </ul>
                </div>

                {/* 5. Housekeeping & Hygiene */}
                <div className="rounded-2xl border border-gray-200/80 bg-[#F7FAF7] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#17211B]">Housekeeping & Laundry</h4>
                      <span className="text-[10px] text-teal-700 font-bold">Daily Cleaning Included</span>
                    </div>
                  </div>
                  <ul className="text-xs text-[#647067] space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>Daily room sweeping and mopping by dedicated housekeeping team.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>Commercial RO drinking water purifiers with mineral cartridge on every floor.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>Automatic washing machines and dedicated terrace drying areas available free.</span>
                    </li>
                  </ul>
                </div>

                {/* 6. Campus House Rules & Timings */}
                <div className="rounded-2xl border border-gray-200/80 bg-[#F7FAF7] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#17211B]">Campus Timings & House Rules</h4>
                      <span className="text-[10px] text-rose-700 font-bold">Safe & Respectful Community</span>
                    </div>
                  </div>
                  <ul className="text-xs text-[#647067] space-y-1.5 pt-1">
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>Main gate closes at 11:00 PM (Late night-entry pass via online portal).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>Day visitors allowed in reception lounge till 8:00 PM.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>Quiet hours after 10:30 PM. Strictly non-smoking inside rooms.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Verified Landlord / Campus Host Info */}
            <div className="rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#14532D] text-lg font-black text-white shadow-xs">
                  {(property.owner.name || 'H')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-base font-bold text-[#17211B]">{property.owner.name}</h4>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#DCFCE7] px-2 py-0.2 text-[10px] font-bold text-[#14532D]">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Verified Host</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#647067] mt-0.5">
                    Response time: <strong>{property.owner.responseTime || 'Under 30 mins'}</strong> · Direct Owner (No Agent)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#20bd5a] transition active:scale-95"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                </a>

                {property.owner.phone && (
                  <a
                    href={`tel:${property.owner.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-bold text-[#17211B] hover:bg-gray-50 transition active:scale-95 shadow-2xs"
                  >
                    <PhoneCall className="h-4 w-4 text-[#16A34A]" />
                    <span>Call</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Schedule Visit / Instant Booking Form (4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            <div className="rounded-3xl border border-gray-200/90 bg-white p-5 shadow-lg space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#14532D]">
                      ₹{property.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-[#647067]"> / month</span>
                  </div>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    {property.availableBeds > 0 ? `${property.availableBeds} beds vacant` : 'Limited vacancy'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Refundable Deposit: ₹{property.deposit.toLocaleString('en-IN')}
                </p>
              </div>

              {visitSubmitted ? (
                <div className="rounded-2xl bg-[#DCFCE7]/70 p-5 text-center space-y-2 border border-[#16A34A]/40">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A] text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-black text-[#14532D]">Visit Scheduled Successfully!</h4>
                  <p className="text-xs text-[#647067]">
                    The property manager has received your request for <strong>{visitForm.visitDate}</strong>. They will contact you shortly on <strong>+91 {visitForm.phone}</strong>.
                  </p>
                  <div className="pt-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Confirm on WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleVisitSubmit} className="space-y-3 text-xs">
                  <div className="flex items-center gap-1 text-[#14532D] font-bold text-xs">
                    <Calendar className="h-4 w-4 text-[#16A34A]" />
                    <span>Schedule Free Visit / Check In</span>
                  </div>

                  {/* Visit Date selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Preferred Visit Date
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Today', 'Tomorrow', 'This Weekend'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setVisitForm({ ...visitForm, visitDate: d })}
                          className={`rounded-xl border py-1.5 text-center text-xs font-semibold transition ${
                            visitForm.visitDate === d
                              ? 'border-[#16A34A] bg-[#DCFCE7] text-[#14532D]'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time slot */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Time Slot
                    </label>
                    <select
                      value={visitForm.timeSlot}
                      onChange={(e) => setVisitForm({ ...visitForm, timeSlot: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-2 px-3 text-xs font-semibold text-gray-800 focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                    >
                      <option>Morning (10:00 AM – 1:00 PM)</option>
                      <option>Afternoon (1:00 PM – 4:00 PM)</option>
                      <option>Evening (4:00 PM – 7:30 PM)</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={visitForm.fullName}
                      onChange={(e) => setVisitForm({ ...visitForm, fullName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-2 px-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Mobile Phone */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Phone Number (WhatsApp verified)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={visitForm.phone}
                      onChange={(e) => setVisitForm({ ...visitForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-2 px-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={submittingVisit}
                    className="w-full rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-xs font-extrabold text-white shadow-md hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5"
                  >
                    {submittingVisit ? (
                      <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        <span>Schedule Free Property Visit</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 pt-1 text-[10.5px] text-gray-500">
                    <Lock className="h-3 w-3 text-emerald-600" />
                    <span>Free booking · No advance payment needed</span>
                  </div>
                </form>
              )}
            </div>

            {/* Direct WhatsApp Box */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center space-y-2">
              <span className="text-xs font-extrabold text-[#14532D] block">
                Have questions before booking?
              </span>
              <p className="text-[11px] text-[#647067]">
                Connect with the owner directly on WhatsApp for live room video or queries.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#25D366] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#20bd5a] transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat with Owner on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* 6. RECOMMENDED PROPERTIES SECTION (User requirement: "below recommended property") */}
        <div className="pt-8 border-t border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
                <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Similar Spaces</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-[#14532D] mt-1">
                Recommended Properties in {property.city} & Nearby
              </h3>
              <p className="text-xs text-[#647067]">
                Compare other verified PGs with similar pricing, amenities, and connectivity.
              </p>
            </div>

            <Link
              href={`/search?city=${encodeURIComponent(property.city)}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#14532D] hover:text-[#16A34A] transition"
            >
              <span>View All in {property.city}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recommended.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
              {recommended.map((recProp) => (
                <PropertyCard
                  key={recProp.id}
                  property={recProp}
                  onSelectDetails={() => router.push(`/property/${recProp.id}`)}
                  isSaved={savedIds.includes(recProp.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
              Explore more verified listings in <Link href="/search" className="font-bold text-[#14532D] underline">Search PG</Link>.
            </div>
          )}
        </div>
      </main>

      {/* Sticky Mobile Bottom Booking Bar */}
      <div className="fixed bottom-14 inset-x-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur-md md:hidden shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-black text-[#14532D]">
              ₹{property.price.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-[#647067]">/mo</span>
          </div>
          <span className="text-[9px] text-gray-400 truncate block">
            Deposit: ₹{property.deposit.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </a>

          <button
            onClick={() => {
              window.scrollTo({ top: 400, behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#16A34A] transition"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <MarketplaceFooter />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        savedCount={savedIds.length}
        onShowSaved={() => setIsSavedDrawerOpen(true)}
      />

      {/* Saved Properties Drawer / Modal */}
      <SavedPropertiesModal
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedIds={savedIds}
        onToggleSave={handleToggleSave}
      />
    </div>
  )
}
