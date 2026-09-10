'use client'

import React, { useState } from 'react'
import {
  X,
  CheckCircle,
  Building2,
  MapPin,
  BedDouble,
  IndianRupee,
  Utensils,
  Sparkles,
  ShieldCheck,
  Camera,
  User,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react'
import { PropertyType, GenderPreference, SharingType, NewListingFormData } from '@/types/marketplace'

interface ListPropertyModalProps {
  isOpen: boolean
  onClose: () => void
  onListingCreated?: (listing: any) => void
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Building2 },
  { id: 2, title: 'Location', icon: MapPin },
  { id: 3, title: 'Inventory', icon: BedDouble },
  { id: 4, title: 'Pricing', icon: IndianRupee },
  { id: 5, title: 'Food & Meals', icon: Utensils },
  { id: 6, title: 'Amenities', icon: Sparkles },
  { id: 7, title: 'House Rules', icon: ShieldCheck },
  { id: 8, title: 'Photos', icon: Camera },
  { id: 9, title: 'Owner Profile', icon: User },
  { id: 10, title: 'Review & Post', icon: CheckCircle },
]

const ALL_AMENITIES = [
  'High-speed WiFi (300 Mbps)',
  'Inverter AC',
  '100% Power Backup',
  'Attached Washroom with Geyser',
  'Daily Housekeeping',
  'Washing Machine & Dryer',
  'RO Water Purifier',
  'Biometric Entry & CCTV',
  'Rooftop Lounge',
  'Gym & Fitness Zone',
  'Covered Two-Wheeler Parking',
  'Car Parking Space',
  'Refrigerator in Room / Floor',
  'Microwave & Induction',
]

export function ListPropertyModal({ isOpen, onClose, onListingCreated }: ListPropertyModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [formData, setFormData] = useState<NewListingFormData>({
    propertyType: 'pg',
    propertyName: '',
    tagline: '',
    city: 'Bangalore',
    locality: '',
    fullAddress: '',
    pincode: '',
    nearestMetro: '',
    landmark: '',
    totalRooms: 12,
    availableBeds: 4,
    sharingOptions: ['Double Sharing', 'Single Room'],
    rentMonthly: 9500,
    securityDeposit: 9500,
    maintenanceCharges: 0,
    electricityRate: '₹9/unit via Sub-meter',
    noticePeriodDays: 30,
    foodProvided: true,
    mealsOffered: ['Breakfast', 'Dinner'],
    foodType: 'veg_and_non_veg',
    amenities: [
      'High-speed WiFi (300 Mbps)',
      'Inverter AC',
      '100% Power Backup',
      'Daily Housekeeping',
      'RO Water Purifier',
    ],
    genderPreference: 'coed',
    gateClosingTime: '11:00 PM',
    smokingAllowed: false,
    drinkingAllowed: false,
    visitorsAllowed: true,
    petFriendly: false,
    ownerName: '',
    ownerPhone: '',
    ownerWhatsapp: '',
    ownerEmail: '',
    imageUrls: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
    ],
  })

  if (!isOpen) return null

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setIsSubmitted(true)
      if (onListingCreated) {
        onListingCreated(formData)
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const toggleMeal = (meal: string) => {
    setFormData((prev) => ({
      ...prev,
      mealsOffered: prev.mealsOffered.includes(meal)
        ? prev.mealsOffered.filter((m) => m !== meal)
        : [...prev.mealsOffered, meal],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Step Indicator */}
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#14532D]">List Your Property Free</h3>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#F59E0B]">
                  Owner / Landlord
                </span>
              </div>
              <p className="text-xs text-[#647067]">
                Step {currentStep} of 10: <span className="font-semibold text-[#17211B]">{STEPS[currentStep - 1].title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100">
          <div
            className="h-full bg-[#16A34A] transition-all duration-300"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 sm:p-8">
          {isSubmitted ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="mt-4 text-2xl font-bold text-[#14532D]">
                Property Submitted Successfully!
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#647067]">
                Your listing <strong className="text-[#17211B]">{formData.propertyName || 'New Property'}</strong> is being verified by our team and will go live on the StaySetu marketplace within 2 hours.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setIsSubmitted(false)
                    setCurrentStep(1)
                    onClose()
                  }}
                  className="rounded-xl bg-[#14532D] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#16A34A]"
                >
                  Close & Explore Marketplace
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Select Property Type & Details</h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#17211B] mb-2">
                      What kind of space are you listing?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'pg', label: 'PG / Co-living', desc: 'Bed-by-bed with food & amenities' },
                        { id: 'flat', label: 'Full Flat', desc: 'Independent 1/2/3 BHK' },
                        { id: 'room', label: 'Private Room', desc: 'Single room in shared house' },
                        { id: 'apartment', label: 'Gated Apartment', desc: 'High-rise society flat' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, propertyType: type.id as PropertyType })}
                          className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition ${
                            formData.propertyType === type.id
                              ? 'border-[#16A34A] bg-[#DCFCE7]/30 ring-2 ring-[#DCFCE7]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-bold text-[#17211B]">{type.label}</span>
                          <span className="text-[11px] text-[#647067] mt-1">{type.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17211B]">
                      Property / Hostel Name
                    </label>
                    <input
                      type="text"
                      value={formData.propertyName}
                      onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                      placeholder="e.g. Olive Grand Co-living Residency"
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17211B]">
                      Tagline / Highlight
                    </label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="e.g. 5 mins walk to Cyber City metro with 3-times homestyle buffet"
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Location & Address */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Location & Address</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">City</label>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      >
                        <option value="Bangalore">Bangalore</option>
                        <option value="Gurgaon">Gurgaon</option>
                        <option value="Noida">Noida</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Pune">Pune</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Ahmedabad">Ahmedabad</option>
                        <option value="Jaipur">Jaipur</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Locality / Neighborhood
                      </label>
                      <input
                        type="text"
                        value={formData.locality}
                        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                        placeholder="e.g. Koramangala 4th Block"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17211B]">
                      Full Street Address
                    </label>
                    <input
                      type="text"
                      value={formData.fullAddress}
                      onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                      placeholder="e.g. Plot 42B, 80 Feet Road, Near Sony World Signal"
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Nearest Metro / Transit
                      </label>
                      <input
                        type="text"
                        value={formData.nearestMetro}
                        onChange={(e) => setFormData({ ...formData, nearestMetro: e.target.value })}
                        placeholder="e.g. 500m from Sony World Transit"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="e.g. 560034"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Inventory */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Rooms & Bed Capacity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Total Rooms in Property
                      </label>
                      <input
                        type="number"
                        value={formData.totalRooms}
                        onChange={(e) =>
                          setFormData({ ...formData, totalRooms: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Currently Available Beds
                      </label>
                      <input
                        type="number"
                        value={formData.availableBeds}
                        onChange={(e) =>
                          setFormData({ ...formData, availableBeds: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17211B] mb-2">
                      Sharing Configurations Offered
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Single Room',
                        'Double Sharing',
                        'Triple Sharing',
                        'Four Sharing',
                        '1 BHK',
                        '2 BHK',
                      ].map((sharing) => {
                        const isSelected = formData.sharingOptions.includes(sharing as SharingType)
                        return (
                          <button
                            key={sharing}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                sharingOptions: isSelected
                                  ? formData.sharingOptions.filter((s) => s !== sharing)
                                  : [...formData.sharingOptions, sharing as SharingType],
                              })
                            }}
                            className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                              isSelected
                                ? 'bg-[#14532D] text-white border-[#14532D]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {sharing}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Pricing & Deposit */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Pricing & Financials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Monthly Rent (INR)
                      </label>
                      <input
                        type="number"
                        value={formData.rentMonthly}
                        onChange={(e) =>
                          setFormData({ ...formData, rentMonthly: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Security Deposit (INR)
                      </label>
                      <input
                        type="number"
                        value={formData.securityDeposit}
                        onChange={(e) =>
                          setFormData({ ...formData, securityDeposit: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Electricity Policy
                      </label>
                      <input
                        type="text"
                        value={formData.electricityRate}
                        onChange={(e) => setFormData({ ...formData, electricityRate: e.target.value })}
                        placeholder="e.g. ₹9/unit via Sub-meter"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Notice Period (Days)
                      </label>
                      <input
                        type="number"
                        value={formData.noticePeriodDays}
                        onChange={(e) =>
                          setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Food & Meal Plans */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Food & Meal Plans</h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="foodProvided"
                      checked={formData.foodProvided}
                      onChange={(e) => setFormData({ ...formData, foodProvided: e.target.checked })}
                      className="h-5 w-5 rounded-md text-[#16A34A] focus:ring-[#16A34A]"
                    />
                    <label htmlFor="foodProvided" className="text-sm font-bold text-[#17211B]">
                      Is food / meals provided at this property?
                    </label>
                  </div>

                  {formData.foodProvided && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Meals Served Daily
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Breakfast', 'Lunch', 'Hi-Tea', 'Dinner', 'Packed Tiffin'].map((meal) => {
                          const isSelected = formData.mealsOffered.includes(meal)
                          return (
                            <button
                              key={meal}
                              type="button"
                              onClick={() => toggleMeal(meal)}
                              className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                                isSelected
                                  ? 'bg-[#16A34A] text-white border-[#16A34A]'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {isSelected ? `✓ ${meal}` : meal}
                            </button>
                          )
                        })}
                      </div>

                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-[#17211B]">Dietary Type</label>
                        <div className="mt-1 flex gap-3">
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <input
                              type="radio"
                              name="foodType"
                              checked={formData.foodType === 'veg_only'}
                              onChange={() => setFormData({ ...formData, foodType: 'veg_only' })}
                            />
                            <span>Pure Veg Only</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <input
                              type="radio"
                              name="foodType"
                              checked={formData.foodType === 'veg_and_non_veg'}
                              onChange={() => setFormData({ ...formData, foodType: 'veg_and_non_veg' })}
                            />
                            <span>Veg & Non-Veg Both</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Amenities Selection */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Select Amenities & Services</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ALL_AMENITIES.map((amenity) => {
                      const isChecked = formData.amenities.includes(amenity)
                      return (
                        <div
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer text-xs font-semibold transition ${
                            isChecked
                              ? 'border-[#16A34A] bg-[#DCFCE7]/40 text-[#14532D]'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              isChecked ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'border-gray-300'
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span>{amenity}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 7: House Rules & Preferences */}
              {currentStep === 7 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">House Rules & Preferences</h4>
                  <div>
                    <label className="block text-xs font-semibold text-[#17211B]">
                      Resident Preference
                    </label>
                    <div className="mt-1 flex gap-3">
                      {[
                        { id: 'coed', label: 'Co-ed Living' },
                        { id: 'girls', label: 'Girls Only' },
                        { id: 'boys', label: 'Boys Only' },
                        { id: 'any', label: 'Families / Any' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, genderPreference: g.id as GenderPreference })
                          }
                          className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                            formData.genderPreference === g.id
                              ? 'bg-[#14532D] text-white border-[#14532D]'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Night Gate Closing Time
                      </label>
                      <input
                        type="text"
                        value={formData.gateClosingTime}
                        onChange={(e) => setFormData({ ...formData, gateClosingTime: e.target.value })}
                        placeholder="e.g. 11:30 PM (Biometric pass available)"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Photos & Media */}
              {currentStep === 8 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Photos & Media</h4>
                  <p className="text-xs text-[#647067]">
                    High quality photos get up to 4x more direct booking enquiries.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#17211B]">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrls[0] || ''}
                      onChange={(e) => setFormData({ ...formData, imageUrls: [e.target.value] })}
                      placeholder="https://images.unsplash.com/..."
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                    />
                  </div>

                  {formData.imageUrls[0] && (
                    <div className="aspect-16/9 w-full max-w-sm overflow-hidden rounded-xl bg-gray-100 border">
                      <img
                        src={formData.imageUrls[0]}
                        alt="Listing Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 9: Owner / Manager Profile */}
              {currentStep === 9 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Owner & Manager Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">Full Name</label>
                      <input
                        type="text"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="e.g. Rajesh Hegde"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.ownerPhone}
                        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                        placeholder="e.g. 9845012345"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">
                        WhatsApp Number (for direct chat)
                      </label>
                      <input
                        type="tel"
                        value={formData.ownerWhatsapp}
                        onChange={(e) => setFormData({ ...formData, ownerWhatsapp: e.target.value })}
                        placeholder="e.g. 919845012345"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17211B]">Email Address</label>
                      <input
                        type="email"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        placeholder="e.g. rajesh@olivecoliving.in"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-[#16A34A] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 10: Review & Post */}
              {currentStep === 10 && (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="text-lg font-bold text-[#17211B]">Review & Publish Listing</h4>
                  <div className="rounded-2xl border border-gray-200 bg-[#F7FAF7] p-4 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Property:</span>
                      <span className="font-bold text-[#17211B]">{formData.propertyName || 'Unnamed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Location:</span>
                      <span className="font-bold text-[#17211B]">
                        {formData.locality}, {formData.city}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Rent / mo:</span>
                      <span className="font-bold text-[#14532D]">
                        ₹{formData.rentMonthly.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Deposit:</span>
                      <span className="font-bold text-[#17211B]">
                        ₹{formData.securityDeposit.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-500">Meals Included:</span>
                      <span className="font-bold text-[#17211B]">
                        {formData.foodProvided ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#DCFCE7]/70 p-3 text-xs text-[#14532D] font-medium">
                    ✓ By publishing, you agree to StaySetu&apos;s Zero Brokerage Direct Guarantee and honest pricing pledge.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!isSubmitted && (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 transition ${
                currentStep === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] px-6 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
            >
              <span>{currentStep === 10 ? 'Publish Listing Free' : 'Next Step'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
