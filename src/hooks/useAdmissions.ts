'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import type {
    Ward,
    Bed,
    Admission,
    CreateAdmissionDto,
    AdmissionFilters,
    TransferPatientDto,
    WardWithBeds
} from '@/types/admission'

type ApiErrorPayload = {
    response?: {
        data?: {
            message?: string
        }
    }
}

function getApiErrorMessage(error: unknown, fallback: string) {
    const apiError = error as ApiErrorPayload
    return apiError.response?.data?.message || fallback
}

// Ward hooks
export function useWards() {
    return useQuery({
        queryKey: ['wards'],
        queryFn: async () => {
            const { data } = await api.get<Ward[]>('/api/admissions/wards')
            return data
        },
    })
}

export function useWardWithBeds(wardId: string) {
    return useQuery({
        queryKey: ['wards', wardId, 'with-beds'],
        queryFn: async () => {
            const { data } = await api.get<WardWithBeds>(`/api/admissions/wards/${wardId}/beds`)
            return data
        },
        enabled: !!wardId,
    })
}

// Bed hooks
export function useBeds(wardId?: string) {
    return useQuery({
        queryKey: ['beds', wardId],
        queryFn: async () => {
            const params = wardId ? `?wardId=${wardId}` : ''
            const { data } = await api.get<Bed[]>(`/api/admissions/beds${params}`)
            return data
        },
    })
}

export function useAvailableBeds(wardId?: string) {
    return useQuery({
        queryKey: ['beds', 'available', wardId],
        queryFn: async () => {
            const params = wardId ? `?wardId=${wardId}` : ''
            const { data } = await api.get<Bed[]>(`/api/admissions/beds/available${params}`)
            return data
        },
    })
}

// Admission hooks
export function useAdmissions(filters?: AdmissionFilters, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['admissions', filters],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.patientId) params.append('patientId', filters.patientId)
            if (filters?.wardId) params.append('wardId', filters.wardId)
            if (filters?.status) params.append('status', filters.status)
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
            if (filters?.dateTo) params.append('dateTo', filters.dateTo)

            const queryString = params.toString()
            const { data } = await api.get<Admission[]>(
                queryString ? `/api/admissions?${queryString}` : '/api/admissions'
            )
            return data
        },
        enabled: options?.enabled ?? true,
    })
}

export function useCurrentAdmissions() {
    return useQuery({
        queryKey: ['admissions', 'current'],
        queryFn: async () => {
            const { data } = await api.get<Admission[]>('/api/admissions/current')
            return data
        },
    })
}

export function useAdmissionById(id: string) {
    return useQuery({
        queryKey: ['admissions', id],
        queryFn: async () => {
            const { data } = await api.get<Admission>(`/api/admissions/${id}`)
            return data
        },
        enabled: !!id,
    })
}

// Mutation hooks
export function useCreateAdmission() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (dto: CreateAdmissionDto) => {
            const { data } = await api.post<Admission>('/api/admissions', dto)
            return data
        },
        onSuccess: () => {
            toast.success('Patient admitted successfully')
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            queryClient.invalidateQueries({ queryKey: ['beds'] })
            queryClient.invalidateQueries({ queryKey: ['wards'] })
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to admit patient'))
        }
    })
}

export function useDischargePatient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, dischargeNotes }: { id: string; dischargeNotes?: string }) => {
            const { data } = await api.patch<Admission>(
                `/api/admissions/${id}/discharge`,
                { dischargeNotes }
            )
            return data
        },
        onSuccess: () => {
            toast.success('Patient discharged successfully')
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            queryClient.invalidateQueries({ queryKey: ['beds'] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to discharge patient'))
        }
    })
}

export function useTransferPatient() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, dto }: { id: string; dto: TransferPatientDto }) => {
            const { data } = await api.put<Admission>(`/api/admissions/${id}/transfer`, dto)
            return data
        },
        onSuccess: () => {
            toast.success('Patient transferred successfully')
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            queryClient.invalidateQueries({ queryKey: ['beds'] })
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to transfer patient'))
        }
    })
}
