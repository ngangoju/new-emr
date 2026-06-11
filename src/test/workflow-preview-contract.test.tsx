import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAfterVisitDocumentPreview,
  useSimulateAfterVisitDocumentPreview,
} from '@/hooks/useWorkflow'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
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
  const apiModule = await import('@/lib/api')
  return apiModule.api as unknown as {
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
  }
}

describe('workflow preview contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses GET /api/workflow/admissions/{id}/after-visit-document/preview for persisted packet preview', async () => {
    const api = await getApiMock()
    api.get.mockResolvedValueOnce({
      data: {
        packetStatus: 'MATCHES_LAST_EXPORT',
        handoffStatus: 'READY_TO_PRINT',
        responsibleRole: 'RECEPTIONIST',
        requiredActions: [],
        document: {},
      },
    })

    const { result } = renderHook(() => useAfterVisitDocumentPreview('ADM-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.data?.packetStatus).toBe('MATCHES_LAST_EXPORT'))
    expect(api.get).toHaveBeenCalledWith('/api/workflow/admissions/ADM-1/after-visit-document/preview')
  })

  it('uses POST /api/workflow/admissions/{id}/after-visit-document/preview for simulated packet preview', async () => {
    const api = await getApiMock()
    api.post.mockResolvedValueOnce({
      data: {
        packetStatus: 'REISSUE_REQUIRED',
        handoffStatus: 'READY_TO_REISSUE',
        responsibleRole: 'DOCTOR',
        requiredActions: ['Review unsaved discharge instruction changes'],
        document: {},
      },
    })

    const { result } = renderHook(() => useSimulateAfterVisitDocumentPreview('ADM-2'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync({
        additionalInstructions: 'Return tomorrow',
        reconciliationItems: [
          {
            drugRequestId: 'DR-1',
            drugRequestItemIndex: 0,
            decision: 'STOP',
          },
        ],
      })
    })

    expect(api.post).toHaveBeenCalledWith('/api/workflow/admissions/ADM-2/after-visit-document/preview', {
      additionalInstructions: 'Return tomorrow',
      reconciliationItems: [
        {
          drugRequestId: 'DR-1',
          drugRequestItemIndex: 0,
          decision: 'STOP',
        },
      ],
    })
  })
})
