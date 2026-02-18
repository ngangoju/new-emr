import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Ward {
    id: string;
    name: string;
    floor: number;
    capacity: number;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    createdAt: string;
    updatedAt: string;
}

export interface Bed {
    id: string;
    wardId: string;
    wardName?: string;
    bedNumber: string;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
    createdAt: string;
    updatedAt: string;
}

export interface CreateWardDto {
    name: string;
    floor: number;
    capacity: number;
    status: string;
}

export interface UpdateWardDto {
    name?: string;
    floor?: number;
    capacity?: number;
    status?: string;
}

export interface CreateBedDto {
    wardId: string;
    bedNumber: string;
    status: string;
}

export interface UpdateBedDto {
    bedNumber?: string;
    status?: string;
}

export function useWards() {
    return useQuery<Ward[]>({
        queryKey: ['wards'],
        queryFn: async () => {
            const response = await api.get('/api/admissions/wards');
            return response.data;
        },
    });
}

export function useWard(id: string) {
    return useQuery<Ward>({
        queryKey: ['ward', id],
        queryFn: async () => {
            const response = await api.get(`/api/admissions/wards/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateWard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateWardDto) => {
            const response = await api.post('/api/admissions/wards', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
        },
    });
}

export function useUpdateWard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateWardDto }) => {
            const response = await api.put(`/api/admissions/wards/${id}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
            queryClient.invalidateQueries({ queryKey: ['ward', variables.id] });
        },
    });
}

export function useDeleteWard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/api/admissions/wards/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] });
        },
    });
}

export function useBeds(wardId?: string) {
    return useQuery<Bed[]>({
        queryKey: ['beds', wardId],
        queryFn: async () => {
            const url = wardId
                ? `/api/admissions/wards/${wardId}/beds`
                : '/api/admissions/beds';
            const response = await api.get(url);
            return response.data;
        },
    });
}

export function useBed(id: string) {
    return useQuery<Bed>({
        queryKey: ['bed', id],
        queryFn: async () => {
            const response = await api.get(`/api/admissions/beds/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateBed() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateBedDto) => {
            const response = await api.post('/api/admissions/beds', data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            queryClient.invalidateQueries({ queryKey: ['beds', variables.wardId] });
        },
    });
}

export function useUpdateBed() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateBedDto }) => {
            const response = await api.put(`/api/admissions/beds/${id}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
            queryClient.invalidateQueries({ queryKey: ['bed', variables.id] });
        },
    });
}

export function useDeleteBed() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/api/admissions/beds/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beds'] });
        },
    });
}

export function useAvailableBeds(wardId?: string) {
    return useQuery<Bed[]>({
        queryKey: ['available-beds', wardId],
        queryFn: async () => {
            const url = wardId
                ? `/api/admissions/wards/${wardId}/beds/available`
                : '/api/admissions/beds/available';
            const response = await api.get(url);
            return response.data;
        },
    });
}
