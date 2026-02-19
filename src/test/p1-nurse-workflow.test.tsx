import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCreateConsultation } from '@/hooks/api/useConsultations'
import { useCreatePatientVitals } from '@/hooks/api/usePatients'

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
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
  const { api } = await import('@/lib/api')
  return api as unknown as {
    post: ReturnType<typeof vi.fn>
  }
}

describe('P1 nurse workflow endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates consultation assignment with selected doctor id', async () => {
    const apiMock = await getApiMock()
    apiMock.post.mockResolvedValueOnce({ data: { id: 'CONS-1' } })

    const { result } = renderHook(() => useCreateConsultation(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        patientId: 'PAT-1',
        doctorId: 'DOC-9',
        type: 'General',
        notes: 'Queue assignment',
      })
    })

    expect(apiMock.post).toHaveBeenCalledWith(
      '/consultations',
      expect.objectContaining({ patientId: 'PAT-1', doctorId: 'DOC-9' }),
    )
  })

  it('creates vitals record using patient vitals endpoint', async () => {
    const apiMock = await getApiMock()
    apiMock.post.mockResolvedValueOnce({ data: { id: 'VITAL-1' } })

    const { result } = renderHook(() => useCreatePatientVitals(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        patientId: 'PAT-3',
        data: {
          temperature: 37.1,
          bloodPressure: '118/76',
          heartRate: 78,
        },
      })
    })

    expect(apiMock.post).toHaveBeenCalledWith(
      '/patients/PAT-3/vitals',
      expect.objectContaining({ temperature: 37.1, bloodPressure: '118/76', heartRate: 78 }),
    )
  })
})
