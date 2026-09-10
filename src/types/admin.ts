export type AdminRole =
  | 'superadmin'
  | 'operations_admin'
  | 'finance_admin'
  | 'support_admin'
  | 'verification_admin'
  | 'content_admin'
  | 'analytics_admin'

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'paused'
  | 'rejected'
  | 'suspended'
  | 'expired'
  | 'rented'

export type OwnerVerificationState =
  | 'not_submitted'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended'

export type BedStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'maintenance'
  | 'blocked'

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'visit_scheduled'
  | 'visited'
  | 'application'
  | 'converted'
  | 'lost'

export type ComplaintStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'escalated'

export interface SuperAdminDashboardStats {
  // Users breakdown
  total_users: number
  users_owners: number
  users_managers: number
  users_tenants: number
  users_staff: number
  users_admins: number

  // Properties & Listings
  total_properties: number
  active_listings: number
  total_pgs: number
  total_flats: number

  // Bed & Occupancy
  total_beds: number
  occupied_beds: number
  vacant_beds: number
  occupancy_rate_pct: number
  total_active_tenancies: number

  // Financials
  monthly_platform_revenue_paise: number
  owner_revenue_paise: number
  outstanding_rent_paise: number
  total_collected_paise: number
  total_billed_paise: number
  deposits_held_paise: number
  subscription_revenue_paise: number
  platform_commission_paise: number
  total_refunds_paise: number

  // Action Queues
  pending_verifications_count: number
  open_complaints_count: number
  new_enquiries_count: number
  scheduled_visits_count: number
  reported_listings_count: number

  // Growth
  properties_growth: {
    today: number
    this_week: number
    this_month: number
    this_year: number
  }
  user_growth: {
    new_owners_month: number
    new_tenants_month: number
  }
  city_breakdown: Record<string, { properties: number; beds: number; occupancy: number; rent_paise: number }>
}

export interface AdminOwnerRecord {
  id: string
  full_name: string
  email: string
  phone: string
  business_name: string
  properties_count: number
  total_beds: number
  occupied_beds: number
  vacant_beds: number
  monthly_revenue_paise: number
  outstanding_paise: number
  listings_count: number
  enquiries_count: number
  subscription_plan: string
  verification_status: OwnerVerificationState
  account_status: 'active' | 'suspended' | 'archived'
  created_at: string
  last_login_at: string | null
  reviewer_name?: string
  verification_notes?: string
}

export interface AdminPropertyStructureItem {
  id: string
  name: string
  property_type: 'pg' | 'flat' | 'hostel' | 'coliving'
  owner_name: string
  owner_email: string
  city: string
  locality: string
  verification_status: 'verified' | 'pending' | 'rejected'
  status: 'active' | 'suspended' | 'inactive'
  total_buildings: number
  total_floors: number
  total_rooms: number
  total_beds: number
  occupied_beds: number
  vacant_beds: number
  occupancy_pct: number
  monthly_expected_revenue_paise: number
  monthly_collected_paise: number
  outstanding_paise: number
  listing_status: ListingStatus
  buildings?: {
    id: string
    name: string
    floors: {
      id: string
      floor_number: number
      name: string
      rooms: {
        id: string
        room_number: string
        capacity: number
        status: 'active' | 'maintenance' | 'blocked' | 'inactive'
        base_rent_paise: number
        beds: {
          id: string
          bed_label: string
          status: BedStatus
          rent_paise: number
          current_resident?: {
            id: string
            name: string
            registration_number: string
            phone: string
            check_in_date: string
          } | null
        }[]
      }[]
    }[]
  }[]
}

export interface AdminResidentRecord {
  id: string
  registration_number: string // Permanent unique identifier (e.g. PG-2026-000427)
  full_name: string
  phone: string
  email: string | null
  photo_url: string | null
  date_of_birth: string | null
  gender: string | null
  emergency_contact: {
    name: string | null
    phone: string | null
    relation: string | null
  }
  property_name: string
  owner_name: string
  room_number: string
  bed_label: string
  check_in_date: string
  expected_exit_date: string | null
  monthly_rent_paise: number
  deposit_paise: number
  current_balance_paise: number
  status: 'active' | 'checked_out' | 'temporarily_absent'
  created_at: string
}

export interface AdminLedgerItem {
  id: string
  date: string
  time: string
  category: string
  amount_paise: number
  is_credit: boolean // credit = payment, debit = charge
  description: string
  created_by: string
  reference_no: string | null
  property_name: string
  resident_name: string
}

export interface AdminPaymentRecord {
  id: string
  transaction_id: string
  amount_paise: number
  payment_date: string
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'card' | 'online' | 'other'
  status: 'completed' | 'pending' | 'reversed' | 'failed'
  invoice_number?: string
  property_name: string
  resident_name: string
  owner_name: string
  collector_name: string
  is_reversed: boolean
  reversal_reason?: string
  reversed_at?: string
  reversed_by?: string
}

export interface AdminComplaintRecord {
  id: string
  ticket_number: string
  title: string
  description: string
  category: 'property' | 'owner' | 'tenant' | 'payment' | 'electricity' | 'maintenance' | 'fraud' | 'listing' | 'technical'
  status: ComplaintStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  property_name: string
  resident_name: string
  owner_name: string
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface AdminListingRecord {
  id: string
  title: string
  property_name: string
  owner_name: string
  city: string
  locality: string
  property_type: string
  monthly_rent_paise: number
  deposit_paise: number
  sharing_type: string
  status: ListingStatus
  is_featured: boolean
  featured_priority?: number
  featured_until?: string
  views_count: number
  enquiries_count: number
  created_at: string
  updated_at: string
  flagged_reason?: string
}

export interface AdminEnquiryRecord {
  id: string
  tenant_name: string
  tenant_phone: string
  tenant_email: string
  property_name: string
  owner_name: string
  sharing_choice: string
  status: EnquiryStatus
  created_at: string
  notes?: string
}

export interface AdminVisitRecord {
  id: string
  tenant_name: string
  tenant_phone: string
  property_name: string
  owner_name: string
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  created_at: string
}

export interface AdminAuditLogRecord {
  id: string
  admin_email: string
  action: string
  entity_type: string
  entity_id: string
  property_name?: string
  timestamp: string
  previous_value?: any
  new_value?: any
  reason?: string
}

export interface SystemHealthDiagnostics {
  api_status: 'healthy' | 'degraded' | 'down'
  database_status: 'healthy' | 'degraded' | 'down'
  database_latency_ms: number
  storage_status: 'healthy' | 'degraded' | 'down'
  whatsapp_status: 'connected' | 'error' | 'unconfigured'
  sms_status: 'connected' | 'error' | 'unconfigured'
  payment_gateway_status: 'connected' | 'error' | 'unconfigured'
  background_jobs_status: 'running' | 'paused' | 'error'
  error_rate_pct: number
  last_checked_at: string
}
