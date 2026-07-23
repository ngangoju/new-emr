import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * A tenant membership for the authenticated user, as returned by
 * GET /api/me/tenants.
 */
export interface MyTenant {
    id: string;
    name: string;
    status: string;
    role: string;
}

/**
 * Fetches the authenticated user's own tenant memberships.
 *
 * Returns an empty array for platform admins (who have no tenant_members rows)
 * and on any error, so callers can render safely without special-casing.
 */
export function useMyTenants() {
    return useQuery<MyTenant[]>({
        queryKey: ['me', 'tenants'],
        queryFn: async () => {
            try {
                const { data } = await api.get<MyTenant[]>('/api/me/tenants');
                return Array.isArray(data) ? data : [];
            } catch {
                return [];
            }
        },
        retry: false,
    });
}
