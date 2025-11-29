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


export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: async () => {
            const { data } = await api.get<DashboardStats>('/dashboard/stats');
            return data;
        },
    });
}

export function useTodayAppointments() {
    return useQuery({
        queryKey: ['dashboard', 'appointments'],
        queryFn: async () => {
            const { data } = await api.get<{ appointments: Appointment[] }>('/dashboard/appointments');
            return data.appointments || [];
        },
    });
}

export function useRecentPatients() {
    return useQuery({
        queryKey: ['dashboard', 'recent-patients'],
        queryFn: async () => {
            const { data } = await api.get<RecentPatient[]>('/dashboard/recent-patients');
            return data;
        },
    });
}
