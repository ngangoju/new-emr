import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ApprovalRequest, ApprovalStats, ApproveRequestInput, DenyRequestInput } from '@/types/approval'

/**
 * Fetch all pending approval requests
 */
export function usePendingApprovals(
    type?: 'invoice_deletion' | 'discount',
    options?: { enabled?: boolean }
) {
    return useQuery({
        queryKey: ['approvals', 'pending', type],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (type) params.append('type', type)

            const queryString = params.toString()
            const url = `/api/approvals/pending${queryString ? `?${queryString}` : ''}`

            const { data } = await api.get<ApprovalRequest[]>(url)
            return data
        },
        enabled: options?.enabled ?? true,
    })
}

/**
 * Fetch all approvals (for history view)
 */
export function useApprovals(filters?: {
    status?: 'pending' | 'approved' | 'denied'
    type?: 'invoice_deletion' | 'discount'
}) {
    const { status, type } = filters || {}

    return useQuery({
        queryKey: ['approvals', { status, type }],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (status) params.append('status', status)
            if (type) params.append('type', type)

            const queryString = params.toString()
            const url = `/api/approvals${queryString ? `?${queryString}` : ''}`

            const { data } = await api.get<ApprovalRequest[]>(url)
            return data
        },
    })
}

/**
 * Get approval statistics
 */
export function useApprovalStats() {
    return useQuery({
        queryKey: ['approvals', 'stats'],
        queryFn: async () => {
            const { data } = await api.get<ApprovalStats>('/api/approvals/stats')
            return data
        },
    })
}

/**
 * Approve a request
 */
export function useApproveRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: ApproveRequestInput) => {
            const { data } = await api.post<ApprovalRequest>(
                `/api/approvals/${input.id}/approve`,
                { notes: input.notes }
            )
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
        },
    })
}

/**
 * Deny a request
 */
export function useDenyRequest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: DenyRequestInput) => {
            const { data } = await api.post<ApprovalRequest>(
                `/api/approvals/${input.id}/deny`,
                { reason: input.reason }
            )
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
        },
    })
}

/**
 * Request invoice void/deletion approval
 */
export function useRequestInvoiceVoid() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: { invoiceId: string; reason: string }) => {
            const { data } = await api.post<ApprovalRequest>('/api/approvals/invoice-void', {
                invoiceId: input.invoiceId,
                reason: input.reason,
            })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
        },
    })
}

/**
 * Request invoice discount approval (deferred application)
 */
export function useRequestDiscountApproval() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: {
            invoiceId: string
            reason: string
            amount?: number
            percentage?: number
            patientId?: string
        }) => {
            const params = new URLSearchParams({ invoiceId: input.invoiceId })
            if (input.patientId) params.append('patientId', input.patientId)

            const payload: {
                reason: string
                amount?: number
                percentage?: number
            } = {
                reason: input.reason,
            }

            if (typeof input.amount === 'number') payload.amount = input.amount
            if (typeof input.percentage === 'number') payload.percentage = input.percentage

            const { data } = await api.post<ApprovalRequest>(
                `/api/approvals/discount?${params.toString()}`,
                payload
            )
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
        },
    })
}
