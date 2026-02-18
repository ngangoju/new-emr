import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Consultation {
    id: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    status: 'DRAFT' | 'FINALIZED';
    diagnosis?: string;
    findings?: string;
    prescriptions?: string;
    createdAt: string;
    [key: string]: unknown;
}

export interface CreateConsultationPayload {
    patientId: string;
    doctorId?: string;
    type?: string;
    appointmentId?: string;
    diagnosis?: string;
    findings?: string;
    prescriptions?: string;
    notes?: string;
    vitals?: unknown;
}

export function useConsultations(params?: { patientId?: string; doctorId?: string }) {
    return useQuery({
        queryKey: ['consultations', params],
        queryFn: async () => {
            const { data } = await api.get<Consultation[]>('/consultations', { params });
            return data;
        },
    });
}

export function useConsultation(id: string) {
    return useQuery({
        queryKey: ['consultation', id],
        queryFn: async () => {
            const { data } = await api.get<Consultation>(`/consultations/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateConsultation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateConsultationPayload) => {
            const { data } = await api.post<Consultation>('/consultations', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consultations'] });
        },
    });
}

export function useUpdateConsultation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Consultation> }) => {
            const response = await api.put<Consultation>(`/consultations/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['consultation', data.id] });
        },
    });
}

export function useDeleteConsultation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/consultations/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consultations'] });
        },
    });
}
