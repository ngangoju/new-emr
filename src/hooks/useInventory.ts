import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PharmacyDashboardStats, InventorySummary, StockAlert } from '@/types/pharmacy';

export function usePharmacyDashboard() {
  return useQuery({
    queryKey: ['pharmacy', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<PharmacyDashboardStats>('/inventory/dashboard');
      return data;
    },
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<InventorySummary[]>('/inventory/summary');
      return data;
    },
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: ['inventory', 'alerts'],
    queryFn: async () => {
      const { data } = await api.get<StockAlert>('/inventory/alerts');
      return data;
    },
  });
}