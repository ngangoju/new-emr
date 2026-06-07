'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

type ApiErrorPayload = {
    response?: {
        data?: {
            message?: string
        }
    }
}

export interface OutboxEntry {
    id: string
    aggregateType: string
    aggregateId: string
    eventType: string
    payload: string
    createdAt: string
    processedAt?: string
    status: 'PENDING' | 'PROCESSED' | 'FAILED'
    retryCount: number
    lastError?: string
}

export function useOutboxEntries() {
    return useQuery({
        queryKey: ['outbox'],
        queryFn: async () => {
            const { data } = await api.get<OutboxEntry[]>('/api/admin/outbox')
            return data
        },
        refetchInterval: 10000,       // Refresh every 10s when healthy
        retry: false,                 // Don't retry on network failure — avoids console spam
        refetchOnWindowFocus: false,  // Don't re-fetch on tab switch when backend is down
    })
}

export function useRetryOutbox() {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/api/admin/outbox/${id}/retry`)
        },
        onSuccess: () => {
            toast.success('Event scheduled for retry')
            queryClient.invalidateQueries({ queryKey: ['outbox'] })
        },
        onError: (err: unknown) => {
            const apiError = err as ApiErrorPayload
            toast.error(apiError.response?.data?.message || 'Failed to retry event')
        }
    })

    return {
        retry: mutation.mutate,
        retrying: mutation.isPending
    }
}
