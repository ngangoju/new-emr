'use client'

import { useMemo, useCallback } from 'react'
import { mockPayments } from '@/lib/mock/billing'
import type { Payment } from '@/types/billing'
import type { CreatePaymentInput } from '@/types/billing'

export function usePayments(invoiceId?: string) {
  const payments = useMemo(() => {
    if (!invoiceId) return []
    return mockPayments.filter((p) => p.invoiceId === invoiceId)
  }, [invoiceId])

  return {
    payments,
    loading: false,
  }
}

export function useCreatePayment() {
  const createPayment = useCallback((input: CreatePaymentInput) => {
    console.log('Mock create payment:', input)
    // TODO: POST to API, invalidate useInvoices
    alert('Payment processed successfully! (mock)')
  }, [])

  return { createPayment }
}