'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import type { CreateInvoiceInput, Invoice } from '@/types/billing'
import type { CreateQueueEntry, QueueEntry } from '@/hooks/useQueue'

interface CreateReceptionVisitInput {
  invoice: CreateInvoiceInput
  queue: CreateQueueEntry
}

interface ReceptionVisit {
  invoice: Invoice
  queueEntry: QueueEntry
}

export function useRegisterReceptionVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateReceptionVisitInput) => {
      const invoiceItems = payload.invoice.items
      const { data } = await api.post<ReceptionVisit>('/api/reception/visits', {
        invoice: {
          ...payload.invoice,
          items: JSON.stringify(invoiceItems),
          total: invoiceItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
        },
        queue: payload.queue,
      })
      return data
    },
    onSuccess: () => {
      toast.success('Patient checked in')
      queryClient.invalidateQueries({ queryKey: ['queue'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
