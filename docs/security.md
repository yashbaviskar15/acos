# Security Architecture

## Authentication

### JWT Token Authentication
- Algorithm: HS256 (HMAC-SHA256)
- Token payload: user ID, email, roles, issued-at, expiry
- Token lifetime: 24 hours
- Storage: Browser localStorage
- Injection: `Authorization: Bearer <token>` header on all API requests

### Password Security
- Hashing: bcrypt with automatic salt generation
- Minimum password length enforced at registration
- Password reset via email verification code

### Multi-Factor Authentication (MFA)
- Standard: RFC 6238 TOTP (Time-Based One-Time Password)
- Compatible with: Google Authenticator, Authy, Microsoft Authenticator
- 6-digit codes with 30-second rotation
- MFA enrollment and verification endpoints in ArvAuth

## Authorization

### RBAC Permission Matrix

4-tier role hierarchy enforced at the API gateway middleware layer:

| Domain | Action | Admin | Operator | Developer | Viewer |
|--------|--------|-------|----------|-----------|--------|
| Infrastructure | Provision resources | Yes | Yes | No | No |
| Infrastructure | Restart / Scale | Yes | Yes | Yes | No |
| Infrastructure | Decommission | Yes | No | No | No |
| Deployments | Trigger deployment | Yes | Yes | Yes | No |
| Deployments | Emergency rollback | Yes | Yes | Yes | No |
| Deployments | Modify strategy | Yes | Yes | No | No |
| Observability | View telemetry | Yes | Yes | Yes | Yes |
| Observability | Acknowledge alerts | Yes | Yes | Yes | No |
| Observability | Manage incidents | Yes | Yes | No | No |
| Logs | View log stream | Yes | Yes | Yes | Yes |
| Logs | Export logs | Yes | Yes | Yes | No |
| Automation | Execute runbooks | Yes | Yes | Yes | No |
| Automation | Edit schedules | Yes | Yes | No | No |
| Security | Assign roles | Yes | No | No | No |
| Security | View audit logs | Yes | Yes | No | No |
| Security | Rotate API keys | Yes | No | No | No |

## Transport Security

- TLS 1.3 encryption on all public API endpoints (enforced by Vercel)
- HSTS headers enabled
- All API communication over HTTPS

## Storage Encryption

- MongoDB Atlas: Encryption at rest (AES-256) enabled by default
- Supabase Storage: Server-side encryption for uploaded files
- JWT secrets stored as environment variables (not in codebase)

## Audit Logging

- Append-only audit trail (no UPDATE/DELETE operations)
- Each entry records: timestamp, actor, action, resource, IP address, details
- SHA-256 HMAC integrity verification
- Retention: 365 days (SOC2 Type II / ISO 27001 compliance)
- JSON export for external SIEM ingestion

## Session Management

- Active session listing with device, browser, location, and IP
- Session revocation (token invalidation) for non-current devices
- Current session indicator

## CORS Configuration

- Allowed origins configured for frontend domain
- Credentials mode enabled for JWT cookie/header transmission
- Preflight caching for performance
