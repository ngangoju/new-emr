'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PatientSnapshot {
  patientId: string
  summary: string
  generatedAt: string
  model: string
  disclaimer: string
}

export function usePatientSnapshot(patientId: string, enabled = true) {
  return useQuery({
    queryKey: ['patient', patientId, 'ai-snapshot'],
    queryFn: async (): Promise<PatientSnapshot> => {
      const { data } = await api.get<PatientSnapshot>(`/patients/${patientId}/ai-snapshot`)
      return data
    },
    enabled: !!patientId && enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  })
}