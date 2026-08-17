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

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<any> {
  const headers = new Headers(options.headers ?? {});

  // Only set Content-Type when a body is present and it's not FormData
  if (options.body != null && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  // Prepend /api to paths that don't already start with /api
  // This ensures all API calls go through the Vercel rewrite to the backend
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;

  const response = await fetch(apiPath, { ...options, headers });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let payload: any = null;
  if (isJson) {
    try {
      payload = await response.json();
    } catch (err) {
      payload = null;
    }
  } else {
    try {
      payload = await response.text();
    } catch (err) {
      payload = null;
    }
  }

  if (!response.ok) {
    const detail = isJson && payload && typeof payload === 'object' && ('detail' in payload)
      ? String((payload as any).detail)
      : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return payload;
}
