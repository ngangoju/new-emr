import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateDrugStock } from '@/hooks/useDrugStock'
import {
  useCreateTariff,
  useDeleteTariff,
  useUpdateTariff,
  useUpdateTariffPrice,
} from '@/hooks/useTariffManagement'
import { useTariffs } from '@/hooks/useTariffs'
import { useUploadResult } from '@/hooks/useLabOrders'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
  },
  apiRequest: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

async function getApiMock() {
  const module = await import('@/lib/api')
  return {
    api: module.api as unknown as {
      get: ReturnType<typeof vi.fn>
      post: ReturnType<typeof vi.fn>
      request: ReturnType<typeof vi.fn>
    },
    apiRequest: module.apiRequest as unknown as ReturnType<typeof vi.fn>,
  }
}

describe('P0 contract alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses /api/pharmacy/stock/in for stock intake create', async () => {
    const { api } = await getApiMock()
    api.post.mockResolvedValueOnce({ data: { id: 'S-1' } })

    const { result } = renderHook(() => useCreateDrugStock(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        name: 'Amoxicillin',
        batchNumber: 'B-1',
        quantity: 10,
        expiryDate: '2027-01-01',
        supplier: 'Supplier',
      })
    })

    expect(api.post).toHaveBeenCalledWith('/api/pharmacy/stock/in', expect.any(Object))
  })

  it('uses /api/billing/tariffs paths for tariff CRUD + price update', async () => {
    const { apiRequest } = await getApiMock()
    apiRequest.mockResolvedValue({ data: { id: 'T-1' } })

    const wrapper = createWrapper()
    const create = renderHook(() => useCreateTariff(), { wrapper })
    const update = renderHook(() => useUpdateTariff(), { wrapper })
    const del = renderHook(() => useDeleteTariff(), { wrapper })
    const patchPrice = renderHook(() => useUpdateTariffPrice(), { wrapper })

    await act(async () => {
      await create.result.current.createTariff({
        serviceName: 'Consult',
        billingCode: 'C-1',
        category: 'CONSULTATION',
        basePrice: 1000,
      })
      await update.result.current.updateTariff({
        id: 'T-1',
        input: { serviceName: 'Consult 2', basePrice: 1500 },
      })
      await del.result.current.deleteTariff('T-1')
      await patchPrice.result.current.updateTariffPrice({
        id: 'T-1',
        input: { basePrice: 2000, privatePrice: 2500, rssbMmiPrice: 1800 },
      })
    })

    expect(apiRequest).toHaveBeenNthCalledWith(1, 'POST', '/api/billing/tariffs', expect.any(Object))
    expect(apiRequest).toHaveBeenNthCalledWith(2, 'PUT', '/api/billing/tariffs/T-1', expect.any(Object))
    expect(apiRequest).toHaveBeenNthCalledWith(3, 'DELETE', '/api/billing/tariffs/T-1')
    expect(apiRequest).toHaveBeenNthCalledWith(4, 'PATCH', '/api/billing/tariffs/T-1/price', expect.any(Object))
  })

  it('uses /api/tariffs list/search/category for read paths', async () => {
    const { api } = await getApiMock()
    api.get.mockResolvedValue({ data: [] })

    const wrapper = createWrapper()

    renderHook(() => useTariffs(), { wrapper })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/tariffs'))

    renderHook(() => useTariffs({ search: 'cbc' }), { wrapper })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/tariffs/search?searchTerm=cbc'))

    renderHook(() => useTariffs({ category: 'LAB' }), { wrapper })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/tariffs/category/LAB'))
  })

  it('uses /lab-orders/{id}/results/submit for lab result submission', async () => {
    const { api } = await getApiMock()
    api.post.mockResolvedValueOnce({ data: { orderId: 'LAB-1', status: 'approved', result: {} } })

    const { result } = renderHook(() => useUploadResult(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.uploadResult({
        orderId: 'LAB-1',
        result: { status: 'normal' },
        markAsFinal: true,
      })
    })

    expect(api.post).toHaveBeenCalledWith(
      '/lab-orders/LAB-1/results/submit',
      expect.objectContaining({
        result: { status: 'normal' },
        markAsFinal: true,
      }),
    )
  })
})
