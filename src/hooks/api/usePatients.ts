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
    nationalId?: string;
    insurance?: {
        provider?: string;
        number?: string;
        expiry?: string;
        [key: string]: unknown;
    };
    emergencyContact?: {
        name?: string;
        relation?: string;
        phone?: string;
        [key: string]: unknown;
    };
    allergies?: string[] | string;
    conditions?: string[] | string;
    // Percentage of each visit's bill the patient pays out of pocket, set at
    // registration. Overrides the insurance-provider default copay rule.
    copayPercentage?: number;
    [key: string]: unknown;
}

export type PatientMutationPayload = Omit<Partial<Patient>, 'insurance' | 'emergencyContact'> & {
    insurance?: Patient['insurance'] | string;
    emergencyContact?: Patient['emergencyContact'] | string;
}

export interface CreatePatientVitalsPayload {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    painScore?: number;
    avpu?: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
    weight?: number;
    height?: number;
    bmi?: number;
    chiefComplaint?: string;
    triageNote?: string;
    triageDisposition?: string;
}

export interface PatientLabResult {
    orderId: string;
    status: string;
    tests?: string;
    results?: string;
    orderedAt?: string;
    processedAt?: string;
    approvedAt?: string;
    physicianAcknowledgedBy?: string;
    physicianAcknowledgedAt?: string;
}

export interface PatientHistoryConsultation {
    id: string;
    status?: string;
    createdAt: string;
    diagnosis?: string;
}

export interface PatientHistoryAppointment {
    id: string;
    status?: string;
    scheduledAt: string;
    reason?: string;
}

export interface PatientHistoryVital {
    id: string;
    recordedAt: string;
    bloodPressure?: string;
    heartRate?: number | string;
    temperature?: number | string;
}

export interface PatientHistory {
    patientId: string;
    consultations: PatientHistoryConsultation[];
    appointments: PatientHistoryAppointment[];
    vitals: PatientHistoryVital[];
    labResults: PatientLabResult[];
    timeline?: PatientHistoryTimelineItem[];
    meta?: {
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export interface PatientHistoryTimelineItem {
    id: string;
    type: 'CONSULTATION' | 'APPOINTMENT' | 'VITALS' | 'LAB' | 'PRESCRIPTION' | 'IMAGING' | string;
    createdAt: string;
    summary: string;
    details: unknown;
}

export interface PatientSearchParams {
    page?: number;
    size?: number;
    limit?: number;
    gender?: string;
    query?: string;
    doctorId?: string;
    admitted?: boolean;
    enabled?: boolean;
}

export function usePatients(params?: PatientSearchParams) {
    return useQuery({
        queryKey: ['patients', params],
        enabled: params?.enabled ?? true,
        queryFn: async () => {
            const requestParams = {
                search: params?.query || undefined,
                gender: params?.gender || undefined,
                doctorId: params?.doctorId || undefined,
                admitted: params?.admitted || undefined,
                page: params?.page ?? 0,
                size: params?.size ?? params?.limit ?? 20,
            };

            if (process.env.NODE_ENV !== 'production') {
                console.debug('[usePatients] request', {
                    url: '/patients',
                    params: requestParams,
                });
            }

            const { data } = await api.get('/patients', { params: requestParams });
            const normalized = Array.isArray(data)
                ? { data, meta: { totalElements: data.length, page: 0, size: data.length, totalPages: 1, hasNext: false, hasPrevious: false } }
                : ('data' in data ? data : { data: [], meta: { totalElements: 0, page: 0, size: 20, totalPages: 0, hasNext: false, hasPrevious: false } });

            if (process.env.NODE_ENV !== 'production') {
                console.debug('[usePatients] response', {
                    url: '/patients',
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
        mutationFn: async (payload: PatientMutationPayload) => {
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
        mutationFn: async ({ id, data }: { id: string; data: PatientMutationPayload }) => {
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

export function useCreatePatientVitals() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ patientId, data }: { patientId: string; data: CreatePatientVitalsPayload }) => {
            const response = await api.post(`/patients/${patientId}/vitals`, data);
            return response.data;
        },
        onMutate: async ({ patientId, data }) => {
            await queryClient.cancelQueries({ queryKey: ['patient', patientId, 'vitals'] });
            const previousVitals = queryClient.getQueryData<unknown[]>(['patient', patientId, 'vitals']);

            const optimisticVitals = {
                id: `temp-${Date.now()}`,
                patientId,
                ...data,
                recordedAt: new Date().toISOString(),
            };

            queryClient.setQueryData<unknown[]>(
                ['patient', patientId, 'vitals'],
                (current = []) => [optimisticVitals, ...current],
            );

            return { previousVitals, patientId };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousVitals && context?.patientId) {
                queryClient.setQueryData(['patient', context.patientId, 'vitals'], context.previousVitals);
            }
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId, 'vitals'] });
        },
    });
}

export function usePatientHistory(id: string, page = 0, size = 20) {
    return useQuery({
        queryKey: ['patient', id, 'history', page, size],
        queryFn: async () => {
            const { data } = await api.get<PatientHistory>(`/patients/${id}/history`, {
                params: { page, size },
            });
            return data;
        },
        enabled: !!id,
    });
}

export function usePatientLabResults(id: string) {
    return useQuery({
        queryKey: ['patient', id, 'lab-results'],
        queryFn: async () => {
            const { data } = await api.get<PatientLabResult[]>(`/patients/${id}/lab-results`);
            return data;
        },
        enabled: !!id,
    });
}
