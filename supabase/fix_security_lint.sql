-- ============================================================
-- PG-SETU: Fix Supabase Security Linter Warnings
-- Resolves: security_definer_view and rls_disabled_in_public
-- ============================================================

-- 1. Enable RLS on sequence and session tables
ALTER TABLE IF EXISTS public.organization_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kyc_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Add service_role bypass policies for internal tables
DROP POLICY IF EXISTS "allow_service_role_org_seq" ON public.organization_sequences;
CREATE POLICY "allow_service_role_org_seq" ON public.organization_sequences FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_service_role_inv_seq" ON public.invoice_sequences;
CREATE POLICY "allow_service_role_inv_seq" ON public.invoice_sequences FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_service_role_pay_seq" ON public.payment_sequences;
CREATE POLICY "allow_service_role_pay_seq" ON public.payment_sequences FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_service_role_kyc_sess" ON public.kyc_sessions;
CREATE POLICY "allow_service_role_kyc_sess" ON public.kyc_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Set security_invoker on views to enforce querying user permissions
ALTER VIEW IF EXISTS public.v_resident_current SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_dashboard_kpis SET (security_invoker = on);
