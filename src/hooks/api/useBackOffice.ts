import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { api } from "@/lib/api"

type ApiErrorPayload = { response?: { data?: { message?: string } } }
function apiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiErrorPayload).response?.data?.message || fallback
}

// === Assets ===

export interface Asset {
  id: string
  tag?: string | null
  category?: string | null
  locationWard?: string | null
  status?: string | null
  purchaseDate?: string | null
  warrantyExpiry?: string | null
  serialNumber?: string | null
  manufacturer?: string | null
  model?: string | null
  notes?: string | null
}

export interface CreateAssetRequest {
  tag: string
  category: string
  locationWard?: string
  status?: string
  purchaseDate?: string
  warrantyExpiry?: string
  serialNumber?: string
  manufacturer?: string
  model?: string
  notes?: string
}

export function useAssetsByCategory(category?: string) {
  return useQuery({
    queryKey: ["assets", "category", category],
    queryFn: async () => {
      const { data } = await api.get<Asset[]>(
        `/api/backoffice/assets/category/${category ?? "ALL"}`,
      )
      return data
    },
  })
}

export function useAssetsByStatus(status?: string) {
  return useQuery({
    queryKey: ["assets", "status", status],
    queryFn: async () => {
      const { data } = await api.get<Asset[]>(
        `/api/backoffice/assets/status/${status ?? "ACTIVE"}`,
      )
      return data
    },
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateAssetRequest) => {
      const { data } = await api.post<Asset>("/api/backoffice/assets", request)
      return data
    },
    onSuccess: () => {
      toast.success("Asset created")
      queryClient.invalidateQueries({ queryKey: ["assets"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to create asset"))
    },
  })
}

export function useUpdateAssetStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: string }) => {
      const { data } = await api.put<Asset>(
        `/api/backoffice/assets/${assetId}/status?status=${encodeURIComponent(status)}`,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Asset status updated")
      queryClient.invalidateQueries({ queryKey: ["assets"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to update asset"))
    },
  })
}

// === Maintenance ===

export interface AssetMaintenance {
  id: string
  assetId?: string | null
  scheduledAt?: string | null
  completedAt?: string | null
  maintenanceType?: string | null
  description?: string | null
  technicianId?: string | null
  cost?: number | null
  status?: string | null
  notes?: string | null
}

export interface CreateMaintenanceRequest {
  assetId: string
  scheduledAt: string
  maintenanceType?: string
  description?: string
  technicianId?: string
  cost?: number
}

export function usePendingMaintenance() {
  return useQuery({
    queryKey: ["maintenance", "pending"],
    queryFn: async () => {
      const { data } = await api.get<AssetMaintenance[]>(
        "/api/backoffice/maintenance/pending",
      )
      return data
    },
  })
}

export function useScheduleMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateMaintenanceRequest) => {
      const { data } = await api.post<AssetMaintenance>(
        "/api/backoffice/maintenance",
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Maintenance scheduled")
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to schedule maintenance"))
    },
  })
}

export interface CompleteMaintenanceRequest {
  maintenanceId: string
  completedAt: string
  notes?: string
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CompleteMaintenanceRequest) => {
      const { data } = await api.post<AssetMaintenance>(
        "/api/backoffice/maintenance/complete",
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Maintenance completed")
      queryClient.invalidateQueries({ queryKey: ["maintenance"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to complete maintenance"))
    },
  })
}

// === Ambulance dispatches ===

export interface AmbulanceDispatch {
  id: string
  vehicleId?: string | null
  crewIds?: string[] | null
  destination?: string | null
  destinationCoords?: string | null
  departureTime?: string | null
  arrivalTime?: string | null
  patientId?: string | null
  status?: string | null
  notes?: string | null
}

export interface CreateDispatchRequest {
  vehicleId: string
  crewIds?: string[]
  destination?: string
  destinationCoords?: string
  patientId?: string
  notes?: string
}

export function useActiveDispatches() {
  return useQuery({
    queryKey: ["dispatches", "active"],
    queryFn: async () => {
      const { data } = await api.get<AmbulanceDispatch[]>(
        "/api/backoffice/dispatches/active",
      )
      return data
    },
  })
}

export function useDispatchAmbulance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateDispatchRequest) => {
      const { data } = await api.post<AmbulanceDispatch>(
        "/api/backoffice/dispatches",
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Ambulance dispatched")
      queryClient.invalidateQueries({ queryKey: ["dispatches"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to dispatch ambulance"))
    },
  })
}

export interface UpdateDispatchRequest {
  dispatchId: string
  departureTime?: string
  arrivalTime?: string
  status?: string
}

export function useUpdateDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: UpdateDispatchRequest) => {
      const { data } = await api.put<AmbulanceDispatch>(
        `/api/backoffice/dispatches/${request.dispatchId}`,
        request,
      )
      return data
    },
    onSuccess: () => {
      toast.success("Dispatch updated")
      queryClient.invalidateQueries({ queryKey: ["dispatches"] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "Failed to update dispatch"))
    },
  })
}
