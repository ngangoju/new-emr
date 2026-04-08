import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DrugRequest, CreateDrugRequestInput, DrugRequestStatus } from '@/types/pharmacy'

interface UseDrugRequestsOptions {
    status?: DrugRequestStatus
}

interface UseDrugRequestsFilters extends UseDrugRequestsOptions {
    patientId?: string
}

/**
 * Fetch all drug requests with optional filtering
 */
export function useDrugRequests(filters: UseDrugRequestsFilters = {}) {
    const { status, patientId } = filters

    return useQuery({
        queryKey: ['drug-requests', { status, patientId }],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (status) params.append('status', status)
            if (patientId) params.append('patientId', patientId)

            const queryString = params.toString()
            const url = `/api/pharmacy/requests${queryString ? `?${queryString}` : ''}`

            const { data } = await api.get<DrugRequest[]>(url)
            return data
        },
    })
}

/**
 * Fetch a single drug request by ID
 */
export function useDrugRequest(id: string) {
    return useQuery({
        queryKey: ['drug-request', id],
        queryFn: async () => {
            const { data } = await api.get<DrugRequest>(`/api/pharmacy/requests/${id}`)
            return data
        },
        enabled: !!id,
    })
}

/**
 * Create a new drug request (used by nurses)
 */
export function useCreateDrugRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: CreateDrugRequestInput) => {
            const { data } = await api.post<DrugRequest>('/api/pharmacy/requests', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drug-requests'] })
        },
    })
}

/**
 * Mark a drug request as fulfilled (used by pharmacists)
 */
export function useFulfillDrugRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            id,
            notes,
            dispenseAllocations,
        }: {
            id: string
            notes?: string
            dispenseAllocations?: Array<{ inventoryId: string; quantity: number; drugName?: string }>
        }) => {
            const { data } = await api.patch<DrugRequest>(`/api/pharmacy/requests/${id}`, {
                status: 'fulfilled',
                notes,
                dispenseAllocations,
            })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drug-requests'] })
        },
    })
}

/**
 * Deny a drug request (used by pharmacists)
 */
export function useDenyDrugRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, reason, notes }: { id: string; reason: string; notes?: string }) => {
            const { data } = await api.patch<DrugRequest>(`/api/pharmacy/requests/${id}`, {
                status: 'denied',
                notes,
                denialReason: reason,
            })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drug-requests'] })
        },
    })
}

/**
 * Approve a drug request (used by pharmacists) - optional intermediate step
 */
export function useApproveDrugRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
            const { data } = await api.patch<DrugRequest>(`/api/pharmacy/requests/${id}`, {
                status: 'approved',
                notes,
            })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drug-requests'] })
        },
    })
}
