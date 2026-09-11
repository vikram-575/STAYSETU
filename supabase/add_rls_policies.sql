-- ============================================================
-- PG-SETU: Add Explicit RLS Policies for 7 Remaining Tables
-- Resolves: rls_enabled_no_policy (Lint 0008)
-- ============================================================

-- 1. deposit_adjustments
DROP POLICY IF EXISTS "deposit_adjustments_service_role" ON public.deposit_adjustments;
DROP POLICY IF EXISTS "deposit_adjustments_org_isolation" ON public.deposit_adjustments;
CREATE POLICY "deposit_adjustments_service_role" ON public.deposit_adjustments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "deposit_adjustments_org_isolation" ON public.deposit_adjustments FOR ALL TO authenticated USING (organization_id = auth_org_id()) WITH CHECK (organization_id = auth_org_id());

-- 2. invoice_sequences
DROP POLICY IF EXISTS "invoice_sequences_service_role" ON public.invoice_sequences;
DROP POLICY IF EXISTS "invoice_sequences_org_isolation" ON public.invoice_sequences;
CREATE POLICY "invoice_sequences_service_role" ON public.invoice_sequences FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "invoice_sequences_org_isolation" ON public.invoice_sequences FOR ALL TO authenticated USING (organization_id = auth_org_id()) WITH CHECK (organization_id = auth_org_id());

-- 3. kyc_checks
DROP POLICY IF EXISTS "kyc_checks_service_role" ON public.kyc_checks;
DROP POLICY IF EXISTS "kyc_checks_authenticated" ON public.kyc_checks;
CREATE POLICY "kyc_checks_service_role" ON public.kyc_checks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "kyc_checks_authenticated" ON public.kyc_checks FOR SELECT TO authenticated USING (true);

-- 4. kyc_sessions
DROP POLICY IF EXISTS "kyc_sessions_service_role" ON public.kyc_sessions;
DROP POLICY IF EXISTS "kyc_sessions_org_isolation" ON public.kyc_sessions;
CREATE POLICY "kyc_sessions_service_role" ON public.kyc_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "kyc_sessions_org_isolation" ON public.kyc_sessions FOR ALL TO authenticated USING (organization_id = auth_org_id()) WITH CHECK (organization_id = auth_org_id());

-- 5. notification_rules
DROP POLICY IF EXISTS "notification_rules_service_role" ON public.notification_rules;
DROP POLICY IF EXISTS "notification_rules_org_isolation" ON public.notification_rules;
CREATE POLICY "notification_rules_service_role" ON public.notification_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "notification_rules_org_isolation" ON public.notification_rules FOR ALL TO authenticated USING (organization_id = auth_org_id()) WITH CHECK (organization_id = auth_org_id());

-- 6. organization_sequences
DROP POLICY IF EXISTS "organization_sequences_service_role" ON public.organization_sequences;
DROP POLICY IF EXISTS "organization_sequences_org_isolation" ON public.organization_sequences;
CREATE POLICY "organization_sequences_service_role" ON public.organization_sequences FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "organization_sequences_org_isolation" ON public.organization_sequences FOR ALL TO authenticated USING (organization_id = auth_org_id()) WITH CHECK (organization_id = auth_org_id());

-- 7. payment_sequences
DROP POLICY IF EXISTS "payment_sequences_service_role" ON public.payment_sequences;
DROP POLICY IF EXISTS "payment_sequences_org_isolation" ON public.payment_sequences;
CREATE POLICY "payment_sequences_service_role" ON public.payment_sequences FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "payment_sequences_org_isolation" ON public.payment_sequences FOR ALL TO authenticated USING (organization_id = auth_org_id()) WITH CHECK (organization_id = auth_org_id());
