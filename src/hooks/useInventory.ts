import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PharmacyDashboardStats, InventorySummary, StockAlert } from '@/types/pharmacy';

// Fallback data for when the API fails
const fallbackDashboardStats: PharmacyDashboardStats = {
  totalInventoryValue: 0,
  totalMedicationsInStock: 0,
  lowStockCount: 0,
  expiringCount: 0,
  todayDispensingCount: 0,
  todayDispensingRevenue: 0,
  weekDispensingCount: 0,
  weekDispensingRevenue: 0
};

const fallbackInventorySummary: InventorySummary[] = [];

const fallbackStockAlerts: StockAlert = {
  lowStockCount: 0,
  expiringCount: 0,
  lowStockItems: [],
  expiringItems: []
};

export function usePharmacyDashboard() {
  return useQuery({
    queryKey: ['pharmacy', 'dashboard'],
    queryFn: async () => {
      try {
        const { data } = await api.get<PharmacyDashboardStats>('/api/pharmacy/analytics/dashboard');
        return data ?? fallbackDashboardStats;
      } catch (error) {
        console.warn('Failed to fetch pharmacy dashboard:', error);
        return fallbackDashboardStats;
      }
    },
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      try {
        const { data } = await api.get<InventorySummary[]>('/api/pharmacy/inventory/summary');
        return data ?? fallbackInventorySummary;
      } catch (error) {
        console.warn('Failed to fetch inventory summary:', error);
        return fallbackInventorySummary;
      }
    },
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: ['inventory', 'alerts'],
    queryFn: async () => {
      try {
        const { data } = await api.get<StockAlert>('/api/pharmacy/alerts/stock');
        return data ?? fallbackStockAlerts;
      } catch (error) {
        console.warn('Failed to fetch stock alerts:', error);
        return fallbackStockAlerts;
      }
    },
  });
}
