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

type RawConsultation = Omit<Partial<Consultation>, 'createdAt' | 'updatedAt' | 'status'> & {
    createdAt?: string | number | null;
    updatedAt?: string | number | null;
    signedAt?: string | number | null;
    status?: string;
    [key: string]: unknown;
};

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

export interface MedicationFormulary {
    id: string;
    brandName: string;
    genericName: string;
    strength: string;
    form: string;
    category: string;
}

export interface ConsultationMedication {
    id: string;
    consultationId: string;
    formularyId: string;
    drugName: string;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    indication?: string;
    allergyOverrideReason?: string;
    interactionOverrideReason?: string;
    safetyChecked?: boolean;
    createdAt: string;
}

export interface AddMedicationPayload {
    formularyId: string;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    indication?: string;
    allergyOverrideReason?: string;
    interactionOverrideReason?: string;
}

export interface DryRunSafetyCheckPayload {
    patientId: string;
    formularyId: string;
    activeFormularyIds: string[];
}

export interface DryRunSafetyCheckResponse {
    safe: boolean;
    allergyConflict?: {
        allergen: string;
        severity: string;
    };
    interactionConflict?: {
        drug1Name: string;
        drug2Name: string;
        description: string;
    };
}

const normalizeConsultation = (c: RawConsultation): Consultation => {
    // Handle the epoch seconds vs milliseconds bug from backend
    const fixDate = (dateVal: string | number | null | undefined) => {
        if (!dateVal) return new Date().toISOString();
        if (typeof dateVal === 'number') {
            // if it's < 10^12, it's likely seconds
            return new Date(dateVal < 10000000000 ? dateVal * 1000 : dateVal).toISOString();
        }
        return dateVal;
    };

    const status: Consultation['status'] =
        (c.status === 'PENDING' || c.status === 'DRAFT') ? 'DRAFT' :
            (c.status === 'SIGNED' || c.status === 'FINALIZED') ? 'FINALIZED' : 'DRAFT';

    return {
        ...c,
        createdAt: fixDate(c.createdAt),
        updatedAt: fixDate(c.updatedAt),
        signedAt: fixDate(c.signedAt),
        status
    } as Consultation;
};

export function useConsultations(params?: { patientId?: string; doctorId?: string }) {
    return useQuery({
        queryKey: ['consultations', params],
        queryFn: async () => {
            const { data } = await api.get<RawConsultation[]>('/consultations', { params });
            return data.map(normalizeConsultation);
        },
    });
}

export function useConsultation(id: string) {
    return useQuery({
        queryKey: ['consultation', id],
        queryFn: async () => {
            const { data } = await api.get<RawConsultation>(`/consultations/${id}`);
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

export function useFormularySearch() {
    return useMutation({
        mutationFn: async (query: string) => {
            const { data } = await api.get<MedicationFormulary[]>(`/api/formulary/search`, { params: { q: query } });
            return data;
        }
    });
}

export function useConsultationMedications(consultationId: string) {
    return useQuery({
        queryKey: ['consultation', consultationId, 'medications'],
        queryFn: async () => {
            const { data } = await api.get<ConsultationMedication[]>(`/consultations/${consultationId}/medications`);
            return data;
        },
        enabled: !!consultationId
    });
}

export function useAddMedication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ consultationId, payload }: { consultationId: string; payload: AddMedicationPayload }) => {
            const { data } = await api.post<ConsultationMedication>(`/consultations/${consultationId}/medications`, payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['consultation', data.consultationId, 'medications'] });
        }
    });
}

export function useDryRunSafetyCheck() {
    return useMutation({
        mutationFn: async (payload: DryRunSafetyCheckPayload) => {
            const { data } = await api.post<DryRunSafetyCheckResponse>('/api/consultations/safety-check', payload);
            return data;
        },
    });
}
