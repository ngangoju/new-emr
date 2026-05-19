export type LabOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
export type LabPriority = 'ROUTINE' | 'URGENT' | 'STAT'
export type SpecimenQuality = 'ADEQUATE' | 'HEMOLYZED' | 'LIPEMIC' | 'INSUFFICIENT'

export interface PageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface PagedResponse<T> {
  data: T[]
  meta: PageMeta
}

export interface LabWorklistItem {
  id: string
  patientId: string
  patientName: string
  testName: string
  priority: LabPriority
  orderedAt: string
  orderedByDoctorName: string
  status: LabOrderStatus
}

export interface LabInpatientFollowupItem {
  id: string
  patientId: string
  patientName: string
  wardUnit: string
  testName: string
  scheduledExamDate: string
  orderedByDoctorName: string
  priority: LabPriority
  orderedAt: string
  status: LabOrderStatus
}

export interface LabOrderResultPayload {
  resultValue: string | null
  unit: string | null
  isCritical: boolean | null
  criticalNote: string | null
  specimenQuality: SpecimenQuality | null
  resultFiles: string[]
  notes: string | null
  normalRangeText: string | null
}

export interface LabOrderDetail {
  id: string
  patientId: string
  patientName: string
  consultId?: string | null
  doctorId: string
  orderedByDoctorName: string
  labTechId?: string | null
  testName: string
  priority: LabPriority
  status: LabOrderStatus
  orderedAt: string
  processedAt?: string | null
  scheduledExamDate?: string | null
  rejectionReason?: string | null
  tests?: string | null
  results?: string | null
  result: LabOrderResultPayload | null
}

export type LabOrder = LabOrderDetail

export interface LabStats {
  pending: number
  completed: number
  pendingToday: number
  completedToday: number
  followupsDueNow: number
}

export interface LabResult {
  values?: Record<string, number>
  structuredValues?: Record<string, number>
  text?: string
  files?: string[]
  status?: 'normal' | 'abnormal' | 'critical'
  comment?: string
  tech?: string
  completedAt?: Date
}

export interface LabResultFinalizeRequest {
  resultValue: string
  unit?: string
  isCritical: boolean
  criticalNote?: string
  specimenQuality: SpecimenQuality
  resultFiles?: string[]
  notes?: string
  normalRangeText?: string
}

export interface LegacyLabResultFinalizeInput {
  orderId: string
  result: LabResult
  markAsFinal: boolean
}

export interface LabResultSubmissionResponse {
  orderId: string
  orderStatus: LabOrderStatus
  resultStatus: string
  finalized: boolean
  processedAt?: string | null
  approvedAt?: string | null
  processedBy?: string | null
  approvedBy?: string | null
  results?: string | null
}

export interface RangeBoundary {
  low?: number
  high?: number
}

export interface LabPanelParameter {
  code: string
  name: string
  unit?: string
  sequence: number
  referenceRange?: RangeBoundary
  criticalRange?: RangeBoundary
}

export interface LabPanelDefinition {
  id: string
  name: string
  parameters: LabPanelParameter[]
}

export interface FinalizeStructuredResultPayload {
  values: Record<string, number>
}
