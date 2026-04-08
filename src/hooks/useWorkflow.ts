'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import type { Admission } from '@/types/admission'
import type {
  DischargeReadiness,
  GeneratedAfterVisitSummary,
  PatientIntakeRecord,
  PrintableAfterVisitDocument,
  UpdatePatientIntakeRecordInput,
  VisitWorkflowStatus,
} from '@/types/workflow'

type ExportAfterVisitFormat = 'html' | 'json' | 'pdf'

type WorkflowExportResponse = {
  reportType: string
  format: ExportAfterVisitFormat
  fileName?: string
  contentType: string
  download: string
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

function triggerBase64Download(filename: string, contentType: string, base64Content: string) {
  const binary = atob(base64Content)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  const blob = new Blob([bytes], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function useWorkflowStatus(patientId: string) {
  return useQuery({
    queryKey: ['workflow', 'patient', patientId, 'status'],
    queryFn: async () => {
      const { data } = await api.get<VisitWorkflowStatus>(`/api/workflow/patients/${patientId}/status`)
      return data
    },
    enabled: !!patientId,
  })
}

export function usePatientIntake(patientId: string) {
  return useQuery({
    queryKey: ['workflow', 'patient', patientId, 'intake'],
    queryFn: async () => {
      const { data } = await api.get<PatientIntakeRecord>(`/api/workflow/patients/${patientId}/intake`)
      return data
    },
    enabled: !!patientId,
  })
}

export function useUpsertPatientIntake(patientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePatientIntakeRecordInput) => {
      const { data } = await api.put<PatientIntakeRecord>(`/api/workflow/patients/${patientId}/intake`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', 'patient', patientId] })
    },
  })
}

export function useGeneratedAfterVisitSummary(admissionId: string) {
  return useQuery({
    queryKey: ['workflow', 'admission', admissionId, 'after-visit-summary'],
    queryFn: async () => {
      const { data } = await api.get<GeneratedAfterVisitSummary>(
        `/api/workflow/admissions/${admissionId}/after-visit-summary`,
      )
      return data
    },
    enabled: !!admissionId,
  })
}

export function usePrintableAfterVisitDocument(admissionId: string) {
  return useQuery({
    queryKey: ['workflow', 'admission', admissionId, 'after-visit-document'],
    queryFn: async () => {
      const { data } = await api.get<PrintableAfterVisitDocument>(
        `/api/workflow/admissions/${admissionId}/after-visit-document`,
      )
      return data
    },
    enabled: !!admissionId,
  })
}

export function useExportAfterVisitDocument(admissionId: string) {
  return useMutation({
    mutationFn: async ({ format = 'html' }: { format?: ExportAfterVisitFormat } = {}) => {
      const { data } = await api.get<WorkflowExportResponse>(
        `/api/workflow/admissions/${admissionId}/after-visit-document/export`,
        { params: { format } },
      )
      return data
    },
    onSuccess: (payload) => {
      const fileName = payload.fileName || `after-visit-document.${payload.format}`
      if (payload.format === 'pdf') {
        triggerBase64Download(fileName, payload.contentType, payload.download)
      } else {
        triggerDownload(fileName, payload.contentType, payload.download)
      }
      toast.success(`Downloaded discharge packet (${payload.format.toUpperCase()}).`)
    },
  })
}

export function useDischargeReadiness(admissionId: string) {
  return useQuery({
    queryKey: ['workflow', 'admission', admissionId, 'discharge-readiness'],
    queryFn: async () => {
      const { data } = await api.get<DischargeReadiness>(
        `/api/workflow/admissions/${admissionId}/discharge-readiness`,
      )
      return data
    },
    enabled: !!admissionId,
  })
}

export function useApproveClinicalDischarge(admissionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.put<Admission>(
        `/api/workflow/admissions/${admissionId}/clinical-discharge-approval`,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', admissionId, 'discharge-prep'] })
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['workflow', 'admission', admissionId] })
      queryClient.invalidateQueries({ queryKey: ['workflow', 'patient', data.patientId] })
    },
  })
}
