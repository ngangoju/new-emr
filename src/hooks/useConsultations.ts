import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Consultation {
  id: string
  patientId: string
  status: 'draft' | 'in_progress' | 'completed'
  startedAt: Date
  completedAt?: Date
}

export function useConsultations(patientId?: string) {
  return useQuery({
    queryKey: ['consultations', patientId],
    queryFn: async () => {
      const params = patientId ? `?patientId=${patientId}` : ''
      const { data } = await api.get<Consultation[]>(`/consultations${params}`)
      return data
    }
  })
}