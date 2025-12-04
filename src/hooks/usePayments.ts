import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Payment } from '@/types/billing'
import type { CreatePaymentInput } from '@/types/billing'

export function usePayments(invoiceId?: string) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return []
      const { data } = await api.get<Payment[]>(`/api/billing/payments/invoice/${invoiceId}`)
      return data
    },
    enabled: !!invoiceId
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()

  const { mutate: createPayment, isPending } = useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      const { data } = await api.post('/api/billing/payments', input)
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate payments and invoices queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (error) => {
      console.error('Failed to create payment:', error)
      alert('Failed to process payment. Please try again.')
    }
  })

  return { createPayment, creating: isPending }
}