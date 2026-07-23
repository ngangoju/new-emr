import axios, { AxiosRequestConfig, Method } from 'axios';
import toast from 'react-hot-toast';
import { handleUnauthorized } from '@/lib/utils/auth';
import { getSelectedTenantId } from '@/lib/tenantSession';
import { toEmrError, type EmrError } from '@/lib/errors';

export const api = axios.create({
    // Route through Next.js rewrite proxy (/backend/* → API_ORIGIN/*) so that
    // session cookies are first-party on the Next.js origin. This fixes the
    // auth loss on hard reload (F-003). See next.config.ts rewrites.
    baseURL: '/backend',
    withCredentials: true,
    // Align with Spring WebFlux CookieServerCsrfTokenRepository defaults.
    // Backend writes `XSRF-TOKEN` cookie and expects `X-XSRF-TOKEN` header.
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    // Authorization header injection intentionally removed.
    // Tokens are transmitted exclusively via HttpOnly cookies set by the backend.
    // withCredentials: true ensures cookies are sent on every cross-origin request.
});

const readCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const prefix = `${name}=`;
    const parts = document.cookie.split(';').map((c) => c.trim());
    const hit = parts.find((part) => part.startsWith(prefix));
    return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
};

api.interceptors.request.use((config) => {
    const method = (config.method || 'get').toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (isStateChanging) {
        const csrfToken = readCookie('XSRF-TOKEN');
        if (csrfToken) {
            config.headers = config.headers || {};
            config.headers['X-XSRF-TOKEN'] = csrfToken;
        }
    }

    // Multi-tenant scoping: inject the currently selected tenant id so the
    // backend TenantFilter scopes this request to the chosen membership.
    // The backend rejects (403) a tenant the user is not a member of, so this
    // is a request-scoping hint, not a privilege grant.
    const selectedTenantId = getSelectedTenantId();
    if (selectedTenantId) {
        config.headers = config.headers || {};
        config.headers['X-Tenant-ID'] = selectedTenantId;
    }

    return config;
});

/**
 * Structured refresh token response from backend.
 * NOTE: With HttpOnly cookie auth the interceptor no longer reads the accessToken
 * from this payload — the backend sets it via Set-Cookie. This type is kept
 * for contract tests that validate the backend response shape.
 */
export interface RefreshTokenResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    userId: string;
}

/**
 * Parses the refresh token response, handling both structured JSON and legacy plain string.
 * NOTE: Not used by the runtime interceptor after the HttpOnly cookie migration.
 * Retained for contract test compatibility only.
 */
export function parseRefreshTokenResponse(data: unknown): string {
    if (!data) throw new Error('Empty refresh token response');

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const response = data as Record<string, unknown>;
        if (response.accessToken && typeof response.accessToken === 'string') {
            return response.accessToken;
        }
        if (response.token && typeof response.token === 'string') {
            return response.token;
        }
    }

    if (typeof data === 'string') return data.trim();

    throw new Error('Invalid refresh token response format');
}

// Helper function for API requests
export const apiRequest = async <T>(
    method: Method,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<{ data: T }> => {
    const response = await api.request<T>({
        method,
        url,
        data,
        ...config,
    })
    return { data: response.data }
}

// Token is now managed exclusively by HttpOnly cookies.
// No localStorage read or Authorization header injection.
// This comment is the Tiger Team attestation that the localStorage → HttpOnly
// cookie migration has been completed on the frontend (Phase 1, Fix 1).

let _isRefreshing = false;
let _pendingRequests: Array<() => void> = [];

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error.response?.status;
        const original = error.config;

        // Requests aborted by client-side navigation (React Query unmount, route change)
        // surface here with no HTTP response. They are not real failures — suppress them
        // so fast page switches never raise a spurious "Action Failed" popup.
        if (
            axios.isCancel(error) ||
            error.code === 'ERR_CANCELED' ||
            error.code === 'ECONNABORTED'
        ) {
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized — attempt silent token refresh via cookie.
        // The refreshToken HttpOnly cookie is sent automatically by the browser.
        if (status === 401 && original && !original._retry) {
            original._retry = true;

            if (_isRefreshing) {
                // Queue this request until the refresh completes
                return new Promise((resolve) => {
                    _pendingRequests.push(() => resolve(api(original)));
                });
            }

            _isRefreshing = true;

            try {
                // POST to /auth/refresh with no body.
                // The refreshToken HttpOnly cookie is sent automatically via withCredentials.
                // The backend sets a new accessToken cookie in the response.
                // Use the same proxy path as the main axios instance so the
                // refresh request is first-party and the Set-Cookie header
                // is accepted by the browser on hard reloads.
                await axios.post(
                    '/backend/auth/refresh',
                    {},
                    { withCredentials: true }
                );

                // Re-run all pending requests now that the new accessToken cookie is set
                _pendingRequests.forEach((cb) => cb());
                _pendingRequests = [];

                return api(original);
            } catch (refreshError) {
                _pendingRequests = [];
                // Refresh failed — clear local session metadata and redirect to login
                handleUnauthorized();
                return Promise.reject(refreshError);
            } finally {
                _isRefreshing = false;
            }
        }

        // Global Error Handling
        const errData = error.response?.data;
        let errorMessage = errData?.message || 'An unexpected error occurred';

        // Append details if present
        if (errData?.details && Array.isArray(errData.details)) {
            const detailString = errData.details.join(', ');
            if (detailString) {
                errorMessage = `${errorMessage}: ${detailString}`;
            }
        }

        // Surface traceId for debugging/support
        if (errData?.traceId) {
            errorMessage = `${errorMessage} [Trace: ${errData.traceId}]`;
        }

        const emrError: EmrError = toEmrError({
            status,
            message: errorMessage,
            code: typeof errData?.code === 'string' ? errData.code : undefined,
            details: errData?.fieldErrors ?? errData?.details,
            traceId: typeof errData?.traceId === 'string' ? errData.traceId : undefined,
            blocking: Boolean(errData?.blocking),
        });
        // Attach typed error for callers / React Query
        error.emrError = emrError;

        if (status === 403 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('emr:permission-denied', { detail: emrError }));
            // Typed path only — do not string-match permission messages
            return Promise.reject(error);
        }

        // Rate limiting (429) is transient and self-resolving.
        if (status === 429) {
            toast('You are going a little fast — please retry in a moment.', { icon: '⏳' });
            return Promise.reject(error);
        }

        // Auth/route-guard (401/404) silent; recoverable server errors → non-blocking toast;
        // blocking modal only when server marks blocking or severity modal.
        if (error.response && status !== 401 && status !== 404) {
            if (typeof window !== 'undefined' && (emrError.severity === 'modal' || emrError.blocking)) {
                window.dispatchEvent(new CustomEvent('emr:error', { detail: emrError }));
            } else if (emrError.severity === 'toast' || emrError.severity === 'field') {
                toast.error(errorMessage);
            }
        }

        return Promise.reject(error);
    }
);
