'use client'

import type { ICD10Code } from '@/lib/mock/icd10'
import { mockICD10 } from '@/lib/mock/icd10'

export function useICD10() {
  return {
    icd10: mockICD10 as ICD10Code[],
    loading: false,
  }
}