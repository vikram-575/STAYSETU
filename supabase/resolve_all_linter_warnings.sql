-- ============================================================
-- PG-SETU: Complete Resolution for All Database Linter Warnings
-- Resolves:
--  1. function_search_path_mutable (sets explicit search_path = public, pg_temp)
--  2. anon_security_definer_function_executable (revokes anon RPC access)
-- ============================================================

-- 1. Explicitly set search_path on ALL functions in public schema
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure AS func_sig
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
  ) LOOP
    EXECUTE 'ALTER FUNCTION ' || r.func_sig || ' SET search_path = public, pg_temp;';
  END LOOP;
END $$;

-- 2. Revoke anonymous / public execution on internal auth helper functions
REVOKE EXECUTE ON FUNCTION public.auth_org_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_resident_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auth_user_role() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_owner_or_manager() FROM anon, PUBLIC;

-- 3. Ensure postgres, service_role, and authenticated have appropriate access
GRANT EXECUTE ON FUNCTION public.auth_org_id() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_resident_id() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_role() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner() TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner_or_manager() TO postgres, service_role, authenticated;
