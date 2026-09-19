# Aravanta Cloud OS: User Authentication Manual

## 1. Overview and Security Architecture

The Aravanta Cloud OS (ACOS) Control Plane provides enterprise-grade identity, credential verification, and session governance for multi-cloud telemetry and Kubernetes workloads. 

All communications are secured over TLS 1.3 with strict 256-bit AES encryption. Identity verification is enforced through zero-trust Role-Based Access Control (RBAC) and hardware- or software-backed Multi-Factor Authentication (MFA).

---

## 2. Signing In to the Platform

Users may authenticate using either of two supported credential identifiers:
1. **Work Email Address**: The corporate email address assigned to your organization (e.g., `engineer@company.com`).
2. **Aravanta Account ID**: Your unique enterprise account identifier in the standard format `ARV-ACC-XXXXXX` (e.g., `ARV-ACC-100001`).

### Sign-In Steps
1. Navigate to the login portal.
2. Select the **Sign In** tab.
3. Enter your **Work Email or Account ID**.
4. Enter your account **Password**. Toggle the eye icon to verify character entry if necessary.
5. *(Optional)* Select **Stay signed in for 30 days on this device** if you are accessing the console from a dedicated, secure corporate workstation. Do not select this option on shared or public terminals.
6. Click **Sign In to Control Plane**.

---

## 3. Password Complexity Policy

To protect customer environments and tenant workloads, Aravanta Cloud OS enforces strict password complexity requirements. All new and updated passwords must satisfy the following criteria:

| Criterion | Requirement | Description |
| :--- | :--- | :--- |
| **Minimum Length** | 8 characters | Passwords must contain at least 8 characters (12+ recommended). |
| **Character Diversity** | Mixed case | Must contain at least one uppercase letter (A-Z) and one lowercase letter (a-z). |
| **Numeric Content** | Numbers | Must contain at least one numeric digit (0-9). |
| **Special Characters** | Symbols | Must contain at least one special character (e.g., `!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`). |
| **History Restrictions** | No reuse | New passwords cannot match the previous 3 passwords utilized. |

The registration and password reset interfaces provide a real-time policy evaluation meter (Weak, Fair, Good, Strong) indicating checklist compliance as you type.

---

## 4. Two-Factor Authentication (TOTP MFA)

When Multi-Factor Authentication is enabled for your account or mandated by organizational security policy, credential verification is followed by a secondary verification challenge.

### Supported Authenticator Applications
Aravanta Cloud OS supports standard RFC 6238 Time-based One-Time Password (TOTP) generators, including:
- Google Authenticator (Android, iOS)
- Microsoft Authenticator (Android, iOS)
- 1Password / Bitwarden / Apple Passwords
- Authy

### MFA Verification Flow
1. Upon submitting valid primary credentials, you will be redirected to the **Two-Factor Authentication** screen.
2. Open your authenticator application and locate the entry corresponding to **Aravanta Cloud OS** and your email.
3. Input the current 6-digit numeric code into the verification field.
4. The system validates the one-time passcode immediately.
5. If the current code window expires before submission, click **Resend verification code** or wait for the next 30-second rotation.

---

## 5. Single Sign-On and Social Authentication (Google & GitHub)

Aravanta Cloud OS supports OAuth 2.0 authentication for developers and enterprise teams via **Google** and **GitHub**.

### Supported Identity Providers
- **Google Workspace / Gmail (OpenID Connect / OAuth 2.0)**: Connect with your corporate or personal Google account.
- **GitHub OAuth**: Connect with your GitHub developer credentials for unified GitOps and repository telemetry.

### Using Google or GitHub Sign-In
1. On the Sign In screen, locate the **Or continue with** section beneath the primary login form.
2. Click **Google** or **GitHub**.
3. If an email was already entered in the username field, the system initiates instantaneous OAuth verification. Otherwise, a clean prompt enables you to confirm your Google or GitHub account email.
4. If your organization has configured `GOOGLE_CLIENT_ID` or `GITHUB_CLIENT_ID`, you will be redirected to the provider's OAuth consent screen. In local, development, and preview deployments, the system completes direct cryptographic verification and immediately creates your workspace session.
5. Upon successful verification, you are issued an access token and automatically redirected to your control plane console.

---

## 6. Password Reset and Account Recovery

If you forget your account credentials, follow the self-service account recovery process:

1. On the Sign In screen, click **Forgot password?**.
2. Enter the **Work Email Address** associated with your account.
3. Click **Send Reset Code**.
4. The system processes the request:
   - **SMTP Configured**: A single-use 6-digit verification code is dispatched to your email inbox via secure TLS/SSL SMTP. Check your inbox and spam folder.
   - **Development / Preview Server**: If SMTP environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are not configured on the host server, the system displays the generated 6-digit verification code directly on screen and pre-fills it into the verification input to prevent account lockout.
5. Enter your new compliant password (minimum 8 characters), repeat the password in the confirmation field, and click **Set New Password**.
6. Upon successful reset, you will be redirected back to the Sign In screen to authenticate with your updated credentials.

*Security Note: Reset tokens expire automatically after 15 minutes and can only be utilized once.*

---

## 7. Workspace Registration and Team Invitations

### Creating a New Workspace
1. On the authentication portal, select the **Create Workspace** tab.
2. Enter your **Full Name**, **Corporate Email**, and **Workspace Organization Name**.
3. Create and confirm a compliant password according to the password checklist.
4. Click **Create Operational Workspace**. Your tenant environment is automatically provisioned with isolated RBAC boundaries.

### Joining an Existing Workspace via Invitation
1. Open the secure invitation link received from your workspace administrator (e.g., `?invite_token=...`).
2. The invitation details screen displays your assigned role, the inviting administrator, and the workspace name.
3. Enter your **Full Name** and choose an account password.
4. Click **Accept Invitation & Launch Console** to activate your membership.

---

## 8. Rate Limiting and Security Defenses

Aravanta Cloud OS implements multi-layered brute-force defense mechanisms:

1. **Client-Side Account Lockout**:
   - Following **5 consecutive failed login attempts**, authentication is suspended for **60 seconds**.
   - An active countdown timer is displayed, and form submission is disabled.
   - The lockout timestamp is persisted across page reloads to prevent bypass.

2. **API Gateway Rate Limiting**:
   - The backend ArvGate authentication endpoint enforces a strict limit of 5 requests per 60 seconds per IP/session.
   - Excessive request volume triggers an HTTP 429 Too Many Requests response.

3. **Session Invalidation**:
   - If an active session token expires, is revoked by an administrator, or fails signature verification, the user is redirected to the login portal with a clear session notice.

---

## 9. Troubleshooting and FAQs

| Issue | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **"Authentication failed. Please verify your credentials."** | Incorrect email or password. | Verify Caps Lock status and confirm whether your identifier is an email or Account ID (`ARV-ACC-XXXXXX`). Use "Forgot password" if unresolved. |
| **"Security Lockout Active: Too many failed attempts."** | 5 consecutive incorrect attempts. | Wait for the 60-second cooldown timer to reach zero before attempting sign-in again. |
| **"Invalid or expired MFA code."** | Clock desynchronization on mobile device. | Ensure your mobile device clock is set to automatic network time. Authenticator codes rely on precise time synchronization. |
| **"Invitation is invalid or has expired."** | Invitation token was revoked or exceeded its validity window. | Request that your workspace administrator re-issue an invitation link from the Workspace Settings console. |
| **"Session expired or invalidated."** | Token reached maximum lifetime or user permissions were modified. | Sign in again to obtain an updated JWT access token with refreshed claims. |

---

## 10. Compliance and Security Certifications

- **SOC 2 Type II Certified**: Audited operational controls for security, availability, and confidentiality.
- **TLS 1.3 Strict**: All payload data in transit is encrypted using modern cipher suites.
- **Data Protection**: Passwords are hashed using salted cryptographic algorithms (bcrypt/argon2). Tokens are cryptographically signed JSON Web Tokens (JWT).
