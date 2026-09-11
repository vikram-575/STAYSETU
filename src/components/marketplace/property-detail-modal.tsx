'use client'

import React, { useState } from 'react'
import {
  X,
  Star,
  MapPin,
  Train,
  ShieldCheck,
  CheckCircle,
  Clock,
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
} from 'lucide-react'
import { PropertyListing } from '@/types/marketplace'

interface PropertyDetailModalProps {
  property: PropertyListing | null
  onClose: () => void
  isSaved?: boolean
  onToggleSave?: (propertyId: string) => void
}

export function PropertyDetailModal({
  property,
  onClose,
  isSaved = false,
  onToggleSave,
}: PropertyDetailModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    moveInDate: 'Immediate',
    sharingChoice: property?.sharingType || 'Single Room',
    message: 'Hi, I found this property on PGSetu and would like to schedule a visit.',
  })
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!property) return null

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEnquirySubmitted(true)
    setTimeout(() => {
      // simulate inquiry confirmation
    }, 1500)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out ${property.title} on PGSetu`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const whatsappUrl = `https://wa.me/${property.owner.whatsapp}?text=${encodeURIComponent(
    `Hi ${property.owner.name}, I am interested in ${property.title} listed on PGSetu (${property.sharingType}, ₹${property.price}/mo). Is a bed available for move-in?`
  )}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative my-8 w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header with Title & Close */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/95 px-5 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#DCFCE7] px-2 py-0.5 text-xs font-bold text-[#14532D]">
              {property.propertyType.toUpperCase()}
            </span>
            {property.verified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] px-2 py-0.5 text-xs font-bold text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Physically Verified</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
              title="Share listing"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(property.id)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition ${
                  isSaved ? 'bg-rose-50 text-rose-600 border-rose-200' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Save to favorites"
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-rose-600' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Main Photo Gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Primary Large Image */}
            <div className="relative aspect-16/10 lg:col-span-8 overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={property.images[selectedImageIdx] || property.coverImage}
                alt={property.title}
                className="h-full w-full object-cover"
              />
              {property.images.length > 1 && (
                <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={() =>
                      setSelectedImageIdx((idx) => (idx > 0 ? idx - 1 : property.images.length - 1))
                    }
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIdx((idx) => (idx < property.images.length - 1 ? idx + 1 : 0))
                    }
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 shadow-md"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Column */}
            <div className="flex lg:flex-col gap-2.5 lg:col-span-4 overflow-x-auto lg:overflow-x-hidden">
              {property.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIdx(i)}
                  className={`relative aspect-16/10 w-28 lg:w-full shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    selectedImageIdx === i
                      ? 'border-[#16A34A] ring-2 ring-[#DCFCE7]'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`View ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Layout: Main Details Left (7 cols) + Sticky Enquiry Right (5 cols) */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Content Area */}
            <div className="lg:col-span-7 space-y-8">
              {/* Title & Location Header */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2.5 py-1 text-xs font-bold text-[#17211B]">
                    <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span>{property.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({property.reviewCount} reviews)</span>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    {property.sharingType}
                  </span>
                  <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 capitalize">
                    {property.furnishing.replace('_', ' ')}
                  </span>
                </div>

                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#17211B]">
                  {property.title}
                </h1>

                <p className="mt-1 text-sm text-[#647067] italic font-medium">{property.tagline}</p>

                <div className="mt-3 flex flex-col gap-1 text-xs text-[#647067]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#16A34A] shrink-0" />
                    <span className="font-semibold text-[#17211B]">{property.fullAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-5 text-gray-500">
                    <Train className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{property.distanceToMetro}</span>
                    <span>• Landmark: {property.nearestLandmark}</span>
                  </div>
                </div>
              </div>

              {/* Complete Pricing Breakdown Table */}
              <div className="rounded-2xl border border-gray-200 bg-[#F7FAF7] p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#14532D]">
                  Transparent Financial Breakdown
                </h3>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Monthly Rent</span>
                    <p className="mt-1 text-lg font-extrabold text-[#14532D]">
                      ₹{property.price.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-gray-500">Per bed/room</span>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Security Deposit</span>
                    <p className="mt-1 text-lg font-extrabold text-[#17211B]">
                      ₹{property.deposit.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold">100% Refundable</span>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Maintenance</span>
                    <p className="mt-1 text-lg font-extrabold text-[#17211B]">
                      {property.maintenance === 0 ? 'FREE (₹0)' : `₹${property.maintenance}`}
                    </p>
                    <span className="text-[10px] text-gray-500">Monthly</span>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Lock-in Period</span>
                    <p className="mt-1 text-sm font-bold text-[#17211B]">{property.lockInPeriod}</p>
                    <span className="text-[10px] text-gray-500">Notice: {property.noticePeriod}</span>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-3 col-span-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">
                      Electricity & Metering
                    </span>
                    <p className="mt-1 text-sm font-bold text-[#14532D]">
                      {property.electricityPolicy}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      Transparent automated readings in Tenant Passbook
                    </span>
                  </div>
                </div>
              </div>

              {/* Food & Meal Plans */}
              {property.foodIncluded && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                  <div className="flex items-center gap-2 text-[#14532D]">
                    <Utensils className="h-5 w-5 text-[#16A34A]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">
                      Nutritious Meals Included
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-[#17211B] font-medium">{property.foodDetails}</p>
                  {property.foodPlans && property.foodPlans.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {property.foodPlans.map((plan, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#14532D] shadow-2xs border border-emerald-200"
                        >
                          ✓ {plan}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full Amenities Checklist */}
              <div>
                <h3 className="text-base font-bold text-[#17211B]">Amenities & Conveniences</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-gray-100 bg-[#F7FAF7] p-2.5 text-xs font-semibold text-[#17211B]"
                    >
                      <CheckCircle className="h-4 w-4 text-[#16A34A] shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* House Rules & Policies */}
              <div>
                <h3 className="text-base font-bold text-[#17211B]">House Guidelines & Rules</h3>
                <div className="mt-3 space-y-2">
                  {property.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-xs sm:text-sm text-[#647067]"
                    >
                      <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Owner / Manager Profile Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14532D] text-white font-bold text-lg">
                      {property.owner.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-bold text-[#17211B]">{property.owner.name}</h4>
                        {property.owner.verified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#14532D]">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Verified Host</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#647067]">
                        Response rate: <span className="font-semibold text-emerald-700">{property.owner.responseRate}</span> • Reply time:{' '}
                        <span className="font-semibold">{property.owner.responseTime}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${property.owner.phone}`}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2 text-xs font-bold text-[#17211B] hover:bg-gray-50"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Call Host</span>
                  </a>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2 text-xs font-bold text-white hover:opacity-95"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Sticky Column: Visit / Booking Enquiry Card */}
            <div className="lg:col-span-5">
              <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-lg ring-1 ring-black/5">
                <div className="border-b border-gray-100 pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#16A34A]">
                    Instant Connect & Zero Brokerage
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-[#14532D]">
                      ₹{property.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-[#647067]">/month</span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    ✓ Available for {property.availableFrom} move-in
                  </p>
                </div>

                {enquirySubmitted ? (
                  <div className="my-6 rounded-xl bg-[#DCFCE7]/70 p-5 text-center">
                    <CheckCircle className="mx-auto h-10 w-10 text-[#16A34A]" />
                    <h4 className="mt-2 text-base font-bold text-[#14532D]">
                      Visit Request Sent!
                    </h4>
                    <p className="mt-1 text-xs text-[#17211B]">
                      {property.owner.name} has received your contact details and will call/WhatsApp you within 15 minutes.
                    </p>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-bold text-white"
                    >
                      <span>Open WhatsApp Now</span>
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="mt-4 space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">Your Full Name</label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={enquiryForm.fullName}
                          onChange={(e) =>
                            setEnquiryForm({ ...enquiryForm, fullName: e.target.value })
                          }
                          placeholder="e.g. Sachin Tomar"
                          className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-2 pl-9 pr-3 text-xs font-medium focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Mobile Number (for verification)
                      </label>
                      <div className="relative mt-1">
                        <PhoneCall className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={enquiryForm.phone}
                          onChange={(e) =>
                            setEnquiryForm({ ...enquiryForm, phone: e.target.value })
                          }
                          placeholder="e.g. 9876543210"
                          className="w-full rounded-xl border border-gray-200 bg-[#F7FAF7] py-2 pl-9 pr-3 text-xs font-medium focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Move-in Timeline
                      </label>
                      <div className="relative mt-1">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                          value={enquiryForm.moveInDate}
                          onChange={(e) =>
                            setEnquiryForm({ ...enquiryForm, moveInDate: e.target.value })
                          }
                          className="w-full appearance-none rounded-xl border border-gray-200 bg-[#F7FAF7] py-2 pl-9 pr-3 text-xs font-medium focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                        >
                          <option value="Immediate">Immediate (Within 2 days)</option>
                          <option value="Within 7 Days">Within 7 Days</option>
                          <option value="Next Month">1st of Next Month</option>
                          <option value="Flexible">Just exploring</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Custom Message to Host
                      </label>
                      <textarea
                        rows={2}
                        value={enquiryForm.message}
                        onChange={(e) =>
                          setEnquiryForm({ ...enquiryForm, message: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F7FAF7] p-2.5 text-xs font-medium focus:border-[#16A34A] focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition"
                    >
                      <Send className="h-4 w-4" />
                      <span>Schedule Free Visit</span>
                    </button>

                    <p className="text-center text-[11px] text-[#647067] flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
                      <span>Zero spam guarantee. Direct contact with verified property owner.</span>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
