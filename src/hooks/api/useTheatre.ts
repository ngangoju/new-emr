import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

type ApiErrorPayload = { response?: { data?: { message?: string } } }

function apiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiErrorPayload).response?.data?.message || fallback
}

// === Canonical shapes matching merged /api/theatre endpoints ===

export type TheatreStatus = 'AVAILABLE' | 'IN_USE' | 'CLEANING' | 'MAINTENANCE' | 'OUT_OF_SERVICE'

export interface Theatre {
  id: string
  name: string
  location?: string | null
  status: TheatreStatus | string
}

export interface TheatreCase {
  id: string
  theatreId: string
  surgeonId?: string | null
  anaesthetistId?: string | null
  patientId?: string | null
  admissionId?: string | null
  procedureName?: string | null
  procedureCode?: string | null
  scheduledStart: string
  scheduledEnd?: string | null
  actualStart?: string | null
  actualEnd?: string | null
  status: string
  notes?: string | null
}

export interface PreopChecklistItem {
  id: string
  caseId: string
  stage: 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'
  itemName: string
  sortOrder?: number | null
  isChecked: boolean
  verifiedBy?: string | null
  verifiedAt?: string | null
  notes?: string | null
}

export interface PreopChecklistResponse {
  id: string
  scheduleId: string  // kept for backwards-compat with frontend callers
  caseId: string
  signInCompleted: boolean
  signInAt?: string | null
  timeOutCompleted: boolean
  timeOutAt?: string | null
  signOutCompleted: boolean
  signOutAt?: string | null
}

export interface OperationNote {
  id: string
  caseId: string
  procedure?: string | null
  procedurePerformed?: string | null
  findings?: string | null
  anesthesiaNotes?: string | null
  bloodLossMl?: number | null
  countsConfirmed: boolean
  signedBy?: string | null
  signedAt?: string | null
}

export interface PostOpOrder {
  id: string
  caseId: string
  consultationId?: string | null
  medicationRequestId?: string | null
  orderType: string  // MEDICATION | INVESTIGATION | PROCEDURE
  status?: string | null
}

// === Theatres catalog ===

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

// === Cases ===

export interface CreateTheatreCaseRequest {
  theatreId: string
  surgeonId: string
  anaesthetistId?: string
  patientId: string
  admissionId: string
  procedureName: string
  procedureCode?: string
  scheduledStart: string
  scheduledEnd: string
  notes?: string
}

export interface UpdateTheatreCaseRequest {
  anaesthetistId?: string
  actualStart?: string
  actualEnd?: string
  status?: string
  notes?: string
}

export function useTheatreCasesByTheatre(theatreId?: string) {
  return useQuery({
    queryKey: ['theatre-cases', 'by-theatre', theatreId],
    queryFn: async () => {
      const { data } = await api.get<TheatreCase[]>(
        `/api/theatre/cases/theatres/${theatreId}`
      )
      return data
    },
    enabled: Boolean(theatreId),
  })
}

export function useTheatreCasesBySurgeon(surgeonId?: string) {
  return useQuery({
    queryKey: ['theatre-cases', 'by-surgeon', surgeonId],
    queryFn: async () => {
      const { data } = await api.get<TheatreCase[]>(
        `/api/theatre/cases/surgeons/${surgeonId}`
      )
      return data
    },
    enabled: Boolean(surgeonId),
  })
}

export function useTheatreCasesByPatient(patientId?: string) {
  return useQuery({
    queryKey: ['theatre-cases', 'by-patient', patientId],
    queryFn: async () => {
      const { data } = await api.get<TheatreCase[]>(
        `/api/theatre/cases/patients/${patientId}`
      )
      return data
    },
    enabled: Boolean(patientId),
  })
}

export function useTheatreCasesByStatus(status?: string) {
  return useQuery({
    queryKey: ['theatre-cases', 'by-status', status],
    queryFn: async () => {
      const { data } = await api.get<TheatreCase[]>(`/api/theatre/cases/status/${status}`)
      return data
    },
    enabled: Boolean(status),
  })
}

export function useTheatreCase(caseId?: string) {
  return useQuery({
    queryKey: ['theatre-case', caseId],
    queryFn: async () => {
      const { data } = await api.get<TheatreCase>(`/api/theatre/cases/${caseId}`)
      return data
    },
    enabled: Boolean(caseId),
  })
}

export function useScheduleSurgery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateTheatreCaseRequest) => {
      const { data } = await api.post<TheatreCase>('/api/theatre/cases', request)
      return data
    },
    onSuccess: () => {
      toast.success('Surgery scheduled')
      queryClient.invalidateQueries({ queryKey: ['theatre-cases'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to schedule surgery'))
    },
  })
}

export function useUpdateTheatreCase(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: UpdateTheatreCaseRequest) => {
      const { data } = await api.put<TheatreCase>(`/api/theatre/cases/${caseId}`, request)
      return data
    },
    onSuccess: () => {
      toast.success('Case updated')
      queryClient.invalidateQueries({ queryKey: ['theatre-case', caseId] })
      queryClient.invalidateQueries({ queryKey: ['theatre-cases'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to update case'))
    },
  })
}

export function useCancelTheatreCase(caseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<TheatreCase>(`/api/theatre/cases/${caseId}`)
      return data
    },
    onSuccess: () => {
      toast.success('Case cancelled')
      queryClient.invalidateQueries({ queryKey: ['theatre-case', caseId] })
      queryClient.invalidateQueries({ queryKey: ['theatre-cases'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to cancel case'))
    },
  })
}

// === Pre-op checklist (rolled-up view, plus per-item advances) ===

export function usePreopChecklist(caseId?: string) {
  return useQuery({
    queryKey: ['preop-checklist', caseId],
    queryFn: async () => {
      const { data } = await api.get<PreopChecklistResponse>(
        `/api/theatre/cases/${caseId}/checklist`
      )
      return data
    },
    enabled: Boolean(caseId),
  })
}

export type ChecklistStage = 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'

export function useCompleteChecklistStage(caseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (stage: ChecklistStage) => {
      // The merged endpoint only requires the stage label; items are auto-seeded.
      const { data } = await api.put<PreopChecklistResponse>(
        `/api/theatre/cases/${caseId}/checklist/stage`,
        { stage }
      )
      return data
    },
    onSuccess: () => {
      toast.success('Checklist stage completed')
      queryClient.invalidateQueries({ queryKey: ['preop-checklist', caseId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to complete checklist stage'))
    },
  })
}

export interface RecordChecklistItemRequest {
  itemName: string
  notes?: string
}

export function useRecordChecklistItem(caseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: RecordChecklistItemRequest) => {
      const { data } = await api.post<PreopChecklistItem>(
        `/api/theatre/cases/${caseId}/checklist`,
        { caseId, ...request }
      )
      return data
    },
    onSuccess: () => {
      toast.success('Checklist item saved')
      queryClient.invalidateQueries({ queryKey: ['preop-checklist', caseId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to save checklist item'))
    },
  })
}

// === Operation note ===

export interface OperationNoteRequest {
  procedure: string
  findings?: string
  anesthesiaNotes?: string
  bloodLossMl?: number
  countsConfirmed: boolean
  instrumentsUsed?: string[]
  spongesUsed?: string[]
  needlesUsed?: number
}

export function useOperationNote(caseId?: string) {
  return useQuery({
    queryKey: ['operation-note', caseId],
    queryFn: async () => {
      const { data } = await api.get<OperationNote | ''>(
        `/api/theatre/cases/${caseId}/operation-note`
      )
      return data === '' ? null : data
    },
    enabled: Boolean(caseId),
  })
}

export function useWriteOperationNote(caseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: OperationNoteRequest) => {
      const { data } = await api.put<OperationNote>(
        `/api/theatre/cases/${caseId}/operation-note`,
        { caseId, ...request }
      )
      return data
    },
    onSuccess: () => {
      toast.success('Operation note saved')
      queryClient.invalidateQueries({ queryKey: ['operation-note', caseId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to save operation note'))
    },
  })
}

export function useSignOperationNote(caseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<OperationNote>(
        `/api/theatre/cases/${caseId}/operation-note/sign`
      )
      return data
    },
    onSuccess: () => {
      toast.success('Operation note signed')
      queryClient.invalidateQueries({ queryKey: ['operation-note', caseId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to sign operation note'))
    },
  })
}

// === Post-op orders ===

export interface CreatePostOpOrderRequest {
  orderType: 'MEDICATION' | 'INVESTIGATION' | 'PROCEDURE'
  consultationId?: string
  medicationRequestId?: string
  status?: string
}

export function usePostOpOrders(caseId?: string) {
  return useQuery({
    queryKey: ['post-op-orders', caseId],
    queryFn: async () => {
      const { data } = await api.get<PostOpOrder[]>(`/api/theatre/cases/${caseId}/orders`)
      return data
    },
    enabled: Boolean(caseId),
  })
}

export function useCreatePostOpOrder(caseId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreatePostOpOrderRequest) => {
      const { data } = await api.post<PostOpOrder>(
        `/api/theatre/cases/${caseId}/orders`,
        { caseId, ...request }
      )
      return data
    },
    onSuccess: () => {
      toast.success('Post-op order created')
      queryClient.invalidateQueries({ queryKey: ['post-op-orders', caseId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to create post-op order'))
    },
  })
}

// === Backwards-compatible aliases (deprecated; will be removed once consumers migrate) ===

/** @deprecated use {@link useTheatreCasesByTheatre} or {@link useTheatreCasesBySurgeon}. */
export type SurgeryScheduleEntry = TheatreCase

/** @deprecated use {@link useScheduleSurgery}. */
export function useCreateSurgerySchedule() {
  const m = useScheduleSurgery()
  return m
}

/** @deprecated use {@link useUpdateTheatreCase}. */
export function useUpdateSurgeryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.put<TheatreCase>(`/api/theatre/cases/${id}`, { status })
      return data
    },
    onSuccess: () => {
      toast.success('Case status updated')
      queryClient.invalidateQueries({ queryKey: ['theatre-cases'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to update case status'))
    },
  })
}

/** @deprecated use {@link useTheatreCasesByTheatre}. */
export function useSurgerySchedule() {
  // Return all cases grouped by theatre; the merged API does not yet expose a date-window endpoint.
  return useQuery({
    queryKey: ['surgery-schedule', 'all'],
    queryFn: async () => {
      const theatres = await api.get<Theatre[]>('/api/theatre/theatres').then((r) => r.data)
      const all: TheatreCase[] = []
      for (const t of theatres) {
        const cases = await api
          .get<TheatreCase[]>(`/api/theatre/cases/theatres/${t.id}`)
          .then((r) => r.data)
        all.push(...cases)
      }
      return all
    },
  })
}

/** @deprecated legacy shape retained as alias of {@link PreopChecklistResponse}. */
export type PreopChecklist = PreopChecklistResponse
