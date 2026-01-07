export interface PharmacyDashboardStats {
  totalInventoryValue: number;
  totalMedicationsInStock: number;
  lowStockCount: number;
  expiringCount: number;
  todayDispensingCount: number;
  todayDispensingRevenue: number;
  weekDispensingCount: number;
  weekDispensingRevenue: number;
}

export interface InventorySummary {
  medicationName: string;
  totalQuantity: number;
  totalValue: number;
  lowStockCount: number;
  expiringCount: number;
  category: string;
}

export interface StockAlert {
  lowStockCount: number;
  expiringCount: number;
  lowStockItems: any[]; // Define more specifically if needed
  expiringItems: any[];
}

export interface Medication {
  id: string;
  brandName: string;
  genericName: string;
  code: string;
  category: string;
  strength: string;
  form: string;
}

export interface Inventory {
  id: string;
  medicationId: string;
  quantity: number;
  unitPrice: number;
  batchNumber: string;
  expiresAt: string;
  supplier: string;
  minStockLevel: number;
}