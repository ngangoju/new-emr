import axios, { AxiosRequestConfig, Method } from 'axios';
import toast from 'react-hot-toast';
import { handleUnauthorized } from '@/lib/utils/auth';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888',
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
                await axios.post(
                    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888') + '/auth/refresh',
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

        if (status === 403 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('emr:permission-denied'));
        }

        // Auth/route guard states and expected not-found cases are handled by the caller.
        if (status !== 401 && status !== 403 && status !== 404) {
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);
