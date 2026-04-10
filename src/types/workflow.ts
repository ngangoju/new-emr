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
  documentVersion?: number | null
  documentStatus?: string | null
  lastExportedVersion?: number | null
  lastExportedAt?: string | null
  reissueRequired?: boolean | null
  hashAlgorithm?: string | null
  auditHash?: string | null
  recordedHashAlgorithm?: string | null
  recordedAuditHash?: string | null
  recordedAt?: string | null
  recordedByName?: string | null
  recordedByRole?: string | null
  auditHashMatchesRecorded?: boolean | null
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
  changesSinceLastExport?: string[] | null
  changeDetailsSinceLastExport?: AfterVisitDocumentChangeDetail[] | null
}

export interface AfterVisitDocumentChangeDetail {
  label: string
  previousValue: string
  currentValue: string
}

export interface AfterVisitDocumentAuditEntry {
  id: string
  documentReference: string
  versionNumber?: number | null
  status?: string | null
  exportFormat: string
  fileName?: string | null
  contentType: string
  hashAlgorithm: string
  auditHash: string
  recordedAt: string
  supersededAt?: string | null
  reissueReason?: string | null
  recordedByName?: string | null
  recordedByRole?: string | null
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
  /** Structured packet lifecycle state — present only when backend emits the new fields */
  packetStatus?: PacketStatus
  /** Structured handoff ownership state */
  handoffStatus?: HandoffStatus
  /** Typed role that currently owns the discharge handoff */
  responsibleRole?: DischargeHandoffRole
}

// ---------------------------------------------------------------------------
// Packet lifecycle + handoff status types
// ---------------------------------------------------------------------------

/** Whether the current chart content matches the latest exported discharge packet. */
export type PacketStatus = 'NO_EXPORT_YET' | 'MATCHES_LAST_EXPORT' | 'REISSUE_REQUIRED'

/** Which role is the active owner of the next discharge step. */
export type HandoffStatus =
  | 'DOCTOR_ACTION'
  | 'NURSE_ACTION'
  | 'BILLING_ACTION'
  | 'RECEPTION_ACTION'
  | 'READY_TO_REISSUE'
  | 'READY_TO_PRINT'

/** Discrete typed role used by the structured readiness/ownership model. */
export type DischargeHandoffRole = 'DOCTOR' | 'NURSE' | 'CASHIER' | 'RECEPTIONIST' | 'COMPLETE'

/** Whether the preview was computed from persisted chart state or a simulated unsaved payload. */
export type PreviewMode = 'CURRENT_CHART' | 'SIMULATED_DRAFT'

/** Whether the preview source was the last-saved reconciliation or an unsaved draft submitted by the caller. */
export type PreviewSource = 'persisted' | 'unsaved_reconciliation'

/**
 * Wrapper DTO returned by the preview endpoints.
 * `document` carries the full printable packet shape (identical to PrintableAfterVisitDocument),
 * while the sibling fields carry preview-specific metadata that must never appear on an exported doc.
 */
export interface AfterVisitDocumentPreview {
  document: PrintableAfterVisitDocument
  previewMode: PreviewMode
  previewSource: PreviewSource
  packetStatus: PacketStatus
  handoffStatus: HandoffStatus
  responsibleRole: string
  requiredActions: string[]
}

/**
 * Input for the POST /preview endpoint that simulates the packet impact of
 * unsaved reconciliation decisions before the doctor saves them.
 */
export interface SimulatePreviewInput {
  reconciliationItems?: Array<{
    drugRequestId: string
    drugRequestItemIndex: number
    decision: string
    decisionNote?: string
  }>
  additionalInstructions?: string
}
