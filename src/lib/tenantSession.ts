import { getSessionUser } from '@/lib/utils/auth';

/**
 * localStorage-backed holder for the currently selected tenant id.
 *
 * The selected tenant is injected as an `X-Tenant-ID` header on every axios
 * request (see src/lib/api.ts). This lets a multi-tenant user scope all their
 * data reads/writes to one of their tenant memberships without re-authenticating.
 *
 * The backend TenantFilter enforces that the header value corresponds to a real
 * tenant_members row for the user (else 403), so there is no self-promotion risk.
 */

const SELECTED_TENANT_KEY = 'emr:selectedTenant';

/**
 * Returns the currently selected tenant id.
 *
 * Resolution order:
 *   1. The explicitly persisted selection (localStorage).
 *   2. Fallback to the session user's own tenantId (first load / never switched).
 *   3. null when neither is available (SSR, logged-out, or platform admin).
 */
export function getSelectedTenantId(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(SELECTED_TENANT_KEY);
        if (stored) return stored;
    } catch {
        // localStorage may be unavailable (private mode / disabled) — fall through.
    }

    const user = getSessionUser();
    return user?.tenantId ?? null;
}

/**
 * Persists the selected tenant id. Passing null clears the explicit selection,
 * reverting future reads to the session user's own tenantId fallback.
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
