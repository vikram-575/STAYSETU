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
