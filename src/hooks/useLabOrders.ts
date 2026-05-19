import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { api } from '@/lib/api'
import type {
  FinalizeStructuredResultPayload,
  LabInpatientFollowupItem,
  LabOrder,
  LabOrderDetail,
  LabOrderResultPayload,
  LabOrderStatus,
  LabPanelDefinition,
  LabResult,
  LabResultFinalizeRequest,
  LabResultSubmissionResponse,
  LabStats,
  LabWorklistItem,
  LegacyLabResultFinalizeInput,
  PagedResponse,
} from '@/types/lab'

export interface CreateLabOrderPayload {
  patientId: string
  consultId?: string
  tests: string | string[]
  priority?: 'ROUTINE' | 'URGENT' | 'STAT'
  clinicalIndication?: string
  scheduledExamDate?: string
}

export interface WorklistParams {
  page: number
  size?: number
}

export interface LabStatusMutationInput {
  orderId: string
  status: LabOrderStatus
  rejectionReason?: string
}

const DEFAULT_PAGE_SIZE = 20

const emptyPage = <T>(page = 0, size = DEFAULT_PAGE_SIZE): PagedResponse<T> => ({
  data: [],
  meta: {
    page,
    size,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
})

const labOrderKeys = {
  all: ['lab-orders'] as const,
  stats: () => ['lab-orders', 'stats'] as const,
  pending: (page: number, size = DEFAULT_PAGE_SIZE) => ['lab-orders', 'pending', page, size] as const,
  followups: (page: number, size = DEFAULT_PAGE_SIZE) => ['lab-orders', 'followups', page, size] as const,
  detail: (orderId: string) => ['lab-orders', 'detail', orderId] as const,
}

function updateItemInPage<T extends { id: string; status: string }>(
  page: PagedResponse<T> | undefined,
  orderId: string,
  status: LabOrderStatus,
) {
  if (!page) return page
  return {
    ...page,
    data: page.data.map((item) => (item.id === orderId ? { ...item, status } : item)),
  }
}

function removeItemFromPage<T extends { id: string }>(
  page: PagedResponse<T> | undefined,
  orderId: string,
) {
  if (!page) return page
  const nextData = page.data.filter((item) => item.id !== orderId)
  if (nextData.length === page.data.length) return page

  return {
    ...page,
    data: nextData,
    meta: {
      ...page.meta,
      totalElements: Math.max(0, page.meta.totalElements - 1),
    },
  }
}

export function useLabOrderStats() {
  return useQuery({
    queryKey: labOrderKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get<LabStats>('/lab-orders/stats')
      return data
    },
  })
}

export function useLabPendingWorklist({ page, size = DEFAULT_PAGE_SIZE }: WorklistParams) {
  return useQuery({
    queryKey: labOrderKeys.pending(page, size),
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<LabWorklistItem>>('/lab-orders/pending', {
        params: { page, size },
      })
      return data
    },
    placeholderData: () => emptyPage<LabWorklistItem>(page, size),
    refetchInterval: 30_000,
  })
}

export function useLabInpatientFollowups({ page, size = DEFAULT_PAGE_SIZE }: WorklistParams) {
  return useQuery({
    queryKey: labOrderKeys.followups(page, size),
    queryFn: async () => {
      const { data } = await api.get<PagedResponse<LabInpatientFollowupItem>>('/lab-orders/inpatient-followups', {
        params: { page, size },
      })
      return data
    },
    placeholderData: () => emptyPage<LabInpatientFollowupItem>(page, size),
    refetchInterval: 30_000,
  })
}

export function useLabOrders() {
  const pendingQuery = useLabPendingWorklist({ page: 0, size: DEFAULT_PAGE_SIZE })
  const statsQuery = useLabOrderStats()

  return {
    pending: pendingQuery.data?.data ?? [],
    inProgress: (pendingQuery.data?.data ?? []).filter((order) => order.status === 'IN_PROGRESS'),
    completed: [] as LabOrder[],
    rejected: (pendingQuery.data?.data ?? []).filter((order) => order.status === 'REJECTED'),
    stats: statsQuery.data ?? {
      pending: 0,
      completed: 0,
      pendingToday: 0,
      completedToday: 0,
      followupsDueNow: 0,
    },
    loading: pendingQuery.isLoading || statsQuery.isLoading,
  }
}

export function useLabPanelDefinition(panelId: string) {
  return useQuery({
    queryKey: ['lab-panels', panelId],
    queryFn: async () => {
      const { data: panels } = await api.get<Array<{
        id: string
        panelName: string
        panelCode: string
      }>>('/lab-orders/panels')

      const panel = panels.find((item) =>
        [item.id, item.panelCode, item.panelName].some(
          (candidate) => candidate?.toLowerCase() === panelId.toLowerCase(),
        ),
      )

      if (!panel) {
        return {
          id: panelId,
          name: panelId,
          parameters: [],
        } satisfies LabPanelDefinition
      }

      const { data: parameters } = await api.get<Array<{
        parameterName: string
        unit?: string
        displayOrder: number
        minNormalMale?: number
        maxNormalMale?: number
        criticalMin?: number
        criticalMax?: number
      }>>(`/lab-orders/panels/${panel.id}/parameters`)

      return {
        id: panel.id,
        name: panel.panelName,
        parameters: parameters.map((parameter) => ({
          code: parameter.parameterName,
          name: parameter.parameterName,
          unit: parameter.unit,
          sequence: parameter.displayOrder,
          referenceRange:
            parameter.minNormalMale !== undefined && parameter.maxNormalMale !== undefined
              ? { low: parameter.minNormalMale, high: parameter.maxNormalMale }
              : undefined,
          criticalRange:
            parameter.criticalMin !== undefined && parameter.criticalMax !== undefined
              ? { low: parameter.criticalMin, high: parameter.criticalMax }
              : undefined,
        })),
      } satisfies LabPanelDefinition
    },
    enabled: !!panelId,
  })
}

export function useLabOrderDetail(orderId: string) {
  return useQuery({
    queryKey: labOrderKeys.detail(orderId),
    queryFn: async () => {
      const { data } = await api.get<LabOrderDetail>(`/lab-orders/${orderId}`)
      return data
    },
    enabled: !!orderId,
  })
}

export const useLabResult = useLabOrderDetail

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
        priority: payload.priority ?? 'ROUTINE',
      }
      const { data } = await api.post<LabOrder>('/lab-orders', normalizedPayload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labOrderKeys.all })
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
      queryClient.invalidateQueries({ queryKey: labOrderKeys.all })
      queryClient.invalidateQueries({ queryKey: ['patient', data.patientId, 'lab-results'] })
      queryClient.invalidateQueries({ queryKey: ['workflow', 'patient', data.patientId] })
      toast.success('Lab result acknowledged.')
    },
  })
}

export function useSubmitLabResult() {
  const queryClient = useQueryClient()

  const { mutateAsync: submitResult, isPending } = useMutation({
    mutationFn: async ({
      orderId,
      payload,
    }: {
      orderId: string
      payload: LabResultFinalizeRequest
    }) => {
      const { data } = await api.post<LabResultSubmissionResponse>(
        `/lab-orders/${orderId}/results/submit`,
        payload,
      )
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.setQueriesData<PagedResponse<LabWorklistItem>>(
        { queryKey: ['lab-orders', 'pending'] },
        (page) => removeItemFromPage(page, variables.orderId),
      )
      queryClient.setQueriesData<PagedResponse<LabInpatientFollowupItem>>(
        { queryKey: ['lab-orders', 'followups'] },
        (page) => removeItemFromPage(page, variables.orderId),
      )
      queryClient.invalidateQueries({ queryKey: labOrderKeys.stats() })
      queryClient.invalidateQueries({ queryKey: labOrderKeys.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Lab result submitted.')
    },
  })

  return { submitResult, submittingResult: isPending }
}

export function useUploadResult() {
  const { submitResult, submittingResult } = useSubmitLabResult()

  const uploadResult = async ({ orderId, result }: LegacyLabResultFinalizeInput) => {
    const valuesText =
      result.text?.trim() ||
      (result.values && Object.keys(result.values).length > 0 ? JSON.stringify(result.values) : '')

    return submitResult({
      orderId,
      payload: {
        resultValue: valuesText,
        unit: '',
        isCritical: result.status === 'critical',
        criticalNote: result.status === 'critical' ? result.comment ?? '' : '',
        specimenQuality: 'ADEQUATE',
        resultFiles: result.files ?? [],
        notes: result.comment ?? '',
        normalRangeText: '',
      },
    })
  }

  return { uploadResult, uploading: submittingResult }
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
      queryClient.invalidateQueries({ queryKey: labOrderKeys.all })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Lab result finalized as structured panel.')
    },
  })

  return { finalizeStructuredResult, finalizing: isPending }
}

export function useUpdateLabOrderStatus() {
  const queryClient = useQueryClient()

  const { mutateAsync: updateStatus, isPending } = useMutation({
    mutationFn: async ({ orderId, status, rejectionReason }: LabStatusMutationInput) => {
      const { data } = await api.patch<LabOrder>(`/lab-orders/${orderId}/status`, {
        status,
        rejectionReason,
      })
      return data
    },
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: labOrderKeys.all })

      if (status === 'IN_PROGRESS') {
        queryClient.setQueriesData<PagedResponse<LabWorklistItem>>(
          { queryKey: ['lab-orders', 'pending'] },
          (page) => updateItemInPage(page, orderId, status),
        )
        queryClient.setQueriesData<PagedResponse<LabInpatientFollowupItem>>(
          { queryKey: ['lab-orders', 'followups'] },
          (page) => updateItemInPage(page, orderId, status),
        )
      }

      if (status === 'REJECTED') {
        queryClient.setQueriesData<PagedResponse<LabWorklistItem>>(
          { queryKey: ['lab-orders', 'pending'] },
          (page) => removeItemFromPage(page, orderId),
        )
        queryClient.setQueriesData<PagedResponse<LabInpatientFollowupItem>>(
          { queryKey: ['lab-orders', 'followups'] },
          (page) => removeItemFromPage(page, orderId),
        )
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: labOrderKeys.stats() })
      queryClient.setQueryData(labOrderKeys.detail(variables.orderId), (current: LabOrderDetail | undefined) =>
        current ? { ...current, status: data.status, rejectionReason: data.rejectionReason ?? null } : current,
      )
      queryClient.invalidateQueries({ queryKey: ['lab-orders', variables.status === 'REJECTED' ? 'followups' : 'pending'] })
    },
  })

  return { updateStatus, updatingStatus: isPending }
}

export function useRejectSample() {
  const { updateStatus, updatingStatus } = useUpdateLabOrderStatus()

  const rejectSample = async ({ orderId, reason }: { orderId: string; reason: string }) =>
    updateStatus({
      orderId,
      status: 'REJECTED',
      rejectionReason: reason,
    })

  return { rejectSample, rejecting: updatingStatus }
}

export function useLabResultPresignedUpload() {
  const { mutateAsync: getUploadUrl, isPending } = useMutation({
    mutationFn: async (fileName: string) => {
      const { data } = await api.post<{ uploadUrl: string; fileKey: string }>(
        '/lab-orders/storage/presigned-upload',
        null,
        { params: { fileName } },
      )
      return data
    },
  })

  return { getUploadUrl, loadingUploadUrl: isPending }
}

export async function uploadLabResultFile(file: File): Promise<string> {
  const { data } = await api.post<{ uploadUrl: string; fileKey: string }>(
    '/lab-orders/storage/presigned-upload',
    null,
    { params: { fileName: file.name } },
  )

  const response = await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to upload lab result file')
  }

  return data.fileKey
}
