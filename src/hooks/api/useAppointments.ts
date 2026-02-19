import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Appointment {
    id: string
    patientId: string
    doctorId: string
    slotId?: string
    scheduledAt: string
    reason?: string
    status: string
    notes?: string
    createdAt: string
    updatedAt: string
    patientName?: string
    doctorName?: string
}

export interface CreateAppointmentPayload {
    patientId: string
    doctorId: string
    slotId?: string
    scheduledAt: string
    reason?: string
    notes?: string
}

export function useAppointments() {
    return useQuery({
        queryKey: ['appointments'],
        queryFn: async () => {
            const { data } = await api.get<Appointment[]>('/appointments')
            return data
        },
    })
}

export function useCreateAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: CreateAppointmentPayload) => {
            const { data } = await api.post<Appointment>('/appointments', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
    })
}

export function useUpdateAppointmentStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { data } = await api.put<Appointment>(`/appointments/${id}/status`, null, {
                params: { status },
            })
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
    })
}

export function useCancelAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.post<Appointment>(`/appointments/${id}/cancel`)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
    })
}

export function useCompleteAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.post<Appointment>(`/appointments/${id}/complete`)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
    })
}

export function useDeleteAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/appointments/${id}`)
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
    })
}
