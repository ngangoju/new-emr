import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Invoice } from '@/types/billing'

interface UseInvoicesFilters {
  status?: string
  patientId?: string
}

export function useInvoices(filters: UseInvoicesFilters = {}) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.patientId) params.append('patientId', filters.patientId)

      const queryString = params.toString()
      const url = `/invoices${queryString ? `?${queryString}` : ''}`

      const { data } = await api.get<Invoice[]>(url)
      return data
    }
  })

  const pending = invoices.filter((inv) => inv.status === 'pending')

  const stats = {
    pendingCount: pending.length,
    totalRevenue: invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: pending.reduce((sum, inv) => sum + inv.patientDue, 0),
  }

  return {
    invoices,
    pending,
    stats,
    loading: isLoading,
  }
}