export type UserRole = 'superadmin' | 'owner' | 'manager' | 'accountant' | 'staff' | 'resident'
export type BedStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'blocked'
export type ResidentStatus = 'active' | 'checked_out' | 'temporarily_absent'
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other'
export type PaymentStatus = 'pending' | 'completed' | 'reversed' | 'failed'
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
export type ChargeCategory =
  | 'rent' | 'electricity' | 'food' | 'beverage' | 'laundry'
  | 'cleaning' | 'parking' | 'guest' | 'damage' | 'late_fee'
  | 'maintenance' | 'security_deposit' | 'other'
export type DocumentType =
  | 'aadhaar' | 'pan' | 'passport' | 'driving_licence' | 'voter_id'
  | 'student_id' | 'company_id' | 'agreement' | 'police_verification' | 'photo' | 'other'
export type DocumentStatus = 'uploaded' | 'verified' | 'rejected' | 'expired'
export type NotificationChannel = 'whatsapp' | 'sms' | 'in_app' | 'push'
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
export type ExpenseCategory =
  | 'electricity' | 'water' | 'internet' | 'staff_salary' | 'maintenance'
  | 'cleaning' | 'food_procurement' | 'repairs' | 'property_rent' | 'supplies' | 'other'
export type AllocationMethod =
  | 'equal_split' | 'per_resident' | 'custom_percentage' | 'custom_units' | 'room_based' | 'fixed_per_person'

// ── Core Entities ──────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  owner_user_id: string | null
  logo_url: string | null
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  gst_enabled: boolean
  currency_code: string
  timezone: string
  settings: Record<string, unknown>
  created_at: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  resident_id: string | null
  created_at: string
}

export interface Property {
  id: string
  organization_id: string
  name: string
  address: string | null
  city: string | null
  is_active: boolean
}

export interface Building {
  id: string
  organization_id: string
  property_id: string
  name: string
  total_floors: number
  is_active: boolean
}

export interface Floor {
  id: string
  building_id: string
  floor_number: number
  name: string
  is_active: boolean
}

export interface Room {
  id: string
  organization_id: string
  floor_id: string
  room_number: string
  name: string | null
  capacity: number
  room_type: string | null
  base_rent_paise: number
  is_active: boolean
  // Joined
  floor?: Floor
  building?: Building
  property?: Property
}

export interface Bed {
  id: string
  organization_id: string
  room_id: string
  bed_label: string
  status: BedStatus
  base_rent_paise: number | null
  description: string | null
  // Joined
  room?: Room
  current_resident?: ResidentCurrentView | null
}

export interface Resident {
  id: string
  organization_id: string
  registration_number: string
  full_name: string
  phone: string
  alternate_phone: string | null
  email: string | null
  photo_url: string | null
  date_of_birth: string | null
  gender: string | null
  permanent_address: string | null
  permanent_city: string | null
  permanent_state: string | null
  id_type: string | null
  id_number: string | null
  emergency_name: string | null
  emergency_phone: string | null
  emergency_relation: string | null
  status: ResidentStatus
  notes: string | null
  created_at: string
}

export interface ResidentCurrentView {
  resident_id: string
  organization_id: string
  registration_number: string
  full_name: string
  phone: string
  email: string | null
  photo_url: string | null
  status: ResidentStatus
  // Assignment
  assignment_id: string | null
  check_in_date: string | null
  monthly_rent_paise: number | null
  billing_cycle_day: number | null
  // Bed
  bed_id: string | null
  bed_label: string | null
  bed_status: BedStatus | null
  // Room
  room_id: string | null
  room_number: string | null
  room_name: string | null
  // Floor
  floor_id: string | null
  floor_name: string | null
  floor_number: number | null
  // Building
  building_id: string | null
  building_name: string | null
  // Property
  property_id: string | null
  property_name: string | null
  // Financial
  total_outstanding_paise: number
  total_paid_paise: number
  deposit_held_paise: number
}

export interface ResidentAssignment {
  id: string
  organization_id: string
  resident_id: string
  bed_id: string
  check_in_date: string
  check_out_date: string | null
  monthly_rent_paise: number
  billing_cycle_day: number
  proration_policy: string
  transfer_reason: string | null
  transfer_notes: string | null
  created_at: string
  // Joined
  bed?: Bed
  resident?: Resident
}

export interface Deposit {
  id: string
  organization_id: string
  resident_id: string
  assignment_id: string | null
  amount_paise: number
  received_date: string
  payment_method: PaymentMethod
  reference_no: string | null
  notes: string | null
  is_refunded: boolean
  refunded_at: string | null
  created_at: string
}

export interface ChargeCatalogItem {
  id: string
  organization_id: string
  name: string
  description: string | null
  category: ChargeCategory
  unit_price_paise: number
  unit: string
  gst_rate_pct: number
  is_recurring: boolean
  is_active: boolean
  sort_order: number
}

export interface Invoice {
  id: string
  organization_id: string
  invoice_number: string
  resident_id: string
  assignment_id: string | null
  period_start: string
  period_end: string
  due_date: string
  subtotal_paise: number
  gst_paise: number
  total_paise: number
  paid_paise: number
  balance_paise: number
  status: InvoiceStatus
  notes: string | null
  generated_at: string
  sent_at: string | null
  // Joined
  resident?: Resident
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  catalog_item_id: string | null
  description: string
  category: ChargeCategory
  quantity: number
  unit_price_paise: number
  gst_rate_pct: number
  gst_amount_paise: number
  total_paise: number
  proration_days: number | null
  proration_total_days: number | null
  notes: string | null
  sort_order: number
}

export interface LedgerEntry {
  id: string
  organization_id: string
  resident_id: string
  invoice_id: string | null
  payment_id: string | null
  entry_date: string
  entry_time: string
  description: string
  category: ChargeCategory | null
  entry_type: string
  debit_paise: number
  credit_paise: number
  running_balance_paise: number
  added_by: string | null
  payment_method: PaymentMethod | null
  reference_no: string | null
  notes: string | null
  is_reversal: boolean
  created_at: string
}

export interface Payment {
  id: string
  organization_id: string
  payment_number: string
  resident_id: string
  amount_paise: number
  payment_method: PaymentMethod
  payment_date: string
  payment_time: string
  transaction_id: string | null
  reference_no: string | null
  status: PaymentStatus
  notes: string | null
  collected_by: string | null
  created_at: string
  // Joined
  resident?: Resident
  allocations?: PaymentAllocation[]
}

export interface PaymentAllocation {
  id: string
  payment_id: string
  invoice_id: string
  allocated_paise: number
}

export interface ElectricityMeter {
  id: string
  organization_id: string
  property_id: string
  room_id: string | null
  meter_number: string
  meter_type: string
  allocation_method: AllocationMethod
  is_active: boolean
  notes: string | null
}

export interface ElectricityReading {
  id: string
  meter_id: string
  reading_date: string
  previous_reading: number
  current_reading: number
  units_consumed: number
  rate_per_unit_paise: number
  total_paise: number
  is_meter_reset: boolean
  period_month: number
  period_year: number
  notes: string | null
  created_at: string
}

export interface Expense {
  id: string
  organization_id: string
  property_id: string | null
  category: ExpenseCategory
  description: string
  amount_paise: number
  expense_date: string
  payment_method: PaymentMethod | null
  vendor: string | null
  reference_no: string | null
  notes: string | null
  created_at: string
}

export interface ResidentDocument {
  id: string
  resident_id: string
  doc_type: DocumentType
  doc_name: string
  file_url: string
  file_size_bytes: number | null
  status: DocumentStatus
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  expiry_date: string | null
  created_at: string
}

export interface MessageTemplate {
  id: string
  organization_id: string
  name: string
  event_type: string
  channel: NotificationChannel
  body_template: string
  is_active: boolean
  is_default: boolean
}

export interface MessageLog {
  id: string
  organization_id: string
  resident_id: string | null
  channel: NotificationChannel
  recipient_phone: string
  message_body: string
  status: MessageStatus
  wa_link: string | null
  sms_link: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
  // Joined
  resident?: Resident
}

// ── Dashboard KPIs ─────────────────────────────────────────

export interface DashboardKPIs {
  total_beds: number
  occupied_beds: number
  available_beds: number
  maintenance_beds: number
  active_residents: number
  occupancy_rate: number
  current_month_expected_paise: number
  current_month_collected_paise: number
  current_month_outstanding_paise: number
  total_outstanding_paise: number
  total_overdue_paise: number
  deposits_held_paise: number
  today_collected_paise: number
  collection_rate: number
}

export interface RevenueBreakdown {
  rent_paise: number
  electricity_paise: number
  food_paise: number
  beverage_paise: number
  laundry_paise: number
  other_paise: number
  total_paise: number
}

// ── Forms ─────────────────────────────────────────────────

export interface CheckInFormData {
  // Personal
  full_name: string
  phone: string
  alternate_phone?: string
  email?: string
  date_of_birth?: string
  gender?: string
  // Address
  permanent_address?: string
  permanent_city?: string
  permanent_state?: string
  permanent_pincode?: string
  // Emergency
  emergency_name?: string
  emergency_phone?: string
  emergency_relation?: string
  // ID
  id_type?: string
  id_number?: string
  // Assignment
  property_id: string
  building_id: string
  floor_id: string
  room_id: string
  bed_id: string
  check_in_date: string
  monthly_rent_paise: number
  billing_cycle_day: number
  proration_policy: string
  // Deposit
  deposit_amount_paise?: number
  deposit_payment_method?: PaymentMethod
  // Notes
  notes?: string
}

export interface AddPaymentFormData {
  resident_id: string
  amount_paise: number
  payment_method: PaymentMethod
  payment_date: string
  transaction_id?: string
  reference_no?: string
  notes?: string
  invoice_ids?: string[] // invoices to allocate to
}

export interface AddChargeFormData {
  resident_id: string
  catalog_item_id?: string
  description: string
  category: ChargeCategory
  quantity: number
  unit_price_paise: number
  notes?: string
  invoice_id?: string // add to existing invoice, or create ad-hoc
}
