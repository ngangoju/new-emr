import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PharmacyDashboardStats, StockAlert, PaginatedInventoryResponse, InventoryEntry } from '@/types/pharmacy';

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

const fallbackPaginatedInventory: PaginatedInventoryResponse = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0
};

const fallbackStockAlerts: StockAlert = {
  lowStockCount: 0,
  expiringCount: 0,
  lowStockItems: [],
  expiringItems: []
};

export interface InventoryFilters {
  search?: string;
  category?: string;
  page?: number;
  size?: number;
}

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

export function useInventorySummary(filters?: InventoryFilters) {
  const { search, category, page = 0, size = 20 } = filters ?? {};

  return useQuery({
    queryKey: ['inventory', 'summary', search, category, page, size],
    queryFn: async () => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        params.append('page', page.toString());
        params.append('size', size.toString());

        const { data } = await api.get<PaginatedInventoryResponse>(
          `/api/pharmacy/inventory/summary?${params.toString()}`
        );
        return data ?? fallbackPaginatedInventory;
      } catch (error: unknown) {
        console.error('Failed to fetch inventory summary:', error);
        // Return fallback data instead of throwing to prevent component crash
        return fallbackPaginatedInventory;
      }
    },
    // Keep previous data while fetching new data to prevent flickering
    placeholderData: (previousData) => previousData,
  });
}

// Hook to fetch available categories
export function useInventoryCategories() {
  return useQuery({
    queryKey: ['inventory', 'categories'],
    queryFn: async () => {
      try {
        const { data } = await api.get<string[]>('/api/pharmacy/inventory/categories');
        return data ?? [];
      } catch (error) {
        console.warn('Failed to fetch inventory categories:', error);
        return [];
      }
    },
  });
}

export function useInventoryEntries() {
  return useQuery({
    queryKey: ['inventory', 'entries'],
    queryFn: async () => {
      try {
        const { data } = await api.get<InventoryEntry[]>('/api/pharmacy/inventory');
        return data ?? [];
      } catch (error) {
        console.warn('Failed to fetch pharmacy inventory entries:', error);
        return [];
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
