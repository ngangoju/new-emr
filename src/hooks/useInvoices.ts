import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Invoice, CreateInvoiceInput } from '@/types/billing'

interface UseInvoicesFilters {
  status?: string
  patientId?: string
  doctorId?: string
  date?: string
}

export function useInvoices(filters: UseInvoicesFilters = {}) {
  const normalizeStatus = (value: unknown) => String(value ?? '').trim().toUpperCase()

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.patientId) params.append('patientId', filters.patientId)
      if (filters.doctorId) params.append('doctorId', filters.doctorId)
      if (filters.date) params.append('date', filters.date)

      const queryString = params.toString()
      const url = `/invoices${queryString ? `?${queryString}` : ''}`

      const { data } = await api.get<Invoice[]>(url)

      return (data ?? []).map((invoice) => {
        const patientFullName =
          invoice.patient?.fullName || (invoice as unknown as { patientName?: string }).patientName || 'Unknown'
        const patientNationalId =
          invoice.patient?.nationalId || (invoice as unknown as { patientNationalId?: string }).patientNationalId || '—'

        return {
          ...invoice,
          doctorName: invoice.doctorName || (invoice as unknown as { doctor_name?: string }).doctor_name,
          patient: {
            ...(invoice.patient ?? {}),
            fullName: patientFullName,
            nationalId: patientNationalId,
          },
        }
      })
    }
  })

  const pending = invoices.filter((inv) => {
    const status = normalizeStatus(inv.status)
    const paymentStatus = normalizeStatus(inv.paymentStatus)

    // Pending invoices include ISSUED+UNPAID fixtures while excluding paid/void states.
    // Keep exclusions strict for any paid/void variants.
    const isVoid = status === 'VOID' || status === 'VOIDED' || status.startsWith('VOID_')
    const isPaid = status === 'PAID' || paymentStatus === 'PAID' || paymentStatus === 'OVERPAID'

    return (
      !isVoid &&
      !isPaid
    )
  })

  const today = new Date().toISOString().split('T')[0]
  const todayCount = invoices.filter((inv) => {
    const invDate = new Date(inv.createdAt).toISOString().split('T')[0]
    return invDate === today
  }).length

  const stats = {
    pendingCount: pending.length,
    totalRevenue: invoices
      .filter((inv) => inv.status.toUpperCase() === 'PAID' || inv.paymentStatus?.toUpperCase() === 'PAID')
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: pending.reduce((sum, inv) => sum + inv.patientDue, 0),
    todayCount,
  }

  return {
    invoices,
    pending,
    stats,
    loading: isLoading,
  }
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateInvoiceInput) => {
      // The backend expects items as a JSON string
      const { data } = await api.post<Invoice>('/invoices', {
        ...payload,
        items: JSON.stringify(payload.items),
        total: payload.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    }
  })
}

export function useIssueInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await api.post<Invoice>(`/api/billing/invoices/${invoiceId}/issue`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    }
  })
}

export function useVoidInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason: string }) => {
      const { data } = await api.post<Invoice>(`/api/billing/invoices/${invoiceId}/void`, null, {
        params: { reason }
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    }
  })
}

export function useInvoicePreview(payload: CreateInvoiceInput | null) {
  return useQuery({
    queryKey: ['invoice-preview', payload],
    queryFn: async () => {
      if (!payload || !payload.patientId || payload.items.length === 0) return null
      const { data } = await api.post<Invoice>('/invoices/preview', {
        ...payload,
        items: JSON.stringify(payload.items)
      })
      return data
    },
    enabled: !!payload && !!payload.patientId && payload.items.length > 0
  })
}
