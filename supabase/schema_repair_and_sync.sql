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
