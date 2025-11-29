export interface Medication {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  category: string;
}

export interface Batch {
  id: string;
  medicationId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  manufacturedDate?: string;
  costPrice?: number;
}

export interface InventoryItem {
  medication: Medication;
  batches: Batch[];
  lowStockThreshold: number;
}

export interface PrescriptionMedication {
  medicationId: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

export interface PharmacyPrescription {
  id: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  createdAt: string;
  medications: PrescriptionMedication[];
  status: 'pending' | 'dispensed' | 'partial';
}