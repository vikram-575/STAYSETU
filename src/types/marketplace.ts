export type PropertyType = 'pg' | 'flat' | 'room' | 'apartment' | 'house'
export type GenderPreference = 'boys' | 'girls' | 'coed' | 'any'
export type SharingType = 'Single Room' | 'Double Sharing' | 'Triple Sharing' | 'Four Sharing' | '1 BHK' | '2 BHK' | '3 BHK' | 'Studio'
export type FurnishingType = 'fully_furnished' | 'semi_furnished' | 'unfurnished'

export interface PropertyListing {
  id: string
  title: string
  slug: string
  tagline: string
  propertyType: PropertyType
  genderPreference: GenderPreference
  city: string
  locality: string
  fullAddress: string
  pincode: string
  distanceToMetro: string
  nearestLandmark: string
  price: number // monthly rent in INR
  deposit: number // security deposit in INR
  maintenance: number // monthly maintenance in INR
  lockInPeriod: string // e.g. "1 Month", "3 Months"
  noticePeriod: string // e.g. "30 Days"
  electricityPolicy: string // e.g. "₹9/unit via Sub-meter"
  sharingType: SharingType
  furnishing: FurnishingType
  foodIncluded: boolean
  foodDetails?: string
  foodPlans?: string[] // ['Breakfast', 'Dinner']
  images: string[]
  coverImage: string
  rating: number
  reviewCount: number
  verified: boolean
  superHost: boolean
  zeroBrokerage: boolean
  featured: boolean
  amenities: string[]
  rules: string[]
  coordinates: {
    lat: number
    lng: number
  }
  owner: {
    name: string
    avatar?: string
    phone: string
    whatsapp: string
    email: string
    responseRate: string
    responseTime: string
    verified: boolean
    propertiesCount: number
  }
  availableBeds: number
  totalBeds: number
  availableFrom: string // e.g. "Immediate", "15 Oct"
  postedAt: string
}

export interface CityInfo {
  name: string
  state: string
  listingCount: number
  startingPrice: number
  image: string
  popularLocalities: string[]
}

export interface SearchFilterState {
  searchQuery: string
  city: string
  propertyType: PropertyType | 'all'
  genderPreference: GenderPreference | 'all'
  sharingType: string | 'all'
  furnishing: FurnishingType | 'all'
  minBudget: number
  maxBudget: number
  moveInDate: string
  foodIncludedOnly: boolean
  verifiedOnly: boolean
  zeroBrokerageOnly: boolean
  selectedAmenities: string[]
  sortBy: 'recommended' | 'price_low' | 'price_high' | 'rating'
}

export interface PropertyEnquiry {
  propertyId: string
  fullName: string
  phone: string
  email: string
  moveInDate: string
  sharingChoice: string
  message: string
}

export interface NewListingFormData {
  propertyType: PropertyType
  propertyName: string
  tagline: string
  city: string
  locality: string
  fullAddress: string
  pincode: string
  nearestMetro: string
  landmark: string
  totalRooms: number
  availableBeds: number
  sharingOptions: SharingType[]
  rentMonthly: number
  securityDeposit: number
  maintenanceCharges: number
  electricityRate: string
  noticePeriodDays: number
  foodProvided: boolean
  mealsOffered: string[]
  foodType: 'veg_only' | 'veg_and_non_veg' | 'none'
  amenities: string[]
  genderPreference: GenderPreference
  gateClosingTime: string
  smokingAllowed: boolean
  drinkingAllowed: boolean
  visitorsAllowed: boolean
  petFriendly: boolean
  ownerName: string
  ownerPhone: string
  ownerWhatsapp: string
  ownerEmail: string
  imageUrls: string[]
}
