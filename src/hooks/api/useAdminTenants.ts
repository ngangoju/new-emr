import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Tenant as returned by GET /api/admin/tenants (platform admin only). */
export interface TenantDto {
    id: string
    name: string
    subdomain: string
    plan: string
    status: string
    settings: Record<string, unknown>
    createdAt: string
    updatedAt: string
}

/** Body for POST/PUT /api/admin/tenants. */
export interface CreateTenantDto {
    name: string
    subdomain: string
    plan: string
    settings?: Record<string, unknown>
}

export const adminTenantsKey = ['admin', 'tenants'] as const

/** Lists all tenants. 403 for non-platform-admin users (surface via `error`). */
export function useAdminTenants() {
    return useQuery<TenantDto[]>({
        queryKey: adminTenantsKey,
        queryFn: async () => {
            const { data } = await api.get<TenantDto[]>('/api/admin/tenants')
            return Array.isArray(data) ? data : []
        },
        retry: false,
    })
}

export function useCreateTenant() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: CreateTenantDto) => {
            const { data } = await api.post<TenantDto>('/api/admin/tenants', payload)
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTenantsKey }),
    })
}

export function useUpdateTenant() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: CreateTenantDto }) => {
            const { data } = await api.put<TenantDto>(`/api/admin/tenants/${id}`, payload)
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTenantsKey }),
    })
}

export function useDeleteTenant() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/admin/tenants/${id}`)
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTenantsKey }),
    })
}
