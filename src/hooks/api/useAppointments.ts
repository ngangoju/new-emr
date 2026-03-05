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

// Jackson can serialize LocalDateTime as [year,month,day,hour,min,sec] arrays.
// This helper normalizes any date field to an ISO string.
function toISOString(value: unknown): string {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
        // [year, month, day, hour?, min?, sec?] — month is 1-based from Java
        const [y, m, d, hr = 0, min = 0, sec = 0] = value as number[]
        return new Date(y, m - 1, d, hr, min, sec).toISOString()
    }
    if (value instanceof Date) return value.toISOString()
    if (value != null) return new Date(value as string | number).toISOString()
    return ''
}

function normalizeAppointment(apt: Appointment): Appointment {
    return {
        ...apt,
        scheduledAt: toISOString(apt.scheduledAt),
        createdAt: toISOString(apt.createdAt),
        updatedAt: toISOString(apt.updatedAt),
    }
}

export function useAppointments() {
    return useQuery({
        queryKey: ['appointments'],
        queryFn: async () => {
            const { data } = await api.get<Appointment[]>('/appointments')
            return data.map(normalizeAppointment)
        },
    })
}

export function useCreateAppointment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: CreateAppointmentPayload) => {
            const { data } = await api.post<Appointment>('/appointments', payload)
            return normalizeAppointment(data)
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
