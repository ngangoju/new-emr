export interface Consultation {
  id: string
  patientId: string
  status: 'draft' | 'in_progress' | 'completed'
  startedAt: Date
  completedAt?: Date
}

export const mockConsultations: Consultation[] = [
  {
    id: 'C001',
    patientId: 'P001',
    status: 'in_progress',
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'C002',
    patientId: 'P002',
    status: 'completed',
    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
]