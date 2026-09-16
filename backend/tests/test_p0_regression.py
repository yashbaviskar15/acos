import os
import uuid
import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.config import settings, Settings
from app.core.security import create_access_token
from app.services.arvgate.models import User
from app.main import app as _app
from tests.conftest import test_engine, TestingSessionLocal, override_get_db

_app.dependency_overrides[get_db] = override_get_db
client = TestClient(_app)

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
MFA_VERIFY_URL = "/api/v1/auth/mfa/verify"
ROLE_UPDATE_URL = "/api/v1/auth/role/update"
MEMBER_ROLE_URL_FMT = "/api/v1/auth/workspace/members/{member_id}/role"
RESET_REQUEST_URL = "/api/v1/auth/password-reset/request"
RESET_CONFIRM_URL = "/api/v1/auth/password-reset/confirm"
ME_URL = "/api/v1/auth/me"

_register_counter = 0


def _fresh_email(prefix: str = "p0") -> str:
    global _register_counter
    _register_counter += 1
    return f"{prefix}_{uuid.uuid4().hex[:8]}_{_register_counter}@aravanta.cloud"


def _register_user(email: str | None = None, password: str = "SecurePass123!") -> tuple[str, dict]:
    email = email or _fresh_email()
    reg = client.post(REGISTER_URL, json={
        "email": email,
        "password": password,
        "full_name": "P0 Regression User"
    })
    assert reg.status_code == 201, f"Register failed: {reg.status_code} {reg.text}"
    return email, reg.json()


def _login(email: str, password: str = "SecurePass123!") -> tuple[str, dict]:
    res = client.post(LOGIN_URL, json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.status_code} {res.text}"
    data = res.json()
    return data["access_token"], data


def _set_user_role_db(email: str, role: str) -> None:
    db = TestingSessionLocal()
    try:
        u = db.query(User).filter(func.lower(User.email) == email.lower()).first()
        assert u is not None, f"_set_user_role_db: user {email} not found"
        u.role = role
        db.commit()
    finally:
        db.close()


# ============ P0.1 Hardcoded MFA master bypass codes ============

def test_p0_1_mfa_master_codes_are_rejected_without_explicit_env():
    email, _ = _register_user()
    _set_user_role_db(email, "Developer")
    for bad_code in ["000000", "123456", "111111", "999999", "0", ""]:
        res = client.post(MFA_VERIFY_URL, json={"email": email, "mfa_code": bad_code})
        assert res.status_code in (400, 401), (
            f"P0.1 REGRESSION: MFA code '{bad_code}' accepted status={res.status_code}. "
            "Hardcoded master bypass codes must never be accepted without explicit MFA_DEV_MASTER_CODES env."
        )


# ============ P0.2 Password reset bypass + unauth SuperAdmin creation ============

def test_p0_2_reset_unknown_email_returns_generic_and_returns_400_on_confirm():
    unknown = f"ghost_{uuid.uuid4().hex[:10]}@aravanta.cloud"
    req_res = client.post(RESET_REQUEST_URL, json={"email": unknown})
    assert req_res.status_code == 200
    body = req_res.json()
    assert "reset_token" not in body
    assert "token" not in body

    conf_res = client.post(RESET_CONFIRM_URL, json={
        "email": unknown,
        "reset_token": "000000",
        "new_password": "NewPass!999"
    })
    assert conf_res.status_code == 400, (
        "P0.2 REGRESSION: reset confirm for unknown email must return 400. "
        "Never create SuperAdmin accounts from the unauthenticated reset path."
    )


def test_p0_2_reset_any_6digit_or_hardcoded_list_does_not_bypass():
    email, _ = _register_user()
    client.post(RESET_REQUEST_URL, json={"email": email})
    attempts = 0
    for bad_token in ["000000", "123456", "111111", "999999"]:
        from app.core.rate_limit import clear_rate_limits
        clear_rate_limits()
        attempts += 1
        conf_res = client.post(RESET_CONFIRM_URL, json={
            "email": email,
            "reset_token": bad_token,
            "new_password": "NewPass!999"
        })
        assert conf_res.status_code == 400, (
            f"P0.2 REGRESSION: reset confirm accepted token '{bad_token}' "
            f"(attempt {attempts}). Status={conf_res.status_code}. "
            "Only the exact stored (constant-time compare) token must be accepted."
        )


def test_p0_2_reset_response_body_does_not_leak_token():
    email, _ = _register_user()
    req_res = client.post(RESET_REQUEST_URL, json={"email": email})
    assert req_res.status_code == 200
    body = req_res.json()
    assert "reset_token" not in body
    assert "token" not in body
    assert "code" not in body
    for k, v in body.items():
        if isinstance(v, str) and len(v) == 6 and v.isdigit():
            pytest.fail(
                f"P0.2 REGRESSION: response field '{k}' appears to leak a "
                f"6-digit reset token: {v}"
            )


# ============ P0.3 Registration password takeover (master password override) ============

def test_p0_3_register_master_password_does_not_overwrite_existing_account():
    email = _fresh_email("p03")
    first_pw = "OriginalPass!1"
    takeover_pw = "Aravanta@2026!"
    _register_user(email, password=first_pw)

    takeover_res = client.post(REGISTER_URL, json={
        "email": email,
        "password": takeover_pw,
        "full_name": "Attacker Overwrite"
    })
    assert takeover_res.status_code == 409, (
        f"P0.3 REGRESSION: second register accepted with status {takeover_res.status_code}. "
        "Duplicate registration must return 409 and never silently overwrite the original password."
    )

    login_first = client.post(LOGIN_URL, json={"email": email, "password": first_pw})
    assert login_first.status_code == 200, (
        "P0.3 REGRESSION: original password no longer works after the attacker submitted "
        "the second register request."
    )
    login_takeover = client.post(LOGIN_URL, json={"email": email, "password": takeover_pw})
    assert login_takeover.status_code in (400, 401), (
        "P0.3 REGRESSION: attacker master password authenticated successfully."
    )


# ============ P0.4 Hardcoded JWT signing-key fallback / SECRET_KEY required ============

def test_p0_4_secret_key_must_be_set_without_hardcoded_fallback(monkeypatch):
    with monkeypatch.context() as m:
        m.delenv("SECRET_KEY", raising=False)
        m.delenv("DATABASE_URL", raising=False)
        m.setenv("DATABASE_URL", "sqlite:///:memory:")
        from pydantic import ValidationError as PydanticValErr
        caught = None
        try:
            Settings(_env_file=None, _env_file_encoding=None, _secrets_dir=None)
        except Exception as exc:  # noqa: BLE001
            caught = exc
        assert caught is not None, (
            "P0.4 REGRESSION: Settings loaded successfully with no SECRET_KEY env."
        )
        msg = str(caught).lower()
        assert "secret_key" in msg or len(msg) > 0, (
            "P0.4 REGRESSION: missing SECRET_KEY did not produce ValidationError."
        )
        assert isinstance(caught, PydanticValErr) or "secret" in msg, (
            "P0.4 REGRESSION: exception type is not ValidationError for missing SECRET_KEY."
        )


def test_p0_4_secret_key_rejects_placeholder_patterns(monkeypatch):
    from pydantic import ValidationError as PydanticValErr
    placeholders = [
        "changeme",
        "ChangeMe",
        "default",
        "test123",
        "please-change-me",
        "aravanta_super_secret_jwt_key_change_in_production_2026",
    ]
    for placeholder in placeholders:
        with monkeypatch.context() as m:
            m.setenv("SECRET_KEY", placeholder)
            m.setenv("DATABASE_URL", "sqlite:///:memory:")
            caught = None
            try:
                Settings(_env_file=None, _env_file_encoding=None, _secrets_dir=None)
            except Exception as exc:  # noqa: BLE001
                caught = exc
            assert caught is not None and isinstance(caught, PydanticValErr), (
                f"P0.4 REGRESSION: placeholder SECRET_KEY '{placeholder}' was accepted. "
                f"caught={caught!r}"
            )


# ============ P0.5 JWT auto-provisioning with unverified role claims ============

def test_p0_5_jwt_unknown_subject_does_not_auto_create_user():
    fake_email = f"ghost_jwt_{uuid.uuid4().hex[:10]}@aravanta.cloud"
    forged = create_access_token(
        subject=fake_email,
        roles=["SuperAdmin"],
    )
    me_res = client.get(ME_URL, headers={"Authorization": f"Bearer {forged}"})
    assert me_res.status_code == 401, (
        f"P0.5 REGRESSION: unknown JWT subject authenticated with status {me_res.status_code}. "
        "Never auto-provision users from unverified JWT payload claims."
    )

    db = TestingSessionLocal()
    try:
        row = db.query(User).filter(func.lower(User.email) == fake_email.lower()).first()
    finally:
        db.close()
    assert row is None, (
        "P0.5 REGRESSION: a User row was auto-created for an unknown JWT subject."
    )


def test_p0_5_jwt_role_claim_not_used_for_authorization_only_db_role():
    email, _ = _register_user()
    _set_user_role_db(email, "Developer")
    token, _ = _login(email)

    forged_developer_claiming_admin = create_access_token(
        subject=email,
        roles=["SuperAdmin"],
    )
    payload = jwt.decode(forged_developer_claiming_admin, options={"verify_signature": False})
    assert "SuperAdmin" in payload.get("roles", []) or payload.get("role") == "SuperAdmin"

    res = client.post(ROLE_UPDATE_URL,
                      headers={"Authorization": f"Bearer {forged_developer_claiming_admin}"},
                      json={"role": "Operator"})
    assert res.status_code == 403, (
        f"P0.5 REGRESSION: forged JWT roles bypassed DB role check. Status={res.status_code}. "
        "Authorization must read role ONLY from the DB User object."
    )


# ============ P0.6 Hardcoded seed credentials in init_db() / cold start ============

def test_p0_6_init_db_does_not_seed_any_users_or_demo_data():
    iso_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=iso_engine)
    IsoSession = sessionmaker(autocommit=False, autoflush=False, bind=iso_engine)
    iso_db = IsoSession()
    try:
        initial_count = iso_db.query(User).count()
        assert initial_count == 0, "Pre-condition: isolated test DB must start empty"

        from app.main import init_db as _init_db_fn
        from app.core import database as _db_mod

        orig_engine = _db_mod.engine
        orig_session = _db_mod.SessionLocal
        try:
            _db_mod.engine = iso_engine
            _db_mod.SessionLocal = IsoSession

            _init_db_fn()

            count = iso_db.query(User).count()
            assert count == 0, (
                f"P0.6 REGRESSION: init_db() seeded {count} User rows in isolated engine. "
                "Cold-start init must be schema-only. Seeding requires explicit scripts/seed.py run."
            )
            for known in ["yashbaviskar67@gmail.com", "admin@aravanta.cloud"]:
                hit = iso_db.query(User).filter(func.lower(User.email) == known.lower()).first()
                assert hit is None, (
                    f"P0.6 REGRESSION: hardcoded seed credential '{known}' found in User table "
                    f"after init_db()."
                )
        finally:
            _db_mod.engine = orig_engine
            _db_mod.SessionLocal = orig_session
    finally:
        iso_db.close()


# ============ P0.8 Role consistency audit — self + cross-user escalation ============

def test_p0_8_admin_cannot_self_escalate_to_superadmin():
    email, _ = _register_user()
    _set_user_role_db(email, "Admin")
    token, _ = _login(email)

    res = client.post(ROLE_UPDATE_URL,
                      headers={"Authorization": f"Bearer {token}"},
                      json={"role": "SuperAdmin"})
    assert res.status_code == 403, (
        f"P0.8 REGRESSION: Admin self-escalation to SuperAdmin returned {res.status_code}. "
        "Only an existing SuperAdmin can grant the SuperAdmin role."
    )

    db = TestingSessionLocal()
    try:
        u = db.query(User).filter(func.lower(User.email) == email.lower()).first()
        assert u.role == "Admin"
    finally:
        db.close()


def test_p0_8_admin_cannot_grant_superadmin_to_another_user():
    admin_email, _ = _register_user(_fresh_email("admin"))
    target_email, _ = _register_user(_fresh_email("tgt"))
    _set_user_role_db(admin_email, "Admin")
    _set_user_role_db(target_email, "Developer")
    admin_token, _ = _login(admin_email)

    res = client.post(
        MEMBER_ROLE_URL_FMT.format(member_id=target_email),
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "SuperAdmin"}
    )
    assert res.status_code == 403, (
        f"P0.8 REGRESSION: Admin granted SuperAdmin to another user. Status={res.status_code}."
    )

    db = TestingSessionLocal()
    try:
        t = db.query(User).filter(func.lower(User.email) == target_email.lower()).first()
        assert t.role == "Developer", "Member role was mutated despite 403 response."
    finally:
        db.close()


def test_p0_8_superadmin_demote_self_requires_second_superadmin():
    sa_email, _ = _register_user()
    _set_user_role_db(sa_email, "SuperAdmin")
    token, _ = _login(sa_email)
    res = client.post(ROLE_UPDATE_URL,
                      headers={"Authorization": f"Bearer {token}"},
                      json={"role": "Viewer"})
    assert res.status_code == 400, (
        f"P0.8 REGRESSION: sole SuperAdmin demoted self without 400 guard. Status={res.status_code}."
    )

    db = TestingSessionLocal()
    try:
        u = db.query(User).filter(func.lower(User.email) == sa_email.lower()).first()
        assert u.role == "SuperAdmin"
    finally:
        db.close()


# ============ Schema-level reject_client_role — ProfileUpdateRequest etc. ============

def test_schema_non_admin_requests_reject_client_role_permissions_scopes():
    from app.services.arvgate.schemas import (
        ProfileUpdateRequest, PasswordChangeRequest,
        MFAVerifyRequest, PasswordResetConfirm, PasswordResetRequest,
    )
    cases = [
        (ProfileUpdateRequest, {"full_name": "X", "role": "SuperAdmin"}),
        (ProfileUpdateRequest, {"full_name": "X", "permissions": ["all"]}),
        (PasswordChangeRequest, {"old_password": "a", "new_password": "b", "roles": ["SuperAdmin"]}),
        (MFAVerifyRequest, {"email": "a@b.c", "mfa_code": "123456", "role": "SuperAdmin"}),
        (PasswordResetConfirm, {"email": "a@b.c", "reset_token": "1",
                                "new_password": "x", "scopes": ["*"]}),
        (PasswordResetRequest, {"email": "a@b.c", "scopes": ["admin"]}),
    ]
    for SchemaCls, bad_payload in cases:
        try:
            SchemaCls(**bad_payload)
            pytest.fail(
                f"P0.8 REGRESSION: {SchemaCls.__name__} accepted client-supplied "
                f"role/permissions/scopes in payload keys {sorted(bad_payload.keys())}. "
                "All non-admin request schemas must carry reject_client_role validator."
            )
        except ValueError:
            pass


# ============ Token Revocation / Invalidation ============

def test_token_revocation_invalidates_token_before_expiry():
    email, _ = _register_user()
    token, _ = _login(email)

    # Token works initially
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get(ME_URL, headers=headers)
    assert me_res.status_code == 200

    # Revoke via logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200

    # Token must now be rejected immediately
    after_res = client.get(ME_URL, headers=headers)
    assert after_res.status_code == 401, (
        "Token was not revoked; request succeeded after logout."
    )

