import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Encounter {
    id: string;
    patientId: string;
    type: string;
    currentStatus: string;
    stage: 'TRIAGE' | 'CONSULTATION' | 'TREATMENT' | 'SIGN_OFF' | 'DRAFT';
    currentOwnerId?: string;
    currentOwnerName?: string;
    workflowMode: 'MULTI_ACTOR' | 'SINGLE_ACTOR';
    stepState: string;
    updatedAt: string;
    [key: string]: unknown;
}

export function useEncounter(id: string): UseQueryResult<Encounter | null, Error> {
    return useQuery({
        queryKey: ['encounter', id],
        queryFn: async () => {
            if (!id) return null;
            const { data } = await api.get<Encounter>(`/api/encounters/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateEncounter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Partial<Encounter>) => {
            const { data } = await api.post<Encounter>('/api/encounters', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['encounters'] });
        },
    });
}

export function useHandoffEncounter() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            nextStage,
            newOwnerId,
            notes
        }: {
            id: string;
            nextStage: string;
            newOwnerId: string;
            notes?: string
        }) => {
            const { data } = await api.post<Encounter>(`/api/encounters/${id}/handoff`, null, {
                params: { nextStage, newOwnerId, notes }
            });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['encounter', data.id] });
            queryClient.invalidateQueries({ queryKey: ['encounters'] });
        },
    });
}

export function useUpdateEncounterStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            stepName,
            completed
        }: {
            id: string;
            stepName: string;
            completed: boolean
        }) => {
            const { data } = await api.patch<Encounter>(`/api/encounters/${id}/steps`, null, {
                params: { stepName, completed }
            });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['encounter', data.id] });
        },
    });
}
