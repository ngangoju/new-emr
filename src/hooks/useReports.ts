import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import type { Report, ReportType } from '@/types/admin'

export type ReportExportFormat = 'csv' | 'json'

export interface ReportExportResponse {
  reportType: ReportType
  format: ReportExportFormat
  contentType: string
  fileName?: string
  download: string | Record<string, unknown>
}

interface UseReportsResult {
  reports: Partial<Record<ReportType, Report | null>>
  loading: boolean
}

export function useReports(): UseReportsResult {
  const { data: financial, isLoading: loadingFinancial } = useQuery({
    queryKey: ['reports', 'financial'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Report>('/reports/financial')
        return data ?? null
      } catch (error) {
        console.warn('Failed to fetch financial report:', error)
        return null
      }
    }
  })

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['reports', 'patient'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Report>('/reports/patient')
        return data ?? null
      } catch (error) {
        console.warn('Failed to fetch patient report:', error)
        return null
      }
    }
  })

  const { data: usage, isLoading: loadingUsage } = useQuery({
    queryKey: ['reports', 'usage'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Report>('/reports/usage')
        return data ?? null
      } catch (error) {
        console.warn('Failed to fetch usage report:', error)
        return null
      }
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

function triggerDownload(filename: string, contentType: string, content: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function useExportReport() {
  const { mutateAsync: exportReport, isPending: exporting } = useMutation({
    mutationFn: async ({
      reportType,
      format,
    }: {
      reportType: ReportType
      format: ReportExportFormat
    }) => {
      const { data } = await api.get<ReportExportResponse>(
        `/reports/${reportType}/export?format=${format}`,
      )
      return data
    },
    onSuccess: (payload) => {
      const format = payload.format || 'json'
      const fileName = payload.fileName || `${payload.reportType}-report.${format}`
      const contentType = payload.contentType || (format === 'csv' ? 'text/csv' : 'application/json')

      if (typeof payload.download === 'string') {
        triggerDownload(fileName, contentType, payload.download)
      } else {
        const content = JSON.stringify(payload.download, null, 2)
        triggerDownload(fileName, contentType, content)
      }

      toast.success(`Exported ${payload.reportType} report (${format.toUpperCase()}).`)
    },
    onError: (error) => {
      console.error('Failed to export report:', error)
    },
  })

  return { exportReport, exporting }
}
