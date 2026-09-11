/**
 * PG-SETU Profile System
 * Core types, ID generation, and utility functions for
 * Tenant Profiles and PG Owner Profiles
 */

// ─── COLLECTION NAMES ──────────────────────────────────────────────────────────

export const PROFILE_COLLECTIONS = {
  TENANT_PROFILES: 'tenant_profiles',
  OWNER_PROFILES: 'owner_profiles',
} as const

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ProfileType = 'tenant' | 'owner'

export type RoomType = 'single' | 'double' | 'triple' | 'dormitory' | 'any'
export type Gender = 'male' | 'female' | 'other'
export type ProfileStatus = 'active' | 'paused' | 'deactivated'

export interface TenantProfile {
  id: string // TN4827K3M format
  type: 'tenant'
  full_name: string
  mobile: string // unique within tenant_profiles
  email?: string
  dob?: string // YYYY-MM-DD
  gender?: Gender
  profession?: string // student / working / business
  current_city: string
  preferred_cities: string[] // cities where they want to find PG
  budget_min_paise: number // monthly budget min in paise
  budget_max_paise: number // monthly budget max in paise
  required_amenities: string[] // wifi, AC, laundry, food, parking, etc.
  preferred_room_type: RoomType
  move_in_date?: string // YYYY-MM-DD
  additional_notes?: string
  profile_status: ProfileStatus
  verified_mobile: boolean
  profile_photo_url?: string
  created_at: string
  updated_at: string
}

export interface OwnerProfile {
  id: string // OW9143B7X format
  type: 'owner'
  full_name: string
  mobile: string // unique within owner_profiles
  email?: string
  dob?: string
  gender?: Gender
  operating_cities: string[] // cities where they have/want properties
  property_types: string[] // PG / flat / hostel / independent house
  total_beds_approx?: number
  experience_years?: number
  pan_number?: string
  aadhaar_last4?: string
  gst_number?: string
  additional_notes?: string
  profile_status: ProfileStatus
  verified_mobile: boolean
  profile_photo_url?: string
  created_at: string
  updated_at: string
}

export type AnyProfile = TenantProfile | OwnerProfile

// ─── ID GENERATION ────────────────────────────────────────────────────────────

const DIGITS = '0123456789'
const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function pickUnique(pool: string, count: number): string {
  const chars = pool.split('')
  const result: string[] = []
  while (result.length < count) {
    const idx = Math.floor(Math.random() * chars.length)
    const char = chars[idx]
    if (!result.includes(char)) {
      result.push(char)
    }
  }
  return result.join('')
}

export function generateTenantId(): string {
  const digits = pickUnique(DIGITS, 4)
  const alphaPool = ALPHANUMERIC.replace(new RegExp('[' + digits + ']', 'g'), '')
  const alphas = pickUnique(alphaPool, 3)
  return 'TN' + digits + alphas
}

export function generateOwnerId(): string {
  const digits = pickUnique(DIGITS, 4)
  const alphaPool = ALPHANUMERIC.replace(new RegExp('[' + digits + ']', 'g'), '')
  const alphas = pickUnique(alphaPool, 3)
  return 'OW' + digits + alphas
}

export function isValidMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''))
}

export function cleanMobile(mobile: string): string {
  let cleaned = mobile.replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  }
  return cleaned
}

export function formatBudget(paise: number): string {
  const rs = paise / 100
  if (rs >= 100000) return '₹' + (rs / 100000).toFixed(1) + 'L'
  if (rs >= 1000) return '₹' + Math.round(rs / 1000) + 'K'
  return '₹' + rs
}

export const AMENITY_OPTIONS = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'ac', label: 'AC' },
  { value: 'food', label: 'Meals Included' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'parking', label: 'Parking' },
  { value: 'gym', label: 'Gym' },
  { value: 'cctv', label: 'CCTV Security' },
  { value: 'power_backup', label: 'Power Backup' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'water_purifier', label: 'Water Purifier' },
  { value: 'attached_bathroom', label: 'Attached Bathroom' },
  { value: 'hot_water', label: 'Hot Water' },
  { value: 'refrigerator', label: 'Refrigerator' },
  { value: 'tv', label: 'TV' },
  { value: 'study_table', label: 'Study Table' },
]

export const PROFESSION_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'working_professional', label: 'Working Professional' },
  { value: 'business', label: 'Business Owner' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'other', label: 'Other' },
]

export const CITY_OPTIONS = [
  'Noida', 'Delhi', 'Gurgaon', 'Faridabad', 'Ghaziabad',
  'Mumbai', 'Pune', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Jaipur', 'Ahmedabad', 'Surat', 'Lucknow',
  'Bhopal', 'Indore', 'Chandigarh', 'Kota', 'Dehradun',
]

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'pg', label: 'PG (Paying Guest)' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'flat', label: 'Flat / Apartment' },
  { value: 'independent_house', label: 'Independent House' },
  { value: 'coliving', label: 'Co-living Space' },
]
