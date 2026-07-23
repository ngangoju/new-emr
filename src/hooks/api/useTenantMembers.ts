import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Member as returned by GET /api/admin/tenants/{tenantId}/members. */
export interface TenantMemberDto {
    userId: string
    username: string
    email: string
    role: string
}

/** Optional body for POST /api/admin/tenants/{tenantId}/members/{userId}. */
export interface AssignMemberRequest {
    role?: string
    permissionsJson?: string
}

export const tenantMembersKey = (tenantId: string) =>
    ['admin', 'tenants', tenantId, 'members'] as const

/** Lists members of a tenant. 403 for non-platform-admin users. */
export function useTenantMembers(tenantId: string) {
    return useQuery<TenantMemberDto[]>({
        queryKey: tenantMembersKey(tenantId),
        queryFn: async () => {
            const { data } = await api.get<TenantMemberDto[]>(
                `/api/admin/tenants/${tenantId}/members`
            )
            return Array.isArray(data) ? data : []
        },
        enabled: Boolean(tenantId),
        retry: false,
    })
}

export function useAddTenantMember(tenantId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            userId,
            body,
        }: {
            userId: string
            body?: AssignMemberRequest
        }) => {
            const { data } = await api.post<TenantMemberDto>(
                `/api/admin/tenants/${tenantId}/members/${userId}`,
                body ?? {}
            )
            return data
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: tenantMembersKey(tenantId) }),
    })
}

export function useRemoveTenantMember(tenantId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (userId: string) => {
            await api.delete(`/api/admin/tenants/${tenantId}/members/${userId}`)
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: tenantMembersKey(tenantId) }),
    })
}

/** Sets a user's home clinic: POST /api/admin/users/{userId}/tenant { tenantId }. */
export function useSetHomeTenant() {
    return useMutation({
        mutationFn: async ({ userId, tenantId }: { userId: string; tenantId: string }) => {
            await api.post(`/api/admin/users/${userId}/tenant`, { tenantId })
        },
    })
}
