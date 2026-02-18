import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import type { Payment } from '@/types/billing'
import type { CreatePaymentInput } from '@/types/billing'
import type { CashCloseSummary, CreateCashCloseInput, CashCloseHistoryFilters } from '@/types/billing'

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

  const { mutateAsync: createPayment, isPending } = useMutation({
    mutationFn: async (input: CreatePaymentInput) => {
      const { data } = await api.post<Payment>('/api/billing/payments', input)
      return data
    },
    onSuccess: () => {
      // Invalidate payments and invoices queries
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Payment processed successfully.')
    },
    onError: (error) => {
      console.error('Failed to create payment:', error)
    }
  })

  return { createPayment, creating: isPending }
}

export function useCreateCashClose() {
  const queryClient = useQueryClient()

  const { mutateAsync: createCashClose, isPending } = useMutation({
    mutationFn: async (input: CreateCashCloseInput) => {
      const { data } = await api.post<CashCloseSummary>('/api/billing/cash-close', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-close-history'] })
      toast.success('Cash close report generated successfully.')
    },
    onError: (error) => {
      console.error('Failed to generate cash close report:', error)
    }
  })

  return { createCashClose, creatingCashClose: isPending }
}

export function useCashCloseHistory(filters: CashCloseHistoryFilters = {}) {
  return useQuery({
    queryKey: ['cash-close-history', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.cashierId) params.append('cashierId', filters.cashierId)
      if (filters.fromDate) params.append('fromDate', filters.fromDate)
      if (filters.toDate) params.append('toDate', filters.toDate)

      const { data } = await api.get<CashCloseSummary[]>('/api/billing/cash-close/history', {
        params: Object.fromEntries(params.entries())
      })
      return data
    }
  })
}
