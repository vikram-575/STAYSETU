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
  SELECT org2.id AS org_id, COALESCE(SUM(dep.amount_paise), 0) AS deposit_held
  FROM deposits dep
  JOIN residents res ON res.id = dep.resident_id AND res.organization_id = org.id
  WHERE dep.is_refunded = FALSE
  GROUP BY org2.id
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
