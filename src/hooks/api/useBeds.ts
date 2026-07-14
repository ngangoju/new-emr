import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

export interface OccupancySummary {
  wardId: string
  wardName: string
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  maintenanceBeds: number
  reservedBeds: number
  occupancyRatePercent: number
}

export interface Bed {
  id: string
  wardId: string
  bedNumber: string
  status: string
}

export interface Ward {
  id: string
  name: string
  floor?: number | null
  capacity?: number | null
  status: string
}

export function useBeds() {
  return useQuery({
    queryKey: ['beds'],
    queryFn: async () => {
      const { data } = await api.get<Bed[]>('/api/beds')
      return data
    },
  })
}

export function useWards() {
  return useQuery({
    queryKey: ['wards'],
    queryFn: async () => {
      const { data } = await api.get<Ward[]>('/api/beds/wards')
      return data
    },
  })
}

export interface BedTransfer {
  id: string
  admissionId: string
  fromBedId: string
  fromWardId: string
  toBedId: string
  toWardId: string
  reason?: string | null
  transferredBy: string
  occurredAt: string
}

export interface BedTransferRequest {
  admissionId: string
  toBedId: string
  reason?: string
}

type ApiErrorPayload = { response?: { data?: { message?: string } } }

export function useTransferBed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: BedTransferRequest) => {
      const { data } = await api.post<BedTransfer>('/api/beds/transfers', request)
      return data
    },
    onSuccess: () => {
      toast.success('Patient transferred to new bed')
      queryClient.invalidateQueries({ queryKey: ['occupancy-summary'] })
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      queryClient.invalidateQueries({ queryKey: ['admissions'] })
      queryClient.invalidateQueries({ queryKey: ['bed-transfers'] })
    },
    onError: (error: unknown) => {
      const message =
        (error as ApiErrorPayload).response?.data?.message || 'Failed to transfer patient'
      toast.error(message)
    },
  })
}

export function useBedTransferHistory(admissionId?: string) {
  return useQuery({
    queryKey: ['bed-transfers', admissionId],
    queryFn: async () => {
      const { data } = await api.get<BedTransfer[]>(
        `/api/beds/admissions/${admissionId}/transfers`
      )
      return data
    },
    enabled: Boolean(admissionId),
  })
}

export function useOccupancySummary() {
  return useQuery({
    queryKey: ['occupancy-summary'],
    queryFn: async () => {
      const { data } = await api.get<OccupancySummary[]>('/api/beds/occupancy-summary')
      return data
    },
  })
}
