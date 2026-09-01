/**
 * Aravanta CloudOS Centralized API Client
 * 
 * Rules:
 * - In local dev (localhost), points to http://localhost:8000.
 * - In production, points directly to https://arv-backend.vercel.app (or custom VITE_API_URL).
 * - Transparently handles /api/v1 prefixing.
 * - Preserves Authorization header `Bearer <token>`.
 * - Preserves Content-Type: application/json.
 * - Extracts and throws clear backend error detail strings.
 */

const DEFAULT_BACKEND = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8000'
  : 'https://arv-backend.vercel.app';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_BACKEND).replace(/\/+$/, '');

export interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/api/') && cleanPath.startsWith('/v1/')) {
    cleanPath = `/api${cleanPath}`;
  } else if (!cleanPath.startsWith('/api/') && !cleanPath.startsWith('/health') && !cleanPath.startsWith('/docs') && !cleanPath.startsWith('/metrics')) {
    cleanPath = `/api/v1${cleanPath}`;
  }

  const fullUrl = `${API_BASE_URL}${cleanPath}`;

  const headers = new Headers(customHeaders ?? {});

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Get auth token from parameter or localStorage
  const authToken = token !== undefined ? token : localStorage.getItem('aravanta_token');
  if (authToken && authToken !== 'undefined' && authToken !== 'null' && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  try {
    const response = await fetch(fullUrl, {
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
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Unable to connect to Aravanta backend API at ${API_BASE_URL}. Please check network or service availability.`);
    }
    throw err;
  }
}
