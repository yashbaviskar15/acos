/**
 * Aravanta CloudOS Centralized API Client
 * 
 * Rules:
 * - Production frontend must use the same-origin `/api` base URL.
 * - Requests are proxied to the backend by the Vercel rewrites configured in vercel.json (`/api/v1/...`).
 * - Never hardcode the backend origin/domain in frontend source; always route through `/api`.
 * - Preserve Authorization header `Bearer <token>` (never send "Bearer undefined" or "Bearer null").
 * - Preserve Content-Type: application/json.
 * - Extract and throw actual backend error detail strings.
 */

export const API_BASE_URL = '/api';

export interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  // Normalize path to always start with /api/v1...
  let targetPath = path;
  if (targetPath.startsWith('/api/')) {
    // already has /api/ prefix
  } else if (targetPath.startsWith('/v1/')) {
    targetPath = `${API_BASE_URL}${targetPath}`;
  } else if (targetPath.startsWith('/')) {
    targetPath = `${API_BASE_URL}${targetPath}`;
  } else {
    targetPath = `${API_BASE_URL}/${targetPath}`;
  }

  const headers = new Headers(customHeaders ?? {});

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Get auth token from parameter or localStorage.
  // NOTE: the app persists the JWT under the 'aravanta_token' key (see App.tsx / Login.tsx).
  const authToken = token !== undefined ? token : localStorage.getItem('aravanta_token');
  if (authToken && authToken !== 'undefined' && authToken !== 'null' && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(targetPath, {
    ...fetchOptions,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    if (payload && typeof payload === 'object') {
      if (payload.detail) {
        errorMessage = typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail);
      } else if (payload.message) {
        errorMessage = String(payload.message);
      } else if (payload.error) {
        errorMessage = String(payload.error);
      }
    } else if (!isJson) {
      const text = await response.text().catch(() => '');
      if (text) errorMessage = text;
    }
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).payload = payload;
    throw error;
  }

  return payload as T;
}
