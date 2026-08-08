from __future__ import annotations

import pyotp


def register_user(client, email: str, role: str = "SuperAdmin") -> dict:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "CloudOSPassword123!",
            "full_name": "Platform Operator",
            "role": role,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_register_login_verify_refresh_and_profile(client):
    registration = register_user(client, "admin@aravanta.cloud")

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@aravanta.cloud", "password": "CloudOSPassword123!"},
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["mfa_required"] is True
    assert login_payload["challenge_token"]

    code = pyotp.TOTP(registration["mfa_secret"]).now()
    verify_response = client.post(
        "/api/v1/auth/mfa/verify",
        json={
            "email": "admin@aravanta.cloud",
            "challenge_token": login_payload["challenge_token"],
            "mfa_code": code,
        },
    )
    assert verify_response.status_code == 200
    token_payload = verify_response.json()
    assert token_payload["access_token"]
    assert token_payload["refresh_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token_payload['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "admin@aravanta.cloud"

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": token_payload["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    assert refresh_response.json()["access_token"]


def test_audit_log_requires_privileged_role(client):
    registration = register_user(client, "auditor@aravanta.cloud", role="Auditor")
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "auditor@aravanta.cloud", "password": "CloudOSPassword123!"},
    )
    code = pyotp.TOTP(registration["mfa_secret"]).now()
    token_response = client.post(
        "/api/v1/auth/mfa/verify",
        json={
            "email": "auditor@aravanta.cloud",
            "challenge_token": login_response.json()["challenge_token"],
            "mfa_code": code,
        },
    )
    access_token = token_response.json()["access_token"]

    audit_response = client.get(
        "/api/v1/auth/audit-logs",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert audit_response.status_code == 200
    assert isinstance(audit_response.json(), list)


def test_audit_log_rejects_viewer_role(client):
    registration = register_user(client, "viewer@aravanta.cloud", role="Viewer")
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "viewer@aravanta.cloud", "password": "CloudOSPassword123!"},
    )
    code = pyotp.TOTP(registration["mfa_secret"]).now()
    token_response = client.post(
        "/api/v1/auth/mfa/verify",
        json={
            "email": "viewer@aravanta.cloud",
            "challenge_token": login_response.json()["challenge_token"],
            "mfa_code": code,
        },
    )
    access_token = token_response.json()["access_token"]

    audit_response = client.get(
        "/api/v1/auth/audit-logs",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert audit_response.status_code == 403
