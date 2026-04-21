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

export interface PaginatedInventoryResponse {
  content: InventorySummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface StockAlert {
  lowStockCount: number;
  expiringCount: number;
  lowStockItems: unknown[];
  expiringItems: unknown[];
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

export interface InventoryEntry {
  id: string;
  medicationId: string;
  batchNumber: string;
  expiresAt: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  minStockLevel: number;
  medicationBrandName?: string;
  medicationGenericName?: string;
  medicationCategory?: string;
  medicationDosageForm?: string;
  medicationStrength?: string;
  isLowStock?: boolean;
  hasStock?: boolean;
  isCritical?: boolean;
  inventorySummary?: string;
}

// Extended type for UI display with nested medication details
export interface InventoryItem {
  medication: {
    id: string;
    name: string;
    genericName: string;
    strength: string;
    form: string;
    category: string;
  };
  batches: {
    id: string;
    medicationId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
  }[];
  lowStockThreshold: number;
}

// Drug Request Types
export type DrugRequestStatus = 'pending' | 'approved' | 'denied' | 'fulfilled';

export interface DrugRequestItem {
  drugId: string;
  drugName: string;
  quantity: number;
  notes?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  allergyOverrideReason?: string;
  interactionOverrideReason?: string;
}

export interface DrugRequest {
  id: string;
  patientId: string;
  patientName: string;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  requestedAtFormatted?: string;
  items: DrugRequestItem[];
  status: DrugRequestStatus;
  notes?: string;
  approvedAt?: string;
  approvedBy?: string;
  fulfilledAt?: string;
  fulfilledBy?: string;
  deniedAt?: string;
  deniedBy?: string;
  denialReason?: string;
}

export interface CreateDrugRequestInput {
  patientId: string;
  patientName: string;
  items: DrugRequestItem[];
  notes?: string;
}

export interface FulfillDrugRequestInput {
  id: string;
  notes?: string;
}

export interface DenyDrugRequestInput {
  id: string;
  reason: string;
}

export interface DrugStockEntry {
  id: string;
  name: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  supplier: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDrugStockInput {
  name: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  supplier: string;
}
