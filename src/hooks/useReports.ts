import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Report, ReportType } from '@/types/admin'

interface UseReportsResult {
  reports: Partial<Record<ReportType, Report>>
  loading: boolean
}

export function useReports(): UseReportsResult {
  const { data: financial, isLoading: loadingFinancial } = useQuery({
    queryKey: ['reports', 'financial'],
    queryFn: async () => {
      const { data } = await api.get<Report>('/reports/financial')
      return data
    }
  })

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['reports', 'patient'],
    queryFn: async () => {
      const { data } = await api.get<Report>('/reports/patient')
      return data
    }
  })

  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['reports', 'usage'],
    queryFn: async () => {
      const { data } = await api.get<Report>('/reports/usage')
      return data
    }
  })

  return {
    reports: {
      financial,
      patient,
      usage,
    },
    loading: loadingFinancial || loadingPatient || loadingUsage,
  }
}