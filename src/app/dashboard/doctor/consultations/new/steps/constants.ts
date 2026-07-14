import { User, Activity, Stethoscope, Pill, FileText, Eye, type LucideIcon } from 'lucide-react'

export interface WizardStep {
  id: number
  name: string
  icon: LucideIcon
  fields: string[]
  role: string
}

export const STEPS: WizardStep[] = [
  { id: 1, name: 'Patient Selection', icon: User, fields: ['patientId'], role: 'DOCTOR' },
  { id: 2, name: 'Chief Complaint', icon: FileText, fields: ['chiefComplaint', 'history'], role: 'DOCTOR' },
  { id: 3, name: 'Vitals & Examination', icon: Activity, fields: ['examination'], role: 'DOCTOR' },
  { id: 4, name: 'Diagnosis', icon: Stethoscope, fields: ['diagnosis'], role: 'DOCTOR' },
  { id: 5, name: 'Treatment Plan', icon: Pill, fields: ['medications', 'labTests', 'followUp'], role: 'DOCTOR' },
  { id: 6, name: 'Review & Submit', icon: Eye, fields: [], role: 'DOCTOR' },
]

export const LAB_TEST_OPTIONS = [
  'Complete Blood Count (CBC)',
  'Blood Glucose',
  'Urinalysis',
  'Lipid Profile',
  'Liver Function Test',
  'Kidney Function Test',
  'Malaria Test',
  'HIV Rapid Test',
]
