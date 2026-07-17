import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardStats {
    todayAppointments: number;
    pending: number;
    seen: number;
    avgWait: string;
}

export interface Appointment {
    id: string;
    time: string;
    patientName: string;
    type: string;
    status: string;
}

export interface RecentPatient {
    id: string;
    name: string;
    lastVisit: string;
    status: string;
    avatar?: string;
}


// ... interfaces ...


type DashboardQueryOptions = {
    enabled?: boolean;
};

export async function fetchDashboardStats() {
    const { data } = await api.get<DashboardStats>('/api/dashboard/stats');
    return data;
}

export async function fetchTodayAppointments() {
    const { data } = await api.get<{ appointments: Appointment[] }>('/api/dashboard/appointments');
    return data.appointments || [];
}

export async function fetchRecentPatients() {
    const { data } = await api.get<RecentPatient[]>('/api/dashboard/recent-patients');
    return data;
}

export function useDashboardStats(options: DashboardQueryOptions = {}) {
    const { enabled = true } = options;

    return useQuery({
        queryKey: ['dashboard', 'stats'],
        enabled,
        queryFn: fetchDashboardStats,
    });
}

export function useTodayAppointments(options: DashboardQueryOptions = {}) {
    const { enabled = true } = options;

    return useQuery({
        queryKey: ['dashboard', 'appointments'],
        enabled,
        queryFn: fetchTodayAppointments,
    });
}

export function useRecentPatients(options: DashboardQueryOptions = {}) {
    const { enabled = true } = options;

    return useQuery({
        queryKey: ['dashboard', 'recent-patients'],
        enabled,
        queryFn: fetchRecentPatients,
    });
}

