import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Per-tenant aggregated stats from GET /api/admin/analytics/tenants. */
export interface TenantStatsDto {
    tenantId: string
    tenantName: string
    patientCount: number
    appointmentCount: number
    consultationCount: number
    labOrderCount: number
    prescriptionCount: number
    visitTicketCount: number
    invoiceCount: number
    invoiceRevenue: number
    activeUserCount: number
}

/** Platform-admin-only per-tenant analytics. 403 surfaces via `error`. */
export function useAnalyticsTenants() {
    return useQuery<TenantStatsDto[]>({
        queryKey: ['admin', 'analytics', 'tenants'],
        queryFn: async () => {
            const { data } = await api.get<TenantStatsDto[]>('/api/admin/analytics/tenants')
            return Array.isArray(data) ? data : []
        },
        retry: false,
    })
}
