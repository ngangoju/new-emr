// Hospitalization/Admission Types

export interface Ward {
    id: string;
    name: string;
    floor: number;
    capacity: number;
    status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
}

export interface Bed {
    id: string;
    wardId: string;
    wardName?: string;
    bedNumber: string;
    status: 'available' | 'occupied' | 'maintenance';
    createdAt?: string;
    updatedAt?: string;
}

export interface Admission {
    id: string;
    patientId: string;
    patientName?: string;
    patientNationalId?: string;
    wardId: string;
    wardName?: string;
    bedId: string;
    bedNumber?: string;
    admittedAt: string;
    dischargedAt?: string | null;
    admittedBy: string;
    admittedByName?: string;
    reason: string;
    diagnosis?: string;
    notes?: string;
    status: 'admitted' | 'discharged' | 'transferred';
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAdmissionDto {
    patientId: string;
    wardId: string;
    bedId: string;
    reason: string;
    diagnosis?: string;
    notes?: string;
}

export interface DischargePatientDto {
    dischargeNotes?: string;
}

export interface TransferPatientDto {
    newBedId: string;
    reason?: string;
}

export interface AdmissionFilters {
    patientId?: string;
    wardId?: string;
    status?: 'admitted' | 'discharged' | 'transferred';
    dateFrom?: string;
    dateTo?: string;
}

export interface WardWithBeds extends Ward {
    beds: Bed[];
    availableBeds: number;
    occupiedBeds: number;
}
