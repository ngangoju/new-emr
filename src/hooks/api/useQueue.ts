import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface QueueItem {
    id: string;
    patientId: string;
    patientName: string;
    status: 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW';
    queueNumber: number;
    joinedAt: string;
    waitTime?: string;
    [key: string]: any;
}

export function useQueue() {
    return useQuery({
        queryKey: ['queue'],
        queryFn: async () => {
            const { data } = await api.get<QueueItem[]>('/queue/active');
            return data;
        },
        refetchInterval: 30000, // Poll every 30s as fallback to WebSocket
    });
}

export function useAddToQueue() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { patientId: string; consultationType?: string; priority?: string }) => {
            const { data } = await api.post<QueueItem>('/queue', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        },
    });
}

export function useCallNextPatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data } = await api.post<QueueItem>('/queue/call-next');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        },
    });
}

export function useUpdateQueueStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            let response;
            if (status === 'IN_PROGRESS') {
                response = await api.post<QueueItem>(`/queue/${id}/start`);
            } else if (status === 'COMPLETED') {
                response = await api.post<QueueItem>(`/queue/${id}/complete`);
            } else if (status === 'NO_SHOW') {
                response = await api.post<QueueItem>(`/queue/${id}/no-show`);
            } else {
                throw new Error(`Unsupported status transition to: ${status}`);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        },
    });
}
