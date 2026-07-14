import type { AddMedicationPayload } from '@/hooks/api/useConsultations'

/**
 * Shape of the latest nurse-recorded vitals reused across the consultation
 * wizard steps. The source query is currently untyped, so this captures the
 * fields the wizard reads without widening the whole component to `any`.
 */
export interface LatestVitals {
  temperature?: number | string | null
  bloodPressure?: string | null
  heartRate?: number | string | null
  respiratoryRate?: number | string | null
  oxygenSaturation?: number | string | null
  painScore?: number | string | null
  weight?: number | string | null
  height?: number | string | null
  recordedAt: string
}

export type StructuredMed = AddMedicationPayload & {
  drugName: string
  id: string
  safetyChecked?: boolean
}
