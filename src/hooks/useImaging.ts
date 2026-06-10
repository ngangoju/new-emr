import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ImagingOrder, ImagingResult, DicomImage, CreateImagingOrderInput } from '@/types/imaging'

export function useImagingOrders(status?: string) {
    return useQuery({
        queryKey: ['imaging-orders', status],
        queryFn: async () => {
            const url = status ? `/imaging/orders/status/${status}` : '/imaging/orders'
            const { data } = await api.get<ImagingOrder[]>(url)
            return data
        }
    })
}

export function usePendingImagingOrders(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['imaging-orders', 'pending'],
        queryFn: async () => {
            const { data } = await api.get<ImagingOrder[]>('/imaging/orders/pending')
            return data
        },
        enabled: options?.enabled ?? true,
    })
}

export function usePatientImagingOrders(patientId: string) {
    return useQuery({
        queryKey: ['imaging-orders', 'patient', patientId],
        queryFn: async () => {
            const { data } = await api.get<ImagingOrder[]>(`/imaging/orders/patient/${patientId}`)
            return data
        },
        enabled: !!patientId
    })
}

export function useCreateImagingOrder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: CreateImagingOrderInput) => {
            const { data } = await api.post<ImagingOrder>('/imaging/orders', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
        }
    })
}

export function useAcknowledgeImagingOrder() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (orderId: string) => {
            const { data } = await api.put<ImagingOrder>(`/imaging/orders/${orderId}/acknowledge`)
            return data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'patient', data.patientId] })
        }
    })
}

export function useImagingResult(orderId: string) {
    return useQuery({
        queryKey: ['imaging-result', orderId],
        queryFn: async () => {
            const { data } = await api.get<ImagingResult>(`/imaging/results/order/${orderId}`)
            return data
        },
        enabled: !!orderId
    })
}

export function useUploadDicomImage() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ resultId, file, metadata }: { resultId: string; file: File; metadata: Partial<DicomImage> }) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))

            const { data } = await api.post<DicomImage>(`/imaging/images/${resultId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['imaging-images', variables.resultId] })
            queryClient.invalidateQueries({ queryKey: ['imaging-result'] })
            queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
        }
    })
}

export function useCreateImagingResult() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: Partial<ImagingResult>) => {
            const { data } = await api.post<ImagingResult>('/imaging/results', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imaging-result'] })
            queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
        }
    })
}

export function useDicomImages(resultId: string) {
    return useQuery({
        queryKey: ['imaging-images', resultId],
        queryFn: async () => {
            const { data } = await api.get<DicomImage[]>(`/imaging/images/result/${resultId}`)
            return data
        },
        enabled: !!resultId
    })
}

export function useDicomImagePresignedUrl(imageId: string) {
    return useQuery({
        queryKey: ['dicom-presigned-url', imageId],
        queryFn: async () => {
            const { data } = await api.get<{ url: string }>(`/imaging/images/${imageId}/presigned-url`)
            return data
        },
        enabled: !!imageId,
        staleTime: 1000 * 60 * 50 // 50 minutes (url usually lasts 1h)
    })
}

export function useUpdateImagingOrderStatus() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
            const { data } = await api.put<ImagingOrder>(`/imaging/orders/${orderId}/status/${status}`)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
        }
    })
}
export function useUpdateImagingResult() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ resultId, payload }: { resultId: string; payload: Partial<ImagingResult> }) => {
            const { data } = await api.put<ImagingResult>(`/imaging/results/${resultId}`, payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imaging-result'] })
        }
    })
}

export function useSignImagingResult() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (resultId: string) => {
            const { data } = await api.put<ImagingResult>(`/imaging/results/${resultId}/sign`)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imaging-result'] })
            queryClient.invalidateQueries({ queryKey: ['imaging-orders'] })
        }
    })
}
