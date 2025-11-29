'use client'

import { mockReports } from '@/lib/mock/admin'
import type { Report, ReportType } from '@/types/admin'

interface UseReportsResult {
  reports: Record<ReportType, Report>
  loading: boolean
}

export function useReports(): UseReportsResult {
  return {
    reports: mockReports,
    loading: false,
  }
}