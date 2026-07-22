import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PatientAiSnapshot {
  patientId: string
  summary: string
  generatedAt: string
  model: string
  disclaimer: string
}

export function usePatientSnapshot(patientId: string | undefined) {
  return useQuery<PatientAiSnapshot>({
    queryKey: ['patient', patientId, 'ai-snapshot'],
    queryFn: async () => {
      if (!patientId) throw new Error('Patient ID is required')
      const response = await api.get<PatientAiSnapshot>(`/patients/${patientId}/ai-snapshot`)
      return response.data
    },
    enabled: Boolean(patientId),
    staleTime: 15 * 60 * 1000, // 15 minutes cache
  })
}
