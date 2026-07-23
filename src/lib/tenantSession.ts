/**
 * localStorage-backed holder for the currently selected tenant id.
 *
 * The selected tenant is injected as an `X-Tenant-ID` header on every axios
 * request (see src/lib/api.ts). This lets a multi-tenant user scope all their
 * data reads/writes to one of their tenant memberships without re-authenticating.
 *
 * The backend TenantFilter enforces that the header value corresponds to a real
 * tenant_members row for the user (else 403), so there is no self-promotion risk.
 *
 * The default selection (the user's home tenant on first load) is seeded by the
 * UI (TenantSwitcher) via setSelectedTenantId — this holder intentionally does
 * NOT import the auth/session module, so it stays cheap to call on every request
 * and does not couple request-time code to session/cookie reads.
 */

const SELECTED_TENANT_KEY = 'emr:selectedTenant';

/**
 * Returns the explicitly persisted tenant id, or null when none is set. When
 * null, no X-Tenant-ID header is sent and the backend falls back to the JWT's
 * tenant claim (the user's home clinic) — which is the correct default.
 */
export function getSelectedTenantId(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        return localStorage.getItem(SELECTED_TENANT_KEY);
    } catch {
        // localStorage may be unavailable (private mode / disabled) — no selection.
        return null;
    }
}

/**
 * Persists the selected tenant id. Passing null clears the explicit selection,
 * reverting future reads to null (backend uses the JWT tenant claim).
 */
export function setSelectedTenantId(id: string | null): void {
    if (typeof window === 'undefined') return;

    try {
        if (id === null) {
            localStorage.removeItem(SELECTED_TENANT_KEY);
        } else {
            localStorage.setItem(SELECTED_TENANT_KEY, id);
        }
    } catch {
        // Best-effort persistence; a storage failure must not crash the caller.
    }
}
