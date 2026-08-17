export const API_URL = '/api';

const API_BASE_URL = '/api';

const isFormData = (value: unknown): value is FormData => value instanceof FormData;
const isBlob = (value: unknown): value is Blob => value instanceof Blob;
const isArrayBuffer = (value: unknown): value is ArrayBuffer => value instanceof ArrayBuffer;
const isURLSearchParams = (value: unknown): value is URLSearchParams => value instanceof URLSearchParams;

export async function apiFetch<T = any>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const url = path.startsWith('/api') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Content-Type') && !isFormData(options.body) && !isBlob(options.body) && !isArrayBuffer(options.body) && !isURLSearchParams(options.body)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  const response = await fetch(url, { credentials: options.credentials ?? 'same-origin', ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    if (payload && typeof payload === 'object') {
      if ('detail' in payload) {
        detail = String((payload as any).detail);
      } else if ('message' in payload) {
        detail = String((payload as any).message);
      } else {
        detail = JSON.stringify(payload);
      }
    }

    const error = new Error(detail);
    (error as any).status = response.status;
    (error as any).payload = payload;
    throw error;
  }

  return payload as T;
}
