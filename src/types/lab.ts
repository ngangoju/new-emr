export interface LabOrder {
  id: string
  consultationId: string
  patientId: string
  patientName: string
  testType: 'NFS' | 'CBC' | 'Urine' | 'XRay' | 'CT' | 'Generic'
  status: 'pending' | 'completed'
  priority: 'normal' | 'high' | 'urgent'
  orderedBy: string
  orderedAt: Date
  results?: LabResult
}

export interface LabResult {
  values?: Record<string, number>
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
