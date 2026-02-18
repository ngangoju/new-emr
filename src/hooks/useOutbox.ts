'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

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
            const { data } = await api.get<OutboxEntry[]>('/admin/outbox')
            return data
        },
        refetchInterval: 10000, // Refresh every 10s
    })
}

export function useRetryOutbox() {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/admin/outbox/${id}/retry`)
        },
        onSuccess: () => {
            toast.success('Event scheduled for retry')
            queryClient.invalidateQueries({ queryKey: ['outbox'] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to retry event')
        }
    })

    return {
        retry: mutation.mutate,
        retrying: mutation.isPending
    }
}
