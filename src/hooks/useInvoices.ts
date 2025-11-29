'use client'

import { useMemo } from 'react'
import { mockInvoices } from '@/lib/mock/billing'
import type { Invoice } from '@/types/billing'

interface UseInvoicesFilters {
  status?: string
  patientId?: string
}

export function useInvoices(filters: UseInvoicesFilters = {}) {
  const invoices = useMemo(() => {
    let data = [...mockInvoices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (filters.status) {
      data = data.filter((inv) => inv.status === filters.status)
    }
    if (filters.patientId) {
      data = data.filter((inv) => inv.patientId === filters.patientId)
    }
    return data
  }, [filters])

  const pending = useMemo(
    () => invoices.filter((inv) => inv.status === 'pending'),
    [invoices]
  )

  const stats = useMemo(() => {
    const paidInvoices = mockInvoices.filter((inv) => inv.status === 'paid')
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const pendingAmount = pending.reduce((sum, inv) => sum + inv.patientDue, 0)
    return {
      pendingCount: pending.length,
      totalRevenue,
      pendingAmount,
    }
  }, [pending])

  return {
    invoices,
    pending,
    stats,
    loading: false,
  }
}