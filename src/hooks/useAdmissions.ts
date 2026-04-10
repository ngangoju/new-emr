'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import type {
    Ward,
    Bed,
    Admission,
    AdmissionDischargePrep,
    AdmissionMedicationReconciliation,
    MedicationAdministration,
    MedicationScheduleEntry,
    CreateMedicationAdministrationDto,
    SaveAdmissionMedicationReconciliationDto,
    CreateAdmissionDto,
    AdmissionFilters,
    TransferPatientDto
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
            // API returns Bed[] array directly, not WardWithBeds structure
            // NOTE: If backend changes to return WardWithBeds, update this type
            const { data } = await api.get<Bed[]>(`/api/admissions/wards/${wardId}/beds`)
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
        mutationFn: async ({ id, dischargeNotes, overrideReason }: { id: string; dischargeNotes?: string; overrideReason?: string }) => {
            const { data } = await api.patch<Admission>(
                `/api/admissions/${id}/discharge`,
                overrideReason ? { adminOverrideReason: overrideReason, dischargeNotes } : { dischargeNotes }
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

export function useAdmissionDischargePrep(id: string) {
    return useQuery({
        queryKey: ['admissions', id, 'discharge-prep'],
        queryFn: async () => {
            const { data } = await api.get<AdmissionDischargePrep>(`/api/admissions/${id}/discharge-prep`)
            return data
        },
        enabled: !!id,
    })
}

export function useUpdateAdmissionDischargePrep(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (dto: Partial<AdmissionDischargePrep>) => {
            const { data } = await api.patch<AdmissionDischargePrep>(`/api/admissions/${id}/discharge-prep`, dto)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admissions', id, 'discharge-prep'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'discharge-readiness'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-summary'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-document'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-document-preview'] })
            queryClient.invalidateQueries({ queryKey: ['admissions'] })
            toast.success('Discharge preparation updated')
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to update discharge preparation'))
        }
    })
}

export function useAdmissionMedicationAdministrations(id: string) {
    return useQuery({
        queryKey: ['admissions', id, 'medication-administrations'],
        queryFn: async () => {
            const { data } = await api.get<MedicationAdministration[]>(`/api/admissions/${id}/medication-administrations`)
            return data
        },
        enabled: !!id,
    })
}

export function useAdmissionMedicationSchedule(id: string) {
    return useQuery({
        queryKey: ['admissions', id, 'medication-schedule'],
        queryFn: async () => {
            const { data } = await api.get<MedicationScheduleEntry[]>(`/api/admissions/${id}/medication-schedule`)
            return data
        },
        enabled: !!id,
    })
}

export function useAdmissionMedicationReconciliation(id: string) {
    return useQuery({
        queryKey: ['admissions', id, 'medication-reconciliation'],
        queryFn: async () => {
            const { data } = await api.get<AdmissionMedicationReconciliation>(`/api/admissions/${id}/medication-reconciliation`)
            return data
        },
        enabled: !!id,
    })
}

export function useSaveAdmissionMedicationReconciliation(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (dto: SaveAdmissionMedicationReconciliationDto) => {
            const { data } = await api.put<AdmissionMedicationReconciliation>(`/api/admissions/${id}/medication-reconciliation`, dto)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admissions', id, 'medication-reconciliation'] })
            queryClient.invalidateQueries({ queryKey: ['admissions', id, 'discharge-prep'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'discharge-readiness'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-summary'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-document'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-document-preview'] })
            toast.success('Medication reconciliation saved')
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to save medication reconciliation'))
        }
    })
}

export function useRecordMedicationAdministration(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (dto: CreateMedicationAdministrationDto) => {
            const { data } = await api.post<MedicationAdministration>(`/api/admissions/${id}/medication-administrations`, dto)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admissions', id, 'medication-administrations'] })
            queryClient.invalidateQueries({ queryKey: ['admissions', id, 'discharge-prep'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'discharge-readiness'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-summary'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-document'] })
            queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', id, 'after-visit-document-preview'] })
            toast.success('Medication administration recorded')
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, 'Failed to record medication administration'))
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
