/**
 * Aravanta CloudOS Centralized API Client
 *
 * - Dev (localhost):  http://localhost:8000
 * - Prod:             https://arv-backend.vercel.app  (overridable via VITE_API_URL)
 * - Auto-prefixes paths with /api/v1
 * - Preserves Bearer token (param > localStorage)
 * - 15s timeout, 2 retries with exponential backoff on network/5xx
 * - **Sanitized errors**: user-facing message is generic; infra details go only to console.
 *   (info-disclosure hardening: never show raw URLs / Vercel IDs / stack traces to users.)
 */

const DEFAULT_BACKEND =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://arv-backend.vercel.app';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_BACKEND).replace(/\/+$/, '');

export interface ApiOptions extends RequestInit {
  token?: string | null;
  /** Skip retry for this call (e.g. non-idempotent writes you don't want to double-fire). */
  skipRetry?: boolean;
}

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 600;

export const USER_FACING_NETWORK_ERROR =
  "We're having trouble connecting. Please check your network and try again.";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUserError(status: number | null, serverMsg: string | null): string {
  // 4xx with a readable server message (e.g. "Invalid credentials") — surface it.
  if (status && status >= 400 && status < 500 && serverMsg) {
    // Never surface a string that contains the backend URL.
    if (/https?:\/\/|arv-backend|FUNCTION_INVOCATION|vercel\.app/i.test(serverMsg)) {
      return USER_FACING_NETWORK_ERROR;
    }
    return serverMsg;
  }
  // 5xx, network, timeout: generic message (no infra disclosure).
  return USER_FACING_NETWORK_ERROR;
}

export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    token,
    headers: customHeaders,
    skipRetry,
    ...fetchOptions
  } = options;

  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!cleanPath.startsWith('/api/') && cleanPath.startsWith('/v1/')) {
    cleanPath = `/api${cleanPath}`;
  } else if (
    !cleanPath.startsWith('/api/') &&
    !cleanPath.startsWith('/health') &&
    !cleanPath.startsWith('/docs') &&
    !cleanPath.startsWith('/metrics')
  ) {
    cleanPath = `/api/v1${cleanPath}`;
  }

  const fullUrl = `${API_BASE_URL}${cleanPath}`;

  const headers = new Headers(customHeaders ?? {});
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const authToken = token !== undefined ? token : localStorage.getItem('aravanta_token');
  if (authToken && authToken !== 'undefined' && authToken !== 'null' && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isIdempotent = method !== 'POST' || skipRetry !== true;
  const attempts = skipRetry || !isIdempotent ? 1 : MAX_RETRIES + 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      const backoff = RETRY_BASE_MS * 2 ** (attempt - 1);
      await sleep(backoff);
    }

    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers,
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const payload = isJson ? await response.json().catch(() => null) : null;

      if (!response.ok) {
        let serverMsg: string | null = null;
        if (payload && typeof payload === 'object') {
          if (payload.detail) {
            serverMsg = typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail);
          } else if (payload.message) {
            serverMsg = String(payload.message);
          } else if (payload.error) {
            serverMsg = String(payload.error);
          }
        } else if (!isJson) {
          const text = await response.text().catch(() => '');
          if (text) serverMsg = text;
        }

        const is5xx = response.status >= 500;
        const retryable = is5xx && attempt < attempts - 1;
        if (retryable) {
          console.warn(
            `[apiFetch] retry ${attempt + 1}/${attempts} for ${method} ${cleanPath} (status=${response.status})`,
            { url: fullUrl, serverMsg },
          );
          continue;
        }

        const error = new Error(buildUserError(response.status, serverMsg));
        (error as any).status = response.status;
        (error as any).payload = payload;
        (error as any)._technical = serverMsg;
        throw error;
      }
      return payload as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const aborted = err?.name === 'AbortError';
      const network =
        (err?.name === 'TypeError' && /fetch|network|failed/i.test(err?.message || '')) ||
        aborted;
      const retryable = network && attempt < attempts - 1;
      if (retryable) {
        console.warn(
          `[apiFetch] retry ${attempt + 1}/${attempts} for ${method} ${cleanPath}`,
          { url: fullUrl, reason: aborted ? 'timeout' : err?.message, attempt },
        );
        continue;
      }
      // Don't leak the URL to users — log technical detail privately only.
      console.error('[apiFetch] failed', {
        url: fullUrl,
        method,
        status: (err as any)?.status ?? null,
        message: err?.message,
        aborted,
        attempt,
      });
      const userMsg =
        aborted
          ? "Request timed out. Please try again."
          : network
            ? USER_FACING_NETWORK_ERROR
            : err?.message && !/https?:\/\/|arv-backend|FUNCTION_INVOCATION|vercel\.app/i.test(err.message)
              ? err.message
              : USER_FACING_NETWORK_ERROR;
      const outer = new Error(userMsg);
      (outer as any).status = (err as any)?.status ?? null;
      (outer as any)._technical = err?.message ?? null;
      throw outer;
    }
  }
  // Should be unreachable, but guard anyway.
  throw new Error(USER_FACING_NETWORK_ERROR);
}

