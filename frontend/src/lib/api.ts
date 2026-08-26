/**
 * Compatibility shim.
 *
 * There must be exactly ONE API client implementation in the frontend.
 * The canonical helper lives in `src/config/api.ts`. This module simply
 * re-exports it so any legacy import path (`../lib/api`) keeps working
 * without introducing a second, divergent `apiFetch`.
 */
export { apiFetch, API_BASE_URL } from '../config/api';
export type { ApiOptions } from '../config/api';
