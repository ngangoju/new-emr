import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { LabOrder, LabResult } from '@/types/lab'

export function useLabOrders() {
  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ['lab-orders', 'pending'],
    queryFn: async () => {
      const { data } = await api.get<LabOrder[]>('/lab-orders/pending')
      return data
    }
  })

  const { data: completed = [], isLoading: loadingCompleted } = useQuery({
    queryKey: ['lab-orders', 'completed'],
    queryFn: async () => {
      const { data } = await api.get<LabOrder[]>('/lab-orders/completed')
      return data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['lab-orders', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{
        pending: number
        completed: number
        pendingToday: number
        completedToday: number
      }>('/lab-orders/stats')
      return data
    }
  })

  return {
    pending,
    completed,
    stats: stats || { pending: 0, completed: 0, pendingToday: 0, completedToday: 0 },
    loading: loadingPending || loadingCompleted
  }
}

export function useLabResult(orderId: string) {
  return useQuery({
    queryKey: ['lab-orders', orderId],
    queryFn: async () => {
      const { data } = await api.get<LabOrder>(`/lab-orders/${orderId}`)
      return data
    },
    enabled: !!orderId
  })
}

export function useUploadResult() {
  const queryClient = useQueryClient()

  const { mutate: uploadResult, isPending } = useMutation({
    mutationFn: async ({ orderId, result }: { orderId: string; result: LabResult }) => {
      const { data } = await api.post(`/lab-orders/${orderId}/results`, result)
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch lab orders
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
    },
    onError: (error) => {
      console.error('Failed to upload result:', error)
      alert('Failed to upload results. Please try again.')
    }
  })

  return { uploadResult, uploading: isPending }
}