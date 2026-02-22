import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Consultation {
    id: string;
    patientId: string;
    doctorId: string;
    patientName?: string;
    doctorName?: string;
    appointmentId?: string;
    status: 'DRAFT' | 'FINALIZED';
    type?: string;
    diagnosis?: string;
    presentingComplaint?: string;
    findings?: string;
    notes?: string;
    prescriptions?: string;
    createdAt: string;
    updatedAt: string;
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

const normalizeConsultation = (c: any): Consultation => {
    // Handle the epoch seconds vs milliseconds bug from backend
    const fixDate = (dateVal: any) => {
        if (!dateVal) return new Date().toISOString();
        if (typeof dateVal === 'number') {
            // if it's < 10^12, it's likely seconds
            return new Date(dateVal < 10000000000 ? dateVal * 1000 : dateVal).toISOString();
        }
        return dateVal;
    };

    return {
        ...c,
        createdAt: fixDate(c.createdAt),
        updatedAt: fixDate(c.updatedAt),
        signedAt: fixDate(c.signedAt),
        // Map common backend status to frontend expected
        status: (c.status === 'PENDING' || c.status === 'DRAFT') ? 'DRAFT' :
            (c.status === 'SIGNED' || c.status === 'FINALIZED') ? 'FINALIZED' : c.status
    };
};

export function useConsultations(params?: { patientId?: string; doctorId?: string }) {
    return useQuery({
        queryKey: ['consultations', params],
        queryFn: async () => {
            const { data } = await api.get<any[]>('/consultations', { params });
            return data.map(normalizeConsultation);
        },
    });
}

export function useConsultation(id: string) {
    return useQuery({
        queryKey: ['consultation', id],
        queryFn: async () => {
            const { data } = await api.get<any>(`/consultations/${id}`);
            return normalizeConsultation(data);
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

export function useSignConsultation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.post<Consultation>(`/consultations/${id}/sign`);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['consultation', data.id] });
            queryClient.invalidateQueries({ queryKey: ['consultations'] });
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
