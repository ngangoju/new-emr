import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface BedTransfer {
  id: string
  admissionId: string
  fromBedId: string
  fromWardId: string
  toBedId: string
  toWardId: string
  reason: string | null
  transferredBy: string
  occurredAt: string
}

export interface BedTransferRequest {
  admissionId: string
  toBedId: string
  reason?: string
}

export function useBedTransfers(admissionId: string | null) {
  return useQuery({
    queryKey: ['bed-transfers', admissionId],
    queryFn: async () => {
      if (!admissionId) return []
      const { data } = await api.get<BedTransfer[]>(`/api/beds/admissions/${admissionId}/transfers`)
      return data
    },
    enabled: !!admissionId,
    staleTime: 30_000,
  })
}

export function useTransferBed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: BedTransferRequest) => {
      const { data } = await api.post<BedTransfer>('/api/beds/transfers', request)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'bed-transfers' })
    },
  })
}