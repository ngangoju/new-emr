export interface Address {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

export interface Insurance {
  provider: string;
  cardNumber: string;
  copayPercentage: number;
}

export interface Patient {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  address: Address;
  insurance: Insurance;
  allergies: string[];
  bloodGroup?: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  lastVisit?: Date;
}

export interface Vitals {
  id: string;
  patientId: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  recordedAt: Date;
  recordedBy: string;
}

export interface MedicalEvent {
  id: string;
  patientId: string;
  type: 'visit' | 'lab' | 'medication' | 'procedure' | 'diagnosis';
  title: string;
  description?: string;
  date: Date;
  doctor?: string;
}

export type PatientFilters = {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  assignedDoctor?: string;
  page?: number;
  limit?: number;
};

export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'lastVisit'> & {
  dateOfBirth: string; // ISO string for form
};

export type UpdateVitalsInput = Omit<Vitals, 'id' | 'patientId'>;