import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { InsuranceClaim, CreateClaimInput, UpdateClaimStatusInput } from '@/types/insurance'
import toast from 'react-hot-toast'

export function useClaims(status?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['claims', status],
    queryFn: async () => {
      const endpoint = status ? `/api/billing/claims?status=${status}` : '/api/billing/claims'
      const response = await api.get<InsuranceClaim[]>(endpoint)
      return response.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useCreateClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateClaimInput) => {
      const response = await api.post<InsuranceClaim>('/api/billing/claims', input)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Insurance claim submitted successfully')
    },
    onError: () => {
      toast.error('Failed to submit insurance claim')
    },
  })
}

export function useUpdateClaimStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ claimId, status, rejectionReason }: UpdateClaimStatusInput) => {
      // The API endpoint parameter represents query parameters for status & rejectionReason if passed according to the backend controller
      const params = new URLSearchParams()
      params.append('status', status)
      if (rejectionReason) {
        params.append('rejectionReason', rejectionReason)
      }
      const response = await api.put<InsuranceClaim>(`/api/billing/claims/${claimId}/status?${params.toString()}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Claim status updated')
    },
    onError: () => {
      toast.error('Failed to update claim status')
    },
  })
}
