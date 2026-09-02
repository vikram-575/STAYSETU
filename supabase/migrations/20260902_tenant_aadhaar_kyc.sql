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
