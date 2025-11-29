'use client'

import type { Consultation } from '@/lib/mock/consultations'
import { mockConsultations } from '@/lib/mock/consultations'

export function useConsultations() {
  return {
    consultations: mockConsultations as Consultation[],
    loading: false,
  }
}