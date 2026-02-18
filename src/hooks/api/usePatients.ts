import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email?: string;
    address?: string;
    insurance?: any;
    allergies?: string[];
    conditions?: string[];
    [key: string]: any;
}

export interface PatientSearchParams {
    page?: number;
    limit?: number;
    gender?: string;
    query?: string;
}

export function usePatients(params?: PatientSearchParams) {
    return useQuery({
        queryKey: ['patients', params],
        queryFn: async () => {
            const url = params?.query
                ? `/patients/search`
                : '/patients';

            if (process.env.NODE_ENV !== 'production') {
                console.debug('[usePatients] request', {
                    url,
                    params,
                });
            }

            const { data } = await api.get(url, { params });
            const normalized = Array.isArray(data) ? { data, meta: { total: data.length } } : data;

            if (process.env.NODE_ENV !== 'production') {
                console.debug('[usePatients] response', {
                    url,
                    total: Array.isArray(normalized?.data) ? normalized.data.length : undefined,
                    shape: Array.isArray(data) ? 'array' : 'object',
                });
            }

            return normalized;
        },
    });
}

export function usePatient(id: string) {
    return useQuery({
        queryKey: ['patient', id],
        queryFn: async () => {
            const { data } = await api.get<Patient>(`/patients/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreatePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Partial<Patient>) => {
            const { data } = await api.post<Patient>('/patients', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        },
    });
}

export function useUpdatePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Patient> }) => {
            const response = await api.put<Patient>(`/patients/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['patient', data.id] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        },
    });
}

export function usePatientVitals(id: string) {
    return useQuery({
        queryKey: ['patient', id, 'vitals'],
        queryFn: async () => {
            const { data } = await api.get(`/patients/${id}/vitals`);
            return data;
        },
        enabled: !!id,
    });
}
