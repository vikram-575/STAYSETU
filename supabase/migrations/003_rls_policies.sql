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
