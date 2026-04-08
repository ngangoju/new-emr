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
    medicationReconciliationCompleted?: boolean;
    patientEducationCompleted?: boolean;
    dischargeInstructions?: string;
    nursingProgressNotes?: string;
    followUpAppointmentId?: string | null;
    clinicalDischargeApprovedBy?: string | null;
    clinicalDischargeApprovedAt?: string | null;
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
    dischargeType?: string;
    followUpInstructions?: string;
    adminOverrideReason?: string;
}

export interface AdmissionDischargePrep {
    admissionId: string;
    medicationReconciliationCompleted?: boolean | null;
    patientEducationCompleted?: boolean | null;
    dischargeInstructions?: string | null;
    nursingProgressNotes?: string | null;
    followUpAppointmentId?: string | null;
    medicationReconciliationNotes?: string | null;
    medicationHandoffSummary?: string | null;
    nursingDischargePreparedBy?: string | null;
    nursingDischargePreparedAt?: string | null;
}

export type MedicationAdministrationStatus = 'administered' | 'held' | 'refused' | 'missed';

export interface MedicationAdministration {
    id: string;
    admissionId: string;
    patientId: string;
    drugRequestId?: string | null;
    drugRequestItemIndex?: number | null;
    drugName: string;
    dose?: string | null;
    route?: string | null;
    frequency?: string | null;
    quantity: number;
    administrationStatus: MedicationAdministrationStatus;
    administeredAt: string;
    documentedBy?: string | null;
    documentedByName?: string | null;
    notes?: string | null;
    reason?: string | null;
    createdAt?: string | null;
}

export type MedicationScheduleTaskStatus =
    | 'overdue'
    | 'due'
    | 'upcoming'
    | 'as_needed'
    | 'manual_review'
    | 'completed';

export interface MedicationScheduleEntry {
    drugRequestId: string;
    drugRequestItemIndex: number;
    drugName: string;
    dose?: string | null;
    route?: string | null;
    frequency?: string | null;
    duration?: string | null;
    scheduleType: 'scheduled' | 'as_needed' | 'manual';
    taskStatus: MedicationScheduleTaskStatus;
    anchorTime?: string | null;
    nextDueAt?: string | null;
    lastDocumentedAt?: string | null;
    lastAdministrationStatus?: MedicationAdministrationStatus | null;
    documentedDoseCount: number;
    totalPlannedDoses?: number | null;
    remainingDoseCount?: number | null;
    requestStatus: string;
}

export type MedicationReconciliationDecision = 'CONTINUE' | 'STOP';

export interface MedicationReconciliationItem {
    drugRequestId: string;
    drugRequestItemIndex: number;
    drugName: string;
    dose?: string | null;
    route?: string | null;
    frequency?: string | null;
    duration?: string | null;
    decision?: MedicationReconciliationDecision | null;
    decisionNote?: string | null;
    lastDocumentedAt?: string | null;
    lastAdministrationStatus?: MedicationAdministrationStatus | null;
    reconciledBy?: string | null;
    reconciledAt?: string | null;
}

export interface AdmissionMedicationReconciliation {
    admissionId: string;
    complete: boolean;
    additionalInstructions?: string | null;
    handoffSummary?: string | null;
    items: MedicationReconciliationItem[];
}

export interface SaveAdmissionMedicationReconciliationDto {
    additionalInstructions?: string;
    items: Array<{
        drugRequestId: string;
        drugRequestItemIndex: number;
        decision: MedicationReconciliationDecision;
        decisionNote?: string;
    }>;
}

export interface CreateMedicationAdministrationDto {
    drugRequestId?: string;
    drugRequestItemIndex?: number;
    drugName?: string;
    dose?: string;
    route?: string;
    frequency?: string;
    quantity?: number;
    administrationStatus: MedicationAdministrationStatus;
    administeredAt?: string;
    notes?: string;
    reason?: string;
    inventoryId?: string;
    scannedPatientBarcode?: string;
    scannedMedicationBarcode?: string;
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
