import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import type { LabOrder, LabResult } from '@/types/lab'
import type { LabResultFinalizeRequest, LabResultSubmissionResponse } from '@/types/lab'
import type { FinalizeStructuredResultPayload, LabPanelDefinition } from '@/types/lab'

export interface CreateLabOrderPayload {
  patientId: string
  consultId?: string
  tests: string | string[]
}

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
    inProgress: pending.filter((order) => order.status === 'in_progress'),
    completed,
    rejected: pending.filter((order) => order.status === 'rejected'),
    stats: stats || { pending: 0, completed: 0, pendingToday: 0, completedToday: 0 },
    loading: loadingPending || loadingCompleted
  }
}

export function useLabPanelDefinition(panelId: string) {
  return useQuery({
    queryKey: ['lab-panels', panelId],
    queryFn: async () => {
      const { data } = await api.get<LabPanelDefinition>(`/api/lab-panels/${panelId}`)
      return data
    },
    enabled: !!panelId,
  })
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

export function usePatientLabOrders(patientId: string) {
  return useQuery({
    queryKey: ['lab-orders', 'patient', patientId],
    queryFn: async () => {
      const { data } = await api.get<LabOrder[]>('/lab-orders/completed')
      return data.filter((order) => order.patientId === patientId)
    },
    enabled: !!patientId,
  })
}

export function useCreateLabOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateLabOrderPayload) => {
      const normalizedPayload = {
        ...payload,
        tests: Array.isArray(payload.tests) ? JSON.stringify(payload.tests) : payload.tests,
      }
      const { data } = await api.post<LabOrder>('/lab-orders', normalizedPayload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      toast.success('Lab order created successfully.')
    },
  })
}

export function useAcknowledgeLabOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.put<LabOrder>(`/lab-orders/${orderId}/acknowledge`)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      queryClient.invalidateQueries({ queryKey: ['patient', data.patientId, 'lab-results'] })
      queryClient.invalidateQueries({ queryKey: ['workflow', 'patient', data.patientId] })
      toast.success('Lab result acknowledged.')
    },
  })
}

export function useUploadResult() {
  const queryClient = useQueryClient()

  const { mutateAsync: uploadResult, isPending } = useMutation({
    mutationFn: async ({
      orderId,
      result,
      markAsFinal,
    }: {
      orderId: string
      result: LabResult
      markAsFinal: boolean
    }) => {
      const payload: LabResultFinalizeRequest = {
        result,
        markAsFinal,
      }

      const { data } = await api.post<LabResultSubmissionResponse>(
        `/lab-orders/${orderId}/results/submit`,
        payload,
      )
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch lab orders
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      toast.success(variables.markAsFinal ? 'Lab result finalized and approved.' : 'Lab result submitted.')
    },
    onError: (error) => {
      console.error('Failed to upload result:', error)
    }
  })

  return { uploadResult, uploading: isPending }
}

export function useFinalizeStructuredResult() {
  const queryClient = useQueryClient()

  const { mutateAsync: finalizeStructuredResult, isPending } = useMutation({
    mutationFn: async ({
      orderId,
      payload,
    }: {
      orderId: string
      payload: FinalizeStructuredResultPayload
    }) => {
      const { data } = await api.post<LabResultSubmissionResponse>(
        `/api/lab-orders/${orderId}/results/structured`,
        payload,
      )
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Lab result finalized as structured panel.')
      void api.post('/api/notifications', {
        type: 'LAB_RESULT_READY',
        entityType: 'LAB_ORDER',
        entityId: variables.orderId,
        recipientRole: 'DOCTOR',
      })
    },
  })

  return { finalizeStructuredResult, finalizing: isPending }
}

export function useUpdateLabOrderStatus() {
  const queryClient = useQueryClient()

  const { mutateAsync: updateStatus, isPending } = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: LabOrder['status'] }) => {
      const { data } = await api.patch<LabOrder>(`/lab-orders/${orderId}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
    },
  })

  return { updateStatus, updatingStatus: isPending }
}

export function useRejectSample() {
  const queryClient = useQueryClient()

  const { mutateAsync: rejectSample, isPending } = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data } = await api.post<LabOrder>(`/lab-orders/${orderId}/reject`, { reason })
      await api.post('/api/notifications', {
        type: 'LAB_SAMPLE_REJECTED',
        entityType: 'LAB_ORDER',
        entityId: orderId,
        recipientRole: 'NURSE',
        body: reason,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Sample rejected and nurse notified.')
    },
  })

  return { rejectSample, rejecting: isPending }
}
