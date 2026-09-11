-- ============================================================
-- PG-SETU: Revoke Authenticated Role RPC Access on Security Definer Functions
-- Resolves: authenticated_security_definer_function_executable (Lint 0029)
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.auth_org_id() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auth_resident_id() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auth_user_role() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_owner_or_manager() FROM authenticated;
