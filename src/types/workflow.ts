export type VisitWorkflowStage =
  | 'ARRIVAL'
  | 'REGISTER'
  | 'TRIAGE'
  | 'ENCOUNTER'
  | 'TREATMENT'
  | 'DISCHARGE'

export interface IntakeDocumentMetadata {
  type: string
  name: string
  notes?: string
}

export interface AfterVisitMedicationItem {
  drugRequestId: string
  drugRequestItemIndex: number
  drugName: string
  dose?: string | null
  route?: string | null
  frequency?: string | null
  duration?: string | null
  decision?: string | null
  decisionNote?: string | null
  lastDocumentedAt?: string | null
  lastAdministrationStatus?: string | null
}

export interface AfterVisitSummaryPayload {
  summary?: string
  instructions?: string
  followUpPlan?: string
  handoffSummary?: string
  sourceAdmissionId?: string
  generatedAt?: string
  medicationsToContinue?: AfterVisitMedicationItem[]
  medicationsToStop?: AfterVisitMedicationItem[]
}

export interface GeneratedAfterVisitSummary {
  admissionId: string
  patientId: string
  patientName?: string | null
  summary: string
  instructions: string
  followUpPlan: string
  handoffSummary?: string | null
  followUpAppointmentId?: string | null
  generatedAt: string
  medicationsToContinue: AfterVisitMedicationItem[]
  medicationsToStop: AfterVisitMedicationItem[]
}

export interface PrintableAfterVisitDocument {
  admissionId: string
  patientId: string
  patientName?: string | null
  patientNationalId?: string | null
  facilityName?: string | null
  facilityTagline?: string | null
  documentTitle: string
  documentReference: string
  generatedAt: string
  hashAlgorithm?: string | null
  auditHash?: string | null
  admittedAt?: string | null
  dischargedAt?: string | null
  clinicalDischargeApprovedAt?: string | null
  wardName?: string | null
  bedNumber?: string | null
  summary: string
  instructions: string
  followUpPlan: string
  medicationHandoffSummary?: string | null
  medicationReconciledByName?: string | null
  medicationReconciledByRole?: string | null
  medicationReconciledAt?: string | null
  clinicalDischargeApprovedByName?: string | null
  clinicalDischargeApprovedByRole?: string | null
  followUpAppointmentId?: string | null
  followUpScheduledAt?: string | null
  followUpDoctorName?: string | null
  nursingDischargePreparedByName?: string | null
  nursingDischargePreparedByRole?: string | null
  nursingDischargePreparedAt?: string | null
  medicationsToContinue: AfterVisitMedicationItem[]
  medicationsToStop: AfterVisitMedicationItem[]
}

export interface PatientIntakeRecord {
  id: string
  patientId: string
  appointmentId?: string | null
  intakeStatus: string
  eligibilityStatus: string
  eligibilityNotes?: string | null
  intakeDocuments: IntakeDocumentMetadata[]
  afterVisitSummary: AfterVisitSummaryPayload
  checkedInAt?: string | null
  checkedOutAt?: string | null
  followUpAppointmentId?: string | null
  notes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UpdatePatientIntakeRecordInput {
  appointmentId?: string
  intakeStatus?: string
  eligibilityStatus?: string
  eligibilityNotes?: string
  intakeDocuments?: IntakeDocumentMetadata[]
  afterVisitSummary?: AfterVisitSummaryPayload
  checkedInAt?: string
  checkedOutAt?: string
  followUpAppointmentId?: string
  notes?: string
}

export interface VisitWorkflowStatus {
  patientId: string
  intakeRecordId?: string | null
  queueEntryId?: string | null
  activeAdmissionId?: string | null
  latestVitalsId?: string | null
  latestConsultationId?: string | null
  followUpAppointmentId?: string | null
  currentStage: VisitWorkflowStage
  stageOwnerRole: string
  dischargeReady: boolean
  completedCheckpoints: string[]
  pendingCheckpoints: string[]
  blockers: string[]
  labOrderIds: string[]
  imagingOrderIds: string[]
  invoiceIds: string[]
}

export interface DischargeReadiness {
  admissionId: string
  patientId: string
  ready: boolean
  ownerRole: string
  completedCheckpoints: string[]
  pendingCheckpoints: string[]
  blockers: string[]
}
