export interface LabOrder {
  id: string
  consultationId: string
  patientId: string
  patientName: string
  testType: 'NFS' | 'CBC' | 'Urine' | 'XRay' | 'CT' | 'Generic'
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  priority: 'normal' | 'high' | 'urgent'
  panelId?: string
  orderedBy: string
  orderedAt: Date
  rejectionReason?: string
  results?: LabResult
}

export interface LabResult {
  values?: Record<string, number>
  structuredValues?: Record<string, number>
  text?: string
  files?: string[]
  status: 'normal' | 'abnormal' | 'critical'
  comment?: string
  tech?: string
  completedAt?: Date
}

export interface LabResultFinalizeRequest {
  result: LabResult
  markAsFinal: boolean
}

export interface LabResultSubmissionResponse {
  orderId: string
  status: 'processed' | 'approved'
  result: LabResult
  submittedAt: string
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
