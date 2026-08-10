export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  permissions: string[];
  mfa_enabled: boolean;
  fido2_registered: boolean;
  is_active: boolean;
}

export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  challenge_token?: string;
  token_type: string;
  expires_in: number;
  mfa_required: boolean;
  user?: AuthUser;
}

export interface RegisterResponse {
  user: AuthUser;
  mfa_secret: string;
  totp_provisioning_uri: string;
  note: string;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload
        ? String(payload.detail)
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload as T;
}
