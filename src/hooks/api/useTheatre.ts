import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

type ApiErrorPayload = { response?: { data?: { message?: string } } }

function apiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiErrorPayload).response?.data?.message || fallback
}

export interface Theatre {
  id: string
  name: string
  location?: string | null
  status: string
}

export interface SurgeryScheduleEntry {
  id: string
  theatreId: string
  patientId?: string | null
  procedureName?: string | null
  surgeonName?: string | null
  scheduledStart: string
  scheduledEnd?: string | null
  status: string
}

export function useTheatres() {
  return useQuery({
    queryKey: ['theatres'],
    queryFn: async () => {
      const { data } = await api.get<Theatre[]>('/api/theatre/theatres')
      return data
    },
  })
}

export function useAvailableTheatres() {
  return useQuery({
    queryKey: ['theatres', 'available'],
    queryFn: async () => {
      const { data } = await api.get<Theatre[]>('/api/theatre/theatres/available')
      return data
    },
  })
}

export function useSurgerySchedule(from: string, to: string) {
  return useQuery({
    queryKey: ['surgery-schedule', from, to],
    queryFn: async () => {
      const { data } = await api.get<SurgeryScheduleEntry[]>('/api/theatre/schedule', {
        params: { from, to },
      })
      return data
    },
    enabled: !!from && !!to,
  })
}

export interface CreateSurgeryScheduleRequest {
  theatreId: string
  patientId: string
  procedureName: string
  surgeonName?: string
  scheduledStart: string
  scheduledEnd?: string
}

export interface PreopChecklist {
  id: string
  scheduleId: string
  signInCompleted: boolean
  signInAt?: string | null
  timeOutCompleted: boolean
  timeOutAt?: string | null
  signOutCompleted: boolean
  signOutAt?: string | null
}

export type ChecklistStage = 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'

export interface OperationNote {
  id: string
  scheduleId: string
  procedurePerformed: string
  findings?: string | null
  anesthesiaType?: string | null
  estimatedBloodLossMl?: number | null
  countsConfirmed: boolean
  complications?: string | null
  postopInstructions?: string | null
  signedBy?: string | null
  signedAt?: string | null
}

export interface OperationNoteRequest {
  procedurePerformed: string
  findings?: string
  anesthesiaType?: string
  estimatedBloodLossMl?: number
  countsConfirmed: boolean
  complications?: string
  postopInstructions?: string
}

export function useCreateSurgerySchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateSurgeryScheduleRequest) => {
      const { data } = await api.post<SurgeryScheduleEntry>('/api/theatre/schedule', request)
      return data
    },
    onSuccess: () => {
      toast.success('Surgery scheduled')
      queryClient.invalidateQueries({ queryKey: ['surgery-schedule'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to schedule surgery'))
    },
  })
}

export function useUpdateSurgeryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch<SurgeryScheduleEntry>(
        `/api/theatre/schedule/${id}/status`,
        null,
        { params: { status } }
      )
      return data
    },
    onSuccess: () => {
      toast.success('Case status updated')
      queryClient.invalidateQueries({ queryKey: ['surgery-schedule'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to update case status'))
    },
  })
}

export function usePreopChecklist(scheduleId?: string) {
  return useQuery({
    queryKey: ['preop-checklist', scheduleId],
    queryFn: async () => {
      const { data } = await api.get<PreopChecklist>(
        `/api/theatre/schedule/${scheduleId}/checklist`
      )
      return data
    },
    enabled: Boolean(scheduleId),
  })
}

export function useCompleteChecklistStage(scheduleId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (stage: ChecklistStage) => {
      const { data } = await api.put<PreopChecklist>(
        `/api/theatre/schedule/${scheduleId}/checklist/stage`,
        { stage, items: '{}' }
      )
      return data
    },
    onSuccess: () => {
      toast.success('Checklist stage completed')
      queryClient.invalidateQueries({ queryKey: ['preop-checklist', scheduleId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to complete checklist stage'))
    },
  })
}

export function useOperationNote(scheduleId?: string) {
  return useQuery({
    queryKey: ['operation-note', scheduleId],
    queryFn: async () => {
      const { data } = await api.get<OperationNote | ''>(
        `/api/theatre/schedule/${scheduleId}/operation-note`
      )
      return data === '' ? null : data
    },
    enabled: Boolean(scheduleId),
  })
}

export function useWriteOperationNote(scheduleId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: OperationNoteRequest) => {
      const { data } = await api.put<OperationNote>(
        `/api/theatre/schedule/${scheduleId}/operation-note`,
        request
      )
      return data
    },
    onSuccess: () => {
      toast.success('Operation note saved')
      queryClient.invalidateQueries({ queryKey: ['operation-note', scheduleId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to save operation note'))
    },
  })
}

export function useSignOperationNote(scheduleId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<OperationNote>(
        `/api/theatre/schedule/${scheduleId}/operation-note/sign`
      )
      return data
    },
    onSuccess: () => {
      toast.success('Operation note signed')
      queryClient.invalidateQueries({ queryKey: ['operation-note', scheduleId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to sign operation note'))
    },
  })
}
