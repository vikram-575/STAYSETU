-- ============================================================
-- PG-SETU COMPLETE ONE-CLICK SCHEMA SETUP FOR NEW SUPABASE PROJECT
-- Project Ref: ouefslqwkxviijqtvgtv
-- ============================================================


-- >>> START OF 001_core_schema.sql <<<

-- ============================================================
-- PG-SETU: Core Database Schema
-- All monetary values stored in PAISE (integer). ₹1 = 100 paise
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'accountant', 'staff', 'resident');
CREATE TYPE bed_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance', 'blocked');
CREATE TYPE resident_status AS ENUM ('active', 'checked_out', 'temporarily_absent');
CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'bank_transfer', 'card', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'reversed', 'failed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled');
CREATE TYPE charge_category AS ENUM (
  'rent', 'electricity', 'food', 'beverage', 'laundry',
  'cleaning', 'parking', 'guest', 'damage', 'late_fee',
  'maintenance', 'security_deposit', 'other'
);
CREATE TYPE document_type AS ENUM (
  'aadhaar', 'pan', 'passport', 'driving_licence',
  'voter_id', 'student_id', 'company_id', 'agreement',
  'police_verification', 'photo', 'other'
);
CREATE TYPE document_status AS ENUM ('uploaded', 'verified', 'rejected', 'expired');
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms', 'in_app', 'push');
CREATE TYPE message_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE notification_event AS ENUM (
  'invoice_created', 'payment_received', 'rent_due', 'rent_overdue',
  'electricity_bill', 'document_expiring', 'checkout_reminder',
  'complaint_updated', 'general_notice'
);
CREATE TYPE expense_category AS ENUM (
  'electricity', 'water', 'internet', 'staff_salary', 'maintenance',
  'cleaning', 'food_procurement', 'repairs', 'property_rent',
  'supplies', 'other'
);
CREATE TYPE allocation_method AS ENUM ('equal_split', 'per_resident', 'custom_percentage', 'custom_units', 'room_based', 'fixed_per_person');
CREATE TYPE transfer_reason AS ENUM ('resident_request', 'room_upgrade', 'room_downgrade', 'maintenance', 'management_decision', 'other');
CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'delete', 'login', 'logout',
  'payment_add', 'payment_reverse', 'charge_add', 'charge_reverse',
  'deposit_add', 'deposit_adjust', 'refund_issue',
  'checkin', 'checkout', 'transfer',
  'document_upload', 'document_verify', 'document_access',
  'invoice_generate', 'invoice_cancel',
  'reminder_send', 'permission_change', 'settings_change'
);

-- ============================================================
-- ORGANIZATIONS (Multi-tenant root)
-- ============================================================

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  owner_user_id   UUID, -- set after user creation
  logo_url        TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  phone           TEXT,
  email           TEXT,
  gstin           TEXT, -- optional GST number
  gst_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  currency_code   TEXT NOT NULL DEFAULT 'INR',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  settings        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- matches Supabase auth.users.id
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  role            user_role NOT NULL DEFAULT 'staff',
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  resident_id     UUID, -- linked if role = 'resident'
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  phone           TEXT,
  email           TEXT,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  settings        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BUILDINGS
-- ============================================================

CREATE TABLE buildings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  total_floors    INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FLOORS
-- ============================================================

CREATE TABLE floors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_number    INTEGER NOT NULL,
  name            TEXT NOT NULL, -- e.g. "Ground Floor", "1st Floor"
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(building_id, floor_number)
);

-- ============================================================
-- ROOMS
-- ============================================================

CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  room_number     TEXT NOT NULL,
  name            TEXT, -- e.g. "Room 204"
  capacity        INTEGER NOT NULL DEFAULT 1,
  room_type       TEXT, -- e.g. "single", "double", "triple", "dormitory"
  base_rent_paise INTEGER NOT NULL DEFAULT 0, -- default rent for beds in this room
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BEDS
-- ============================================================

CREATE TABLE beds (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_label       TEXT NOT NULL, -- "A", "B", "C", "1", "2"
  status          bed_status NOT NULL DEFAULT 'available',
  base_rent_paise INTEGER, -- overrides room rent if set
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, bed_label)
);

-- ============================================================
-- RESIDENTS
-- ============================================================

CREATE TABLE residents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  registration_number TEXT NOT NULL,
  full_name           TEXT NOT NULL,
  phone               TEXT NOT NULL,
  alternate_phone     TEXT,
  email               TEXT,
  photo_url           TEXT,
  date_of_birth       DATE,
  gender              TEXT,
  -- Address
  permanent_address   TEXT,
  permanent_city      TEXT,
  permanent_state     TEXT,
  permanent_pincode   TEXT,
  -- Emergency Contact
  emergency_name      TEXT,
  emergency_phone     TEXT,
  emergency_relation  TEXT,
  -- ID Details
  id_type             TEXT, -- aadhaar, pan, etc.
  id_number           TEXT,
  -- Status
  status              resident_status NOT NULL DEFAULT 'active',
  notes               TEXT,
  -- Meta
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, registration_number)
);

-- Registration number sequence per organization
CREATE SEQUENCE resident_reg_seq START 1;

CREATE TABLE organization_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_seq        INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- RESIDENT ASSIGNMENTS (Room/Bed History)
-- ============================================================

CREATE TABLE resident_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  bed_id          UUID NOT NULL REFERENCES beds(id),
  -- Dates
  check_in_date   DATE NOT NULL,
  check_out_date  DATE, -- NULL = currently assigned
  -- Rent
  monthly_rent_paise INTEGER NOT NULL,
  billing_cycle_day  INTEGER NOT NULL DEFAULT 1, -- day of month rent is due
  proration_policy   TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'none', 'full_month'
  -- Transfer info
  transfer_from_assignment_id UUID REFERENCES resident_assignments(id),
  transfer_reason transfer_reason,
  transfer_notes  TEXT,
  -- Authorized by
  authorized_by   UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL: Only one active assignment per bed
CREATE UNIQUE INDEX idx_one_active_assignment_per_bed
  ON resident_assignments(bed_id)
  WHERE check_out_date IS NULL;

-- CRITICAL: Only one active assignment per resident
CREATE UNIQUE INDEX idx_one_active_assignment_per_resident
  ON resident_assignments(resident_id)
  WHERE check_out_date IS NULL;

-- ============================================================
-- SECURITY DEPOSITS (separate from revenue)
-- ============================================================

CREATE TABLE deposits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  assignment_id   UUID REFERENCES resident_assignments(id),
  amount_paise    INTEGER NOT NULL CHECK (amount_paise >= 0),
  received_date   DATE NOT NULL,
  payment_method  payment_method NOT NULL DEFAULT 'cash',
  reference_no    TEXT,
  notes           TEXT,
  is_refunded     BOOLEAN NOT NULL DEFAULT FALSE,
  refunded_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEPOSIT ADJUSTMENTS
-- ============================================================

CREATE TABLE deposit_adjustments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  deposit_id      UUID NOT NULL REFERENCES deposits(id),
  resident_id     UUID NOT NULL REFERENCES residents(id),
  amount_paise    INTEGER NOT NULL, -- negative = deduction, positive = top-up
  reason          TEXT NOT NULL,
  notes           TEXT,
  adjusted_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CHARGE CATALOG (reusable items)
-- ============================================================

CREATE TABLE charge_catalog (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  category        charge_category NOT NULL DEFAULT 'other',
  unit_price_paise INTEGER NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL DEFAULT 'each', -- 'each', 'per_month', 'per_unit', 'per_day'
  gst_rate_pct    NUMERIC(5,2) NOT NULL DEFAULT 0, -- 0 if GST not applicable
  is_recurring    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number  TEXT NOT NULL,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  assignment_id   UUID REFERENCES resident_assignments(id),
  -- Period
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  due_date        DATE NOT NULL,
  -- Amounts (all in paise)
  subtotal_paise  INTEGER NOT NULL DEFAULT 0,
  gst_paise       INTEGER NOT NULL DEFAULT 0,
  total_paise     INTEGER NOT NULL DEFAULT 0,
  paid_paise      INTEGER NOT NULL DEFAULT 0,
  balance_paise   INTEGER NOT NULL DEFAULT 0, -- total - paid (can be negative = credit)
  -- Status
  status          invoice_status NOT NULL DEFAULT 'draft',
  notes           TEXT,
  -- Meta
  generated_by    UUID REFERENCES users(id),
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, invoice_number)
);

-- Prevent duplicate invoices for same period
CREATE UNIQUE INDEX idx_no_duplicate_invoice_period
  ON invoices(resident_id, period_start, period_end)
  WHERE status != 'cancelled';

-- ============================================================
-- INVOICE ITEMS
-- ============================================================

CREATE TABLE invoice_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  catalog_item_id     UUID REFERENCES charge_catalog(id), -- NULL for custom
  description         TEXT NOT NULL,
  category            charge_category NOT NULL DEFAULT 'other',
  quantity            NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price_paise    INTEGER NOT NULL,
  gst_rate_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  gst_amount_paise    INTEGER NOT NULL DEFAULT 0,
  total_paise         INTEGER NOT NULL, -- quantity * unit_price + gst
  -- Proration
  proration_days      INTEGER, -- if prorated
  proration_total_days INTEGER,
  -- Meta
  sort_order          INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEDGER ENTRIES (append-only financial ledger)
-- ============================================================

CREATE TABLE ledger_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  -- Reference
  invoice_id      UUID REFERENCES invoices(id),
  payment_id      UUID, -- set after payment insert (avoid circular FK)
  -- Entry
  entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description     TEXT NOT NULL,
  category        charge_category,
  entry_type      TEXT NOT NULL, -- 'charge', 'payment', 'adjustment', 'reversal', 'deposit', 'refund', 'credit'
  debit_paise     INTEGER NOT NULL DEFAULT 0,  -- amount owed (charge)
  credit_paise    INTEGER NOT NULL DEFAULT 0,  -- amount paid/credited
  running_balance_paise INTEGER NOT NULL DEFAULT 0, -- maintained by trigger
  -- Meta
  added_by        UUID REFERENCES users(id),
  payment_method  payment_method,
  reference_no    TEXT,
  notes           TEXT,
  attachment_url  TEXT,
  is_reversal     BOOLEAN NOT NULL DEFAULT FALSE,
  reversed_entry_id UUID REFERENCES ledger_entries(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No UPDATE, no DELETE: append-only. Use reversals.
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_number  TEXT NOT NULL,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  -- Amount
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  -- Method
  payment_method  payment_method NOT NULL,
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_id  TEXT,  -- UPI/bank ref
  reference_no    TEXT,
  -- Status
  status          payment_status NOT NULL DEFAULT 'completed',
  -- Meta
  notes           TEXT,
  attachment_url  TEXT,
  collected_by    UUID REFERENCES users(id),
  -- Idempotency
  idempotency_key TEXT UNIQUE, -- prevent duplicate submissions
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, payment_number)
);

-- ============================================================
-- PAYMENT ALLOCATIONS (payment to invoice mapping)
-- ============================================================

CREATE TABLE payment_allocations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_id      UUID NOT NULL REFERENCES payments(id),
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  allocated_paise INTEGER NOT NULL CHECK (allocated_paise > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(payment_id, invoice_id)
);

-- ============================================================
-- ELECTRICITY METERS
-- ============================================================

CREATE TABLE electricity_meters (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id         UUID REFERENCES rooms(id), -- NULL = common/main meter
  meter_number    TEXT NOT NULL,
  meter_type      TEXT NOT NULL DEFAULT 'sub', -- 'main', 'sub', 'virtual'
  allocation_method allocation_method NOT NULL DEFAULT 'equal_split',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, meter_number)
);

-- ============================================================
-- ELECTRICITY READINGS
-- ============================================================

CREATE TABLE electricity_readings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meter_id        UUID NOT NULL REFERENCES electricity_meters(id),
  -- Reading
  reading_date    DATE NOT NULL,
  previous_reading NUMERIC(12,2) NOT NULL,
  current_reading  NUMERIC(12,2) NOT NULL,
  units_consumed   NUMERIC(12,2) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
  rate_per_unit_paise INTEGER NOT NULL, -- paise per unit
  total_paise     INTEGER GENERATED ALWAYS AS (
    ROUND((current_reading - previous_reading) * rate_per_unit_paise)::INTEGER
  ) STORED,
  -- Meter reset support
  is_meter_reset  BOOLEAN NOT NULL DEFAULT FALSE,
  reset_note      TEXT,
  -- Meta
  period_month    INTEGER NOT NULL, -- 1-12
  period_year     INTEGER NOT NULL,
  notes           TEXT,
  recorded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent impossible readings (unless meter reset)
  CONSTRAINT valid_reading CHECK (
    is_meter_reset = TRUE OR current_reading >= previous_reading
  )
);

-- Prevent duplicate readings for same meter/period
CREATE UNIQUE INDEX idx_unique_meter_reading_period
  ON electricity_readings(meter_id, period_year, period_month)
  WHERE is_meter_reset = FALSE;

-- ============================================================
-- ELECTRICITY ALLOCATIONS (split to residents)
-- ============================================================

CREATE TABLE electricity_allocations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reading_id      UUID NOT NULL REFERENCES electricity_readings(id),
  resident_id     UUID NOT NULL REFERENCES residents(id),
  invoice_id      UUID REFERENCES invoices(id),
  -- Allocation
  units_allocated  NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paise     INTEGER NOT NULL DEFAULT 0,
  allocation_method allocation_method NOT NULL,
  custom_percentage NUMERIC(5,2), -- if custom percentage
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reading_id, resident_id)
);

-- ============================================================
-- EXPENSES
-- ============================================================

CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id     UUID REFERENCES properties(id),
  category        expense_category NOT NULL DEFAULT 'other',
  description     TEXT NOT NULL,
  amount_paise    INTEGER NOT NULL CHECK (amount_paise > 0),
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  payment_method,
  vendor          TEXT,
  reference_no    TEXT,
  receipt_url     TEXT,
  notes           TEXT,
  recorded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESIDENT DOCUMENTS
-- ============================================================

CREATE TABLE resident_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  doc_type        document_type NOT NULL,
  doc_name        TEXT NOT NULL,
  file_url        TEXT NOT NULL, -- Supabase Storage signed URL base
  file_size_bytes INTEGER,
  -- Verification
  status          document_status NOT NULL DEFAULT 'uploaded',
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Expiry
  expiry_date     DATE,
  expiry_alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGE TEMPLATES
-- ============================================================

CREATE TABLE message_templates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  event_type      notification_event NOT NULL,
  channel         notification_channel NOT NULL,
  -- Template body. Supports: {{resident_name}}, {{registration_no}},
  -- {{room_no}}, {{bed_no}}, {{amount_due}}, {{due_date}}, {{pg_name}}
  body_template   TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATION RULES (automation config)
-- ============================================================

CREATE TABLE notification_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id     UUID NOT NULL REFERENCES message_templates(id),
  event_type      notification_event NOT NULL,
  channel         notification_channel NOT NULL,
  -- Timing: days relative to event (negative = before, positive = after)
  trigger_days    INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  fallback_channel notification_channel, -- e.g. sms fallback if whatsapp fails
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGE LOGS
-- ============================================================

CREATE TABLE message_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id     UUID REFERENCES residents(id),
  template_id     UUID REFERENCES message_templates(id),
  rule_id         UUID REFERENCES notification_rules(id),
  channel         notification_channel NOT NULL,
  recipient_phone TEXT NOT NULL,
  -- Content
  message_body    TEXT NOT NULL,
  -- Status
  status          message_status NOT NULL DEFAULT 'queued',
  -- wa.me link for manual sending
  wa_link         TEXT,
  sms_link        TEXT,
  -- Provider response
  provider_message_id TEXT,
  provider_response   JSONB,
  error_message       TEXT,
  -- Timestamps
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPLAINTS
-- ============================================================

CREATE TABLE complaints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  status          TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  priority        TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
  assigned_to     UUID REFERENCES users(id),
  resolution_notes TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  user_name       TEXT, -- denormalized for immutability
  action          audit_action NOT NULL,
  entity_type     TEXT NOT NULL, -- 'resident', 'payment', 'invoice', etc.
  entity_id       UUID,
  entity_label    TEXT, -- human-readable identifier
  before_data     JSONB,
  after_data      JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DAILY CASH CLOSING
-- ============================================================

CREATE TABLE daily_closings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id     UUID REFERENCES properties(id),
  closing_date    DATE NOT NULL,
  expected_cash_paise  INTEGER NOT NULL DEFAULT 0,
  recorded_cash_paise  INTEGER NOT NULL DEFAULT 0,
  difference_paise     INTEGER GENERATED ALWAYS AS (recorded_cash_paise - expected_cash_paise) STORED,
  explanation     TEXT, -- required if |difference| > threshold
  closed_by       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, property_id, closing_date)
);

-- ============================================================
-- SETTINGS (key-value per organization)
-- ============================================================

CREATE TABLE settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  value           JSONB NOT NULL DEFAULT 'null',
  description     TEXT,
  updated_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Residents
CREATE INDEX idx_residents_org ON residents(organization_id);
CREATE INDEX idx_residents_phone ON residents(phone);
CREATE INDEX idx_residents_name ON residents USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_residents_reg ON residents(registration_number);
CREATE INDEX idx_residents_status ON residents(status);

-- Assignments
CREATE INDEX idx_assignments_resident ON resident_assignments(resident_id);
CREATE INDEX idx_assignments_bed ON resident_assignments(bed_id);
CREATE INDEX idx_assignments_checkin ON resident_assignments(check_in_date);
CREATE INDEX idx_assignments_checkout ON resident_assignments(check_out_date);

-- Invoices
CREATE INDEX idx_invoices_resident ON invoices(resident_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_period ON invoices(period_start, period_end);
CREATE INDEX idx_invoices_org ON invoices(organization_id);

-- Invoice items
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Ledger
CREATE INDEX idx_ledger_resident ON ledger_entries(resident_id);
CREATE INDEX idx_ledger_date ON ledger_entries(entry_date);
CREATE INDEX idx_ledger_invoice ON ledger_entries(invoice_id);
CREATE INDEX idx_ledger_payment ON ledger_entries(payment_id);

-- Payments
CREATE INDEX idx_payments_resident ON payments(resident_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_org ON payments(organization_id);

-- Rooms & Beds
CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_beds_room ON beds(room_id);
CREATE INDEX idx_beds_status ON beds(status);

-- Electricity
CREATE INDEX idx_elec_readings_meter ON electricity_readings(meter_id);
CREATE INDEX idx_elec_readings_period ON electricity_readings(period_year, period_month);

-- Documents
CREATE INDEX idx_docs_resident ON resident_documents(resident_id);
CREATE INDEX idx_docs_expiry ON resident_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- Messages
CREATE INDEX idx_messages_resident ON message_logs(resident_id);
CREATE INDEX idx_messages_status ON message_logs(status);
CREATE INDEX idx_messages_created ON message_logs(created_at);

-- Audit
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- Expenses
CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);


-- >>> START OF 002_functions_triggers.sql <<<

-- ============================================================
-- PG-SETU: Database Functions & Triggers
-- ============================================================

-- ============================================================
-- FUNCTION: Generate Registration Number
-- Format: PG-YYYY-NNNNNN
-- ============================================================

CREATE OR REPLACE FUNCTION generate_registration_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_seq  INTEGER;
  v_reg  TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  -- Upsert sequence for org
  INSERT INTO organization_sequences(organization_id, last_seq)
  VALUES (p_org_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET last_seq = organization_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  v_reg := 'PG-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
  RETURN v_reg;
END;
$$;

-- ============================================================
-- FUNCTION: Generate Invoice Number
-- Format: INV-YYYY-MM-NNNNNN
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_seq        INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_invoice_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_period TEXT;
  v_seq    INTEGER;
BEGIN
  v_period := TO_CHAR(NOW(), 'YYYY-MM');

  INSERT INTO invoice_sequences(organization_id, last_seq)
  VALUES (p_org_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN 'INV-' || v_period || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

-- ============================================================
-- FUNCTION: Generate Payment Number
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_seq        INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_payment_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  INSERT INTO payment_sequences(organization_id, last_seq)
  VALUES (p_org_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET last_seq = payment_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

-- ============================================================
-- TRIGGER: Update bed status on assignment change
-- ============================================================

CREATE OR REPLACE FUNCTION sync_bed_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.check_out_date IS NULL THEN
    -- New active assignment -> mark bed occupied
    UPDATE beds SET status = 'occupied', updated_at = NOW()
    WHERE id = NEW.bed_id;

  ELSIF TG_OP = 'UPDATE' AND NEW.check_out_date IS NOT NULL AND OLD.check_out_date IS NULL THEN
    -- Assignment closed -> mark bed available (unless maintenance/blocked)
    UPDATE beds SET status = 'available', updated_at = NOW()
    WHERE id = NEW.bed_id AND status = 'occupied';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_bed_status
AFTER INSERT OR UPDATE ON resident_assignments
FOR EACH ROW EXECUTE FUNCTION sync_bed_status();

-- ============================================================
-- TRIGGER: Update invoice balance when payment allocated
-- ============================================================

CREATE OR REPLACE FUNCTION update_invoice_on_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE invoices
    SET
      paid_paise    = paid_paise + NEW.allocated_paise,
      balance_paise = total_paise - (paid_paise + NEW.allocated_paise),
      status = CASE
        WHEN (paid_paise + NEW.allocated_paise) >= total_paise THEN 'paid'::invoice_status
        WHEN (paid_paise + NEW.allocated_paise) > 0 THEN 'partial'::invoice_status
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.invoice_id;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE invoices
    SET
      paid_paise    = paid_paise - OLD.allocated_paise,
      balance_paise = total_paise - (paid_paise - OLD.allocated_paise),
      status = CASE
        WHEN (paid_paise - OLD.allocated_paise) <= 0 THEN 'sent'::invoice_status
        WHEN (paid_paise - OLD.allocated_paise) > 0 THEN 'partial'::invoice_status
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = OLD.invoice_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_invoice_on_allocation
AFTER INSERT OR DELETE ON payment_allocations
FOR EACH ROW EXECUTE FUNCTION update_invoice_on_allocation();

-- ============================================================
-- TRIGGER: Maintain running balance in ledger
-- ============================================================

CREATE OR REPLACE FUNCTION update_ledger_running_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_prev_balance INTEGER;
BEGIN
  -- Get previous balance for this resident (latest entry before this one)
  SELECT COALESCE(running_balance_paise, 0)
  INTO v_prev_balance
  FROM ledger_entries
  WHERE resident_id = NEW.resident_id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF v_prev_balance IS NULL THEN
    v_prev_balance := 0;
  END IF;

  -- Balance increases with debits (charges), decreases with credits (payments)
  NEW.running_balance_paise := v_prev_balance + NEW.debit_paise - NEW.credit_paise;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ledger_running_balance
BEFORE INSERT ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION update_ledger_running_balance();

-- ============================================================
-- TRIGGER: Auto-set resident status on check-out
-- ============================================================

CREATE OR REPLACE FUNCTION sync_resident_status_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.check_out_date IS NOT NULL AND OLD.check_out_date IS NULL THEN
    -- Check if resident has any other active assignments
    IF NOT EXISTS (
      SELECT 1 FROM resident_assignments
      WHERE resident_id = NEW.resident_id
        AND id != NEW.id
        AND check_out_date IS NULL
    ) THEN
      UPDATE residents SET status = 'checked_out', updated_at = NOW()
      WHERE id = NEW.resident_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_resident_status
AFTER UPDATE ON resident_assignments
FOR EACH ROW EXECUTE FUNCTION sync_resident_status_on_assignment();

-- ============================================================
-- TRIGGER: Mark invoice overdue
-- (Run daily via cron or on read)
-- ============================================================

CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue', updated_at = NOW()
  WHERE status IN ('sent', 'partial')
    AND due_date < CURRENT_DATE
    AND balance_paise > 0;
END;
$$;

-- ============================================================
-- TRIGGER: Prevent duplicate active bed assignment
-- (Already handled by partial unique index, this is extra guard)
-- ============================================================

CREATE OR REPLACE FUNCTION check_bed_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.check_out_date IS NULL THEN
    -- Check no other active assignment for this bed
    IF EXISTS (
      SELECT 1 FROM resident_assignments
      WHERE bed_id = NEW.bed_id
        AND check_out_date IS NULL
        AND id != COALESCE(NEW.id, uuid_generate_v4())
    ) THEN
      RAISE EXCEPTION 'Bed % already has an active resident assigned.', NEW.bed_id;
    END IF;

    -- Check no other active assignment for this resident
    IF EXISTS (
      SELECT 1 FROM resident_assignments
      WHERE resident_id = NEW.resident_id
        AND check_out_date IS NULL
        AND id != COALESCE(NEW.id, uuid_generate_v4())
    ) THEN
      RAISE EXCEPTION 'Resident % is already assigned to a bed.', NEW.resident_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_bed_availability
BEFORE INSERT ON resident_assignments
FOR EACH ROW EXECUTE FUNCTION check_bed_availability();

-- ============================================================
-- VIEW: Resident Current Status (with room/bed info)
-- ============================================================

CREATE OR REPLACE VIEW v_resident_current AS
SELECT
  r.id AS resident_id,
  r.organization_id,
  r.registration_number,
  r.full_name,
  r.phone,
  r.email,
  r.photo_url,
  r.status,
  -- Current assignment
  ra.id AS assignment_id,
  ra.check_in_date,
  ra.monthly_rent_paise,
  ra.billing_cycle_day,
  -- Bed info
  b.id AS bed_id,
  b.bed_label,
  b.status AS bed_status,
  -- Room info
  rm.id AS room_id,
  rm.room_number,
  rm.name AS room_name,
  -- Floor info
  fl.id AS floor_id,
  fl.name AS floor_name,
  fl.floor_number,
  -- Building info
  bg.id AS building_id,
  bg.name AS building_name,
  -- Property
  p.id AS property_id,
  p.name AS property_name,
  -- Financial summary (computed)
  COALESCE(fin.total_outstanding_paise, 0) AS total_outstanding_paise,
  COALESCE(fin.total_paid_paise, 0) AS total_paid_paise,
  COALESCE(dep.deposit_paise, 0) AS deposit_held_paise
FROM residents r
LEFT JOIN resident_assignments ra ON ra.resident_id = r.id AND ra.check_out_date IS NULL
LEFT JOIN beds b ON b.id = ra.bed_id
LEFT JOIN rooms rm ON rm.id = b.room_id
LEFT JOIN floors fl ON fl.id = rm.floor_id
LEFT JOIN buildings bg ON bg.id = fl.building_id
LEFT JOIN properties p ON p.id = bg.property_id
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(balance_paise), 0) AS total_outstanding_paise,
    COALESCE(SUM(paid_paise), 0) AS total_paid_paise
  FROM invoices inv
  WHERE inv.resident_id = r.id
    AND inv.status NOT IN ('cancelled', 'draft')
) fin ON TRUE
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(d.amount_paise), 0) - COALESCE(SUM(da.amount_paise), 0) AS deposit_paise
  FROM deposits d
  LEFT JOIN deposit_adjustments da ON da.deposit_id = d.id
  WHERE d.resident_id = r.id AND d.is_refunded = FALSE
) dep ON TRUE;

-- ============================================================
-- VIEW: Dashboard KPIs
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  org.id AS organization_id,
  org.name AS organization_name,
  -- Beds
  COUNT(DISTINCT b.id) AS total_beds,
  COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END) AS occupied_beds,
  COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) AS available_beds,
  COUNT(DISTINCT CASE WHEN b.status = 'maintenance' THEN b.id END) AS maintenance_beds,
  -- Residents
  COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) AS active_residents,
  -- Financial (current month)
  COALESCE(SUM(CASE
    WHEN i.period_start >= DATE_TRUNC('month', CURRENT_DATE)::DATE
     AND i.status NOT IN ('cancelled', 'draft')
    THEN i.total_paise END), 0) AS current_month_expected_paise,
  COALESCE(SUM(CASE
    WHEN i.period_start >= DATE_TRUNC('month', CURRENT_DATE)::DATE
     AND i.status NOT IN ('cancelled', 'draft')
    THEN i.paid_paise END), 0) AS current_month_collected_paise,
  COALESCE(SUM(CASE
    WHEN i.status NOT IN ('cancelled', 'draft')
    THEN i.balance_paise END), 0) AS total_outstanding_paise,
  COALESCE(SUM(CASE
    WHEN i.status = 'overdue'
    THEN i.balance_paise END), 0) AS total_overdue_paise,
  -- Deposits
  COALESCE(SUM(DISTINCT d.deposit_held), 0) AS deposits_held_paise
FROM organizations org
LEFT JOIN properties p ON p.organization_id = org.id
LEFT JOIN buildings bg ON bg.property_id = p.id
LEFT JOIN floors fl ON fl.building_id = bg.id
LEFT JOIN rooms rm ON rm.floor_id = fl.id
LEFT JOIN beds b ON b.room_id = rm.id
LEFT JOIN residents r ON r.organization_id = org.id
LEFT JOIN invoices i ON i.organization_id = org.id
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(dep.amount_paise), 0) AS deposit_held
  FROM deposits dep
  JOIN residents res ON res.id = dep.resident_id
  WHERE res.organization_id = org.id AND dep.is_refunded = FALSE
) d ON TRUE
GROUP BY org.id, org.name;

-- ============================================================
-- FUNCTION: Get resident balance
-- ============================================================

CREATE OR REPLACE FUNCTION get_resident_balance(p_resident_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(SUM(balance_paise), 0)
  INTO v_balance
  FROM invoices
  WHERE resident_id = p_resident_id
    AND status NOT IN ('cancelled', 'draft');

  RETURN v_balance;
END;
$$;

-- ============================================================
-- FUNCTION: Calculate prorated rent
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_prorated_rent(
  p_monthly_rent_paise INTEGER,
  p_check_in_date DATE,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_days_in_month INTEGER;
  v_days_occupied INTEGER;
  v_prorated      INTEGER;
BEGIN
  v_days_in_month := EXTRACT(DAY FROM (p_period_start + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER;

  -- Days resident was in the property during this period
  v_days_occupied := (
    LEAST(p_period_end, p_check_in_date + INTERVAL '1 month' - INTERVAL '1 day') -
    GREATEST(p_period_start, p_check_in_date)
  )::INTEGER + 1;

  IF v_days_occupied <= 0 THEN
    RETURN 0;
  END IF;

  IF v_days_occupied >= v_days_in_month THEN
    RETURN p_monthly_rent_paise;
  END IF;

  -- Daily rate * days occupied
  v_prorated := ROUND((p_monthly_rent_paise::NUMERIC / v_days_in_month) * v_days_occupied)::INTEGER;
  RETURN v_prorated;
END;
$$;

-- ============================================================
-- DEFAULT SEED: Default message templates
-- (Called after first org is created)
-- ============================================================

CREATE OR REPLACE FUNCTION seed_default_templates(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Payment due reminder
  INSERT INTO message_templates(organization_id, name, event_type, channel, body_template, is_default)
  VALUES
  (p_org_id, 'Payment Due Reminder (WhatsApp)', 'rent_due', 'whatsapp',
   'Hello {{resident_name}}, your PG rent of ₹{{amount_due}} is due on {{due_date}}. Room: {{room_no}}, Bed: {{bed_no}}. Reg No: {{registration_no}}. Please pay on time. - {{pg_name}}',
   TRUE),
  (p_org_id, 'Payment Due Reminder (SMS)', 'rent_due', 'sms',
   'Dear {{resident_name}}, PG rent ₹{{amount_due}} due {{due_date}}. Reg: {{registration_no}}. -{{pg_name}}',
   TRUE),
  (p_org_id, 'Payment Overdue Alert (WhatsApp)', 'rent_overdue', 'whatsapp',
   'Dear {{resident_name}}, your PG outstanding balance of ₹{{amount_due}} is overdue. Reg No: {{registration_no}}, Room: {{room_no}}. Please clear at the earliest. - {{pg_name}}',
   TRUE),
  (p_org_id, 'Payment Received Confirmation (WhatsApp)', 'payment_received', 'whatsapp',
   'Hello {{resident_name}}, we have received your payment of ₹{{amount_due}}. Thank you! Reg No: {{registration_no}}. - {{pg_name}}',
   TRUE),
  (p_org_id, 'Invoice Generated (WhatsApp)', 'invoice_created', 'whatsapp',
   'Dear {{resident_name}}, your invoice for {{due_date}} has been generated. Total: ₹{{amount_due}}. Reg No: {{registration_no}}. - {{pg_name}}',
   TRUE),
  (p_org_id, 'Document Expiry Alert (WhatsApp)', 'document_expiring', 'whatsapp',
   'Dear {{resident_name}}, one of your documents is expiring soon. Please update at the PG office. Reg No: {{registration_no}}. - {{pg_name}}',
   TRUE);
END;
$$;

-- ============================================================
-- UPDATED_AT Trigger (generic)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'organizations', 'users', 'properties', 'buildings',
    'rooms', 'beds', 'residents', 'resident_assignments',
    'charge_catalog', 'invoices', 'complaints',
    'resident_documents', 'message_templates', 'expenses', 'settings'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t
    );
  END LOOP;
END;
$$;


-- >>> START OF 003_rls_policies.sql <<<

-- ============================================================
-- PG-SETU: Row Level Security Policies
-- Multi-tenant isolation enforced at database level
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE charge_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================

-- Get current user's organization_id
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- Is current user owner or manager?
CREATE OR REPLACE FUNCTION is_owner_or_manager()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role IN ('owner', 'manager') FROM users WHERE id = auth.uid()
$$;

-- Is current user owner?
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role = 'owner' FROM users WHERE id = auth.uid()
$$;

-- Is current user a resident? And get their resident_id
CREATE OR REPLACE FUNCTION auth_resident_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT resident_id FROM users WHERE id = auth.uid() AND role = 'resident'
$$;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = auth_org_id());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = auth_org_id() AND is_owner());

-- ============================================================
-- USERS
-- ============================================================

CREATE POLICY "users_select_own_org" ON users
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "users_insert_owner" ON users
  FOR INSERT WITH CHECK (organization_id = auth_org_id() AND is_owner());

CREATE POLICY "users_update_owner" ON users
  FOR UPDATE USING (organization_id = auth_org_id() AND is_owner());

CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid()); -- anyone can update their own profile

-- ============================================================
-- PROPERTIES
-- ============================================================

CREATE POLICY "properties_select" ON properties
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "properties_write_owner" ON properties
  FOR ALL USING (organization_id = auth_org_id() AND is_owner());

-- ============================================================
-- BUILDINGS, FLOORS, ROOMS, BEDS (operational users can view)
-- ============================================================

CREATE POLICY "buildings_select" ON buildings
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "buildings_write" ON buildings
  FOR ALL USING (organization_id = auth_org_id() AND is_owner_or_manager());

CREATE POLICY "floors_select" ON floors
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "floors_write" ON floors
  FOR ALL USING (organization_id = auth_org_id() AND is_owner_or_manager());

CREATE POLICY "rooms_select" ON rooms
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "rooms_write" ON rooms
  FOR ALL USING (organization_id = auth_org_id() AND is_owner_or_manager());

CREATE POLICY "beds_select" ON beds
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "beds_write" ON beds
  FOR ALL USING (organization_id = auth_org_id() AND is_owner_or_manager());

-- ============================================================
-- RESIDENTS
-- ============================================================

-- Staff/manager/owner/accountant can see all residents in org
CREATE POLICY "residents_select_staff" ON residents
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
  );

-- Resident can only see their own record
CREATE POLICY "residents_select_self" ON residents
  FOR SELECT USING (id = auth_resident_id());

CREATE POLICY "residents_write_staff" ON residents
  FOR INSERT WITH CHECK (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

CREATE POLICY "residents_update_staff" ON residents
  FOR UPDATE USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

-- ============================================================
-- RESIDENT ASSIGNMENTS
-- ============================================================

CREATE POLICY "assignments_select" ON resident_assignments
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND (
      auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
      OR resident_id = auth_resident_id()
    )
  );

CREATE POLICY "assignments_write" ON resident_assignments
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

-- ============================================================
-- INVOICES (residents see only their own)
-- ============================================================

CREATE POLICY "invoices_select_staff" ON invoices
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
  );

CREATE POLICY "invoices_select_resident" ON invoices
  FOR SELECT USING (resident_id = auth_resident_id());

CREATE POLICY "invoices_write" ON invoices
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- ============================================================
-- INVOICE ITEMS
-- ============================================================

CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND (
      auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
      OR EXISTS (
        SELECT 1 FROM invoices i
        WHERE i.id = invoice_id AND i.resident_id = auth_resident_id()
      )
    )
  );

CREATE POLICY "invoice_items_write" ON invoice_items
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- ============================================================
-- LEDGER ENTRIES (residents see only their own)
-- ============================================================

CREATE POLICY "ledger_select_staff" ON ledger_entries
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
  );

CREATE POLICY "ledger_select_resident" ON ledger_entries
  FOR SELECT USING (resident_id = auth_resident_id());

-- Only staff can insert (append-only, never delete)
CREATE POLICY "ledger_insert" ON ledger_entries
  FOR INSERT WITH CHECK (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- No update/delete policy for ledger (append-only)

-- ============================================================
-- PAYMENTS (residents see only their own)
-- ============================================================

CREATE POLICY "payments_select_staff" ON payments
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
  );

CREATE POLICY "payments_select_resident" ON payments
  FOR SELECT USING (resident_id = auth_resident_id());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- Only owner can reverse a payment (update status to 'reversed')
CREATE POLICY "payments_update_owner" ON payments
  FOR UPDATE USING (
    organization_id = auth_org_id()
    AND is_owner()
  );

-- ============================================================
-- PAYMENT ALLOCATIONS
-- ============================================================

CREATE POLICY "payment_alloc_select" ON payment_allocations
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "payment_alloc_write" ON payment_allocations
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- ============================================================
-- DEPOSITS (residents see own)
-- ============================================================

CREATE POLICY "deposits_select_staff" ON deposits
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
  );

CREATE POLICY "deposits_select_resident" ON deposits
  FOR SELECT USING (resident_id = auth_resident_id());

CREATE POLICY "deposits_write" ON deposits
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- ============================================================
-- DOCUMENTS (residents see only their own)
-- ============================================================

CREATE POLICY "docs_select_staff" ON resident_documents
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

CREATE POLICY "docs_select_resident" ON resident_documents
  FOR SELECT USING (resident_id = auth_resident_id());

CREATE POLICY "docs_write_staff" ON resident_documents
  FOR INSERT WITH CHECK (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

CREATE POLICY "docs_verify_owner_manager" ON resident_documents
  FOR UPDATE USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

-- ============================================================
-- ELECTRICITY
-- ============================================================

CREATE POLICY "elec_meters_select" ON electricity_meters
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "elec_meters_write" ON electricity_meters
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

CREATE POLICY "elec_readings_select" ON electricity_readings
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "elec_readings_write" ON electricity_readings
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

CREATE POLICY "elec_alloc_select" ON electricity_allocations
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND (
      auth_user_role() IN ('owner', 'manager', 'accountant', 'staff')
      OR resident_id = auth_resident_id()
    )
  );

CREATE POLICY "elec_alloc_write" ON electricity_allocations
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- ============================================================
-- EXPENSES (owner/accountant only)
-- ============================================================

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'accountant', 'manager')
  );

CREATE POLICY "expenses_write" ON expenses
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );

-- ============================================================
-- AUDIT LOGS (owner only can see full audit)
-- ============================================================

CREATE POLICY "audit_select_owner" ON audit_logs
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'accountant')
  );

CREATE POLICY "audit_insert" ON audit_logs
  FOR INSERT WITH CHECK (organization_id = auth_org_id());

-- ============================================================
-- SETTINGS
-- ============================================================

CREATE POLICY "settings_select" ON settings
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "settings_write_owner" ON settings
  FOR ALL USING (
    organization_id = auth_org_id()
    AND is_owner()
  );

-- ============================================================
-- MESSAGE TEMPLATES & LOGS
-- ============================================================

CREATE POLICY "templates_select" ON message_templates
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "templates_write" ON message_templates
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "msg_logs_select" ON message_logs
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

CREATE POLICY "msg_logs_write" ON message_logs
  FOR INSERT WITH CHECK (organization_id = auth_org_id());

-- ============================================================
-- COMPLAINTS
-- ============================================================

CREATE POLICY "complaints_select_staff" ON complaints
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

CREATE POLICY "complaints_select_resident" ON complaints
  FOR SELECT USING (resident_id = auth_resident_id());

CREATE POLICY "complaints_insert_resident" ON complaints
  FOR INSERT WITH CHECK (
    organization_id = auth_org_id()
    AND (
      auth_user_role() IN ('owner', 'manager', 'staff')
      OR resident_id = auth_resident_id()
    )
  );

CREATE POLICY "complaints_update_staff" ON complaints
  FOR UPDATE USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'staff')
  );

-- ============================================================
-- CHARGE CATALOG
-- ============================================================

CREATE POLICY "catalog_select" ON charge_catalog
  FOR SELECT USING (organization_id = auth_org_id());

CREATE POLICY "catalog_write" ON charge_catalog
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

-- ============================================================
-- DAILY CLOSINGS
-- ============================================================

CREATE POLICY "closings_select" ON daily_closings
  FOR SELECT USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'accountant', 'manager')
  );

CREATE POLICY "closings_write" ON daily_closings
  FOR ALL USING (
    organization_id = auth_org_id()
    AND auth_user_role() IN ('owner', 'manager', 'accountant')
  );


-- >>> START OF 20260902_tenant_aadhaar_kyc.sql <<<

-- ==============================================================================
-- PG-SETU: TENANT AADHAAR VERIFICATION & KYC SCHEMA
-- Compliant, zero unmasked Aadhaar storage, tamper-evident audit logs
-- ==============================================================================

-- 1. Tenant KYC Records Table
CREATE TABLE IF NOT EXISTS tenant_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL,
    verification_id TEXT UNIQUE NOT NULL, -- e.g. PG-AAD-829173
    verification_status TEXT NOT NULL DEFAULT 'pending', -- verified, not_verified, unable_to_verify, pending
    verification_method TEXT NOT NULL DEFAULT 'authorized_otp', -- authorized_otp, secure_qr, offline_xml
    masked_identifier TEXT NOT NULL, -- e.g. XXXX XXXX 4821 (NEVER raw 12 digits)
    provider TEXT NOT NULL, -- e.g. Setu GSP Authorized, Sandbox Simulator
    name_match_status TEXT DEFAULT 'not_checked', -- match, partial, mismatch, not_checked
    dob_match_status TEXT DEFAULT 'not_checked',
    gender_match_status TEXT DEFAULT 'not_checked',
    verified_at TIMESTAMPTZ,
    risk_level TEXT DEFAULT 'low', -- low, medium, high
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tenant and org lookups
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_tenant ON tenant_kyc(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_org ON tenant_kyc(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_status ON tenant_kyc(verification_status);

-- 2. Itemized KYC Checks Table
CREATE TABLE IF NOT EXISTS kyc_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_id TEXT NOT NULL,
    check_type TEXT NOT NULL, -- authentication, document, secure_qr, digital_signature, data_match, tampering_check
    status TEXT NOT NULL, -- passed, failed, unable_to_verify, skipped
    title TEXT NOT NULL,
    reason TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    engine_version TEXT NOT NULL DEFAULT 'PG-KYC-Engine-v1.0'
);

CREATE INDEX IF NOT EXISTS idx_kyc_checks_kyc_id ON kyc_checks(kyc_id);

-- 3. KYC Sessions Table (Transient Auth Session Tracking)
CREATE TABLE IF NOT EXISTS kyc_sessions (
    id TEXT PRIMARY KEY,
    tenant_id UUID,
    organization_id UUID NOT NULL,
    verification_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'initiated',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. KYC Immutable Audit Logs Table
CREATE TABLE IF NOT EXISTS kyc_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    tenant_id UUID,
    kyc_id TEXT,
    event TEXT NOT NULL,
    actor TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_audit_logs_kyc_id ON kyc_audit_logs(kyc_id);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_logs_org ON kyc_audit_logs(organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE tenant_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access and authenticated users within their organization
CREATE POLICY "Tenant KYC Access Policy" ON tenant_kyc
    FOR ALL USING (auth.role() = 'service_role' OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "KYC Audit Logs Policy" ON kyc_audit_logs
    FOR ALL USING (auth.role() = 'service_role' OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));


-- >>> START OF schema_repair_and_sync.sql <<<

-- ============================================================
-- PG-SETU: Supabase Schema Repair & Schema Cache Sync Script
-- Run this in the Supabase SQL Editor to resolve:
-- "Database error querying schema"
-- ============================================================

-- 1. Ensure Extensions are Enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Sequence Tables Exist
CREATE TABLE IF NOT EXISTS organization_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_seq        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS invoice_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_seq        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payment_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_seq        INTEGER NOT NULL DEFAULT 0
);

-- 3. Ensure Complaints Table Exists
CREATE TABLE IF NOT EXISTS complaints (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resident_id     UUID NOT NULL REFERENCES residents(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  status          TEXT NOT NULL DEFAULT 'open',
  priority        TEXT NOT NULL DEFAULT 'normal',
  assigned_to     UUID REFERENCES users(id),
  resolution_notes TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Number Generation Functions
CREATE OR REPLACE FUNCTION generate_registration_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_seq  INTEGER;
  v_reg  TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');

  INSERT INTO organization_sequences(organization_id, last_seq)
  VALUES (p_org_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET last_seq = organization_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  v_reg := 'PG-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
  RETURN v_reg;
END;
$$;

CREATE OR REPLACE FUNCTION generate_invoice_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_period TEXT;
  v_seq    INTEGER;
BEGIN
  v_period := TO_CHAR(NOW(), 'YYYY-MM');

  INSERT INTO invoice_sequences(organization_id, last_seq)
  VALUES (p_org_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET last_seq = invoice_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN 'INV-' || v_period || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION generate_payment_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq INTEGER;
BEGIN
  INSERT INTO payment_sequences(organization_id, last_seq)
  VALUES (p_org_id, 1)
  ON CONFLICT (organization_id) DO UPDATE
    SET last_seq = payment_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

-- 5. Fix and Recreate Views Cleanly
CREATE OR REPLACE VIEW v_resident_current AS
SELECT
  r.id AS resident_id,
  r.organization_id,
  r.registration_number,
  r.full_name,
  r.phone,
  r.email,
  r.photo_url,
  r.status,
  ra.id AS assignment_id,
  ra.check_in_date,
  ra.monthly_rent_paise,
  ra.billing_cycle_day,
  b.id AS bed_id,
  b.bed_label,
  b.status AS bed_status,
  rm.id AS room_id,
  rm.room_number,
  rm.name AS room_name,
  fl.id AS floor_id,
  fl.name AS floor_name,
  fl.floor_number,
  bg.id AS building_id,
  bg.name AS building_name,
  p.id AS property_id,
  p.name AS property_name,
  COALESCE(fin.total_outstanding_paise, 0) AS total_outstanding_paise,
  COALESCE(fin.total_paid_paise, 0) AS total_paid_paise,
  COALESCE(dep.deposit_paise, 0) AS deposit_held_paise
FROM residents r
LEFT JOIN resident_assignments ra ON ra.resident_id = r.id AND ra.check_out_date IS NULL
LEFT JOIN beds b ON b.id = ra.bed_id
LEFT JOIN rooms rm ON rm.id = b.room_id
LEFT JOIN floors fl ON fl.id = rm.floor_id
LEFT JOIN buildings bg ON bg.id = fl.building_id
LEFT JOIN properties p ON p.id = bg.property_id
LEFT JOIN LATERAL (
  SELECT
    COALESCE(SUM(balance_paise), 0) AS total_outstanding_paise,
    COALESCE(SUM(paid_paise), 0) AS total_paid_paise
  FROM invoices inv
  WHERE inv.resident_id = r.id
    AND inv.status NOT IN ('cancelled', 'draft')
) fin ON TRUE
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(d.amount_paise), 0) - COALESCE(SUM(da.amount_paise), 0) AS deposit_paise
  FROM deposits d
  LEFT JOIN deposit_adjustments da ON da.deposit_id = d.id
  WHERE d.resident_id = r.id AND d.is_refunded = FALSE
) dep ON TRUE;

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  org.id AS organization_id,
  org.name AS organization_name,
  COUNT(DISTINCT b.id) AS total_beds,
  COUNT(DISTINCT CASE WHEN b.status = 'occupied' THEN b.id END) AS occupied_beds,
  COUNT(DISTINCT CASE WHEN b.status = 'available' THEN b.id END) AS available_beds,
  COUNT(DISTINCT CASE WHEN b.status = 'maintenance' THEN b.id END) AS maintenance_beds,
  COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) AS active_residents,
  COALESCE(SUM(CASE
    WHEN i.period_start >= DATE_TRUNC('month', CURRENT_DATE)::DATE
     AND i.status NOT IN ('cancelled', 'draft')
    THEN i.total_paise END), 0) AS current_month_expected_paise,
  COALESCE(SUM(CASE
    WHEN i.period_start >= DATE_TRUNC('month', CURRENT_DATE)::DATE
     AND i.status NOT IN ('cancelled', 'draft')
    THEN i.paid_paise END), 0) AS current_month_collected_paise,
  COALESCE(SUM(CASE
    WHEN i.status NOT IN ('cancelled', 'draft')
    THEN i.balance_paise END), 0) AS total_outstanding_paise,
  COALESCE(SUM(CASE
    WHEN i.status = 'overdue'
    THEN i.balance_paise END), 0) AS total_overdue_paise,
  COALESCE(SUM(DISTINCT d.deposit_held), 0) AS deposits_held_paise
FROM organizations org
LEFT JOIN properties p ON p.organization_id = org.id
LEFT JOIN buildings bg ON bg.property_id = p.id
LEFT JOIN floors fl ON fl.building_id = bg.id
LEFT JOIN rooms rm ON rm.floor_id = fl.id
LEFT JOIN beds b ON b.room_id = rm.id
LEFT JOIN residents r ON r.organization_id = org.id
LEFT JOIN invoices i ON i.organization_id = org.id
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(dep.amount_paise), 0) AS deposit_held
  FROM deposits dep
  JOIN residents res ON res.id = dep.resident_id
  WHERE res.organization_id = org.id AND dep.is_refunded = FALSE
) d ON TRUE
GROUP BY org.id, org.name;

-- 6. Grant Necessary Permissions to Schema & Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

-- 7. Reload PostgREST Schema Cache Immediately
NOTIFY pgrst, 'reload schema';

