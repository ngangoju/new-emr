import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { api } from "@/lib/api"

type ApiErrorPayload = { response?: { data?: { message?: string } } }
function apiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiErrorPayload).response?.data?.message || fallback
}

// === Blood units ===

export interface BloodUnit {
  id: string
  unitNumber?: string | null
  bloodGroup?: string | null
  rhFactor?: string | null
  collectedAt?: string | null
  expiryAt?: string | null
  storageLocation?: string | null
  status?: string | null
}

export interface CreateBloodUnitRequest {
  unitNumber: string
  bloodGroup: string
  rhFactor?: string
  expiryAt: string
  storageLocation?: string
}

export function useAvailableUnits() {
  return useQuery({
    queryKey: ["blood-units", "available"],
    queryFn: async () => {
      const { data } = await api.get<BloodUnit[]>("/api/bloodbank/units/available")
      return data
    },
  })
}

export function useExpiringUnits(days?: number) {
  return useQuery({
    queryKey: ["blood-units", "expiring", days],
    queryFn: async () => {
      const { data } = await api.get<BloodUnit[]>(
        `/api/bloodbank/units/expiring${days ? `?days=${days}` : ""}`,
      )
      return data
    },
  })
}

export function useCollectBloodUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateBloodUnitRequest) => {
      const { data } = await api.post<BloodUnit>("/api/bloodbank/units", request)
      return data
    },
    onSuccess: () => {
      toast.success("Blood unit collected")
      queryClient.invalidateQueries({ queryKey: ["blood-units"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to collect unit"))
    },
  })
}

export function useUpdateUnitStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ unitId, status }: { unitId: string; status: string }) => {
      const { data } = await api.put<BloodUnit>(
        `/api/bloodbank/units/${unitId}/status?status=${encodeURIComponent(status)}`,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Unit status updated")
      queryClient.invalidateQueries({ queryKey: ["blood-units"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to update unit"))
    },
  })
}

// === Crossmatch requests ===

export interface CrossmatchRequest {
  id: string
  patientId?: string | null
  requestingPhysicianId?: string | null
  urgency?: string | null
  bloodGroupRequested?: string | null
  rhFactorRequested?: string | null
  volumeMl?: number | null
  reason?: string | null
  result?: string | null
  requestedAt?: string | null
  resolvedAt?: string | null
}

export interface CreateCrossmatchRequest {
  patientId: string
  bloodGroupRequested?: string
  rhFactorRequested?: string
  urgency?: string
  volumeMl?: number
  reason?: string
}

export function usePendingCrossmatches() {
  return useQuery({
    queryKey: ["crossmatch", "pending"],
    queryFn: async () => {
      const { data } = await api.get<CrossmatchRequest[]>(
        "/api/bloodbank/crossmatch/pending",
      )
      return data
    },
  })
}

export function useCrossmatchesByPatient(patientId?: string) {
  return useQuery({
    queryKey: ["crossmatch", "patient", patientId],
    queryFn: async () => {
      const { data } = await api.get<CrossmatchRequest[]>(
        `/api/bloodbank/crossmatch/patient/${patientId}`,
      )
      return data
    },
    enabled: Boolean(patientId),
  })
}

export function useRequestCrossmatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateCrossmatchRequest) => {
      const { data } = await api.post<CrossmatchRequest>(
        "/api/bloodbank/crossmatch",
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Crossmatch requested")
      queryClient.invalidateQueries({ queryKey: ["crossmatch"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to request crossmatch"))
    },
  })
}

export interface ApproveCrossmatchRequest {
  requestId: string
  result: string // APPROVED | DENIED
  notes?: string
}

export function useApproveCrossmatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: ApproveCrossmatchRequest) => {
      const { data } = await api.post<CrossmatchRequest>(
        "/api/bloodbank/crossmatch/approve",
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Crossmatch resolved")
      queryClient.invalidateQueries({ queryKey: ["crossmatch"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to resolve crossmatch"))
    },
  })
}

// === Transfusions ===

export interface Transfusion {
  id: string
  bloodUnitId?: string | null
  patientId?: string | null
  administeredBy?: string | null
  administrationStart?: string | null
  administrationEnd?: string | null
  volumeAdministeredMl?: number | null
  bloodLossMl?: number | null
  reactionObserved?: boolean | null
  reactionDescription?: string | null
  notes?: string | null
}

export interface CreateTransfusionRequest {
  bloodUnitId: string
  patientId: string
  volumeAdministeredMl?: number
  bloodLossMl?: number
  vitalBefore?: string
  notes?: string
}

export function useTransfusionsByPatient(patientId?: string) {
  return useQuery({
    queryKey: ["transfusion", "patient", patientId],
    queryFn: async () => {
      const { data } = await api.get<Transfusion[]>(
        `/api/bloodbank/transfusions/patient/${patientId}`,
      )
      return data
    },
    enabled: Boolean(patientId),
  })
}

export function useStartTransfusion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateTransfusionRequest) => {
      const { data } = await api.post<Transfusion>(
        "/api/bloodbank/transfusions",
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Transfusion started")
      queryClient.invalidateQueries({ queryKey: ["transfusion"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to start transfusion"))
    },
  })
}

export interface CompleteTransfusionRequest {
  transfusionId: string
  volumeAdministeredMl?: number
  bloodLossMl?: number
  reactionObserved?: boolean
  reactionDescription?: string
  vitalAfter?: string
  notes?: string
}

export function useCompleteTransfusion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CompleteTransfusionRequest) => {
      const { data } = await api.post<Transfusion>(
        "/api/bloodbank/transfusions/complete",
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Transfusion completed")
      queryClient.invalidateQueries({ queryKey: ["transfusion"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to complete transfusion"))
    },
  })
}
