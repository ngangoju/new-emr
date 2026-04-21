import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDryRunSafetyCheck } from '@/hooks/api/useConsultations'

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

describe('consultation safety-check api hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts dry-run payload and returns safety response', async () => {
    const { api } = await import('@/lib/api')
    const post = api.post as unknown as ReturnType<typeof vi.fn>

    post.mockResolvedValueOnce({
      data: {
        safe: false,
        interactionConflict: {
          drug1Name: 'Warfarin',
          drug2Name: 'Aspirin',
          description: 'Increased risk of major bleeding',
        },
      },
    })

    const { result } = renderHook(() => useDryRunSafetyCheck(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      patientId: 'p-1',
      formularyId: 'f-1',
      activeFormularyIds: ['f-2'],
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(post).toHaveBeenCalledWith('/api/consultations/safety-check', {
      patientId: 'p-1',
      formularyId: 'f-1',
      activeFormularyIds: ['f-2'],
    })
    expect(result.current.data?.safe).toBe(false)
    expect(result.current.data?.interactionConflict?.drug1Name).toBe('Warfarin')
  })
})

