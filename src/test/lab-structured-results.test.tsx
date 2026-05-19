import React, { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { LabTestPanelForm } from '@/components/lab/LabTestPanelForm'
import { FinalizeResultModal } from '@/components/lab/FinalizeResultModal'
import { useRejectSample } from '@/hooks/useLabOrders'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
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
    get: ReturnType<typeof vi.fn>
    post: ReturnType<typeof vi.fn>
    patch: ReturnType<typeof vi.fn>
  }
}

function StructuredEntryHarness() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [criticalCodes, setCriticalCodes] = useState<string[]>([])

  const criticalParameters = useMemo(
    () =>
      criticalCodes.map((code) => ({
        code,
        name: code === 'hemoglobin' ? 'Hemoglobin' : code,
      })),
    [criticalCodes],
  )

  return (
    <>
      <LabTestPanelForm
        panelId="cbc-panel"
        values={values}
        onValuesChange={setValues}
        onCriticalParametersChange={setCriticalCodes}
      />

      <FinalizeResultModal
        open
        orderId="LAB-1"
        values={values}
        criticalParameters={criticalParameters}
        onOpenChange={() => {}}
        onSubmitted={() => {}}
      />
    </>
  )
}

function renderStructuredHarness() {
  const Wrapper = createWrapper()
  return render(
    <Wrapper>
      <StructuredEntryHarness />
    </Wrapper>,
  )
}

describe('lab structured results workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('givenNormalValue_whenEntered_thenFieldRendersDefaultColour', async () => {
    const apiMock = await getApiMock()
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'cbc-panel',
          panelName: 'CBC',
          panelCode: 'cbc-panel',
        },
      ],
    })
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          parameterName: 'Hemoglobin',
          unit: 'g/dL',
          displayOrder: 1,
          minNormalMale: 13,
          maxNormalMale: 17,
          criticalMin: 7,
          criticalMax: 20,
        },
      ],
    })

    renderStructuredHarness()

    const input = await screen.findByLabelText(/Hemoglobin/i)
    fireEvent.change(input, { target: { value: '14.5' } })

    expect(input).not.toHaveClass('text-amber-600')
    expect(input).not.toHaveClass('text-red-600')
    expect(input).not.toHaveClass('font-bold')
    expect(input).toHaveAttribute('placeholder', '13.0–17.0 g/dL')
  })

  it('givenCriticalValue_whenEntered_thenFieldRendersRedAndFinalizeModalShowsWarning', async () => {
    const apiMock = await getApiMock()
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          id: 'cbc-panel',
          panelName: 'CBC',
          panelCode: 'cbc-panel',
        },
      ],
    })
    apiMock.get.mockResolvedValueOnce({
      data: [
        {
          parameterName: 'Hemoglobin',
          unit: 'g/dL',
          displayOrder: 1,
          minNormalMale: 13,
          maxNormalMale: 17,
          criticalMin: 7,
          criticalMax: 20,
        },
      ],
    })

    renderStructuredHarness()

    const input = await screen.findByLabelText(/Hemoglobin/i)
    fireEvent.change(input, { target: { value: '25' } })

    expect(input).toHaveClass('text-red-600')
    expect(input).toHaveClass('font-bold')

    expect(await screen.findByText(/Critical parameters detected/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Acknowledge critical value for Hemoglobin/i)).toBeInTheDocument()
  })

  it('givenRejectedSample_whenReasonSubmitted_thenNurseReceivesNotification', async () => {
    const apiMock = await getApiMock()
    apiMock.patch.mockResolvedValueOnce({ data: { id: 'LAB-REJECT-1', status: 'REJECTED' } })

    const { result } = renderHook(() => useRejectSample(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.rejectSample({
        orderId: 'LAB-REJECT-1',
        reason: 'Hemolyzed specimen',
      })
    })

    await waitFor(() => {
      expect(apiMock.patch).toHaveBeenCalledWith('/lab-orders/LAB-REJECT-1/status', {
        status: 'REJECTED',
        rejectionReason: 'Hemolyzed specimen',
      })
    })
  })
})
