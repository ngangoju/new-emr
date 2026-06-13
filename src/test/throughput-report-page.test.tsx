import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PatientThroughputReportPage from '@/app/dashboard/reports/throughput/page'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}))

vi.mock('@/hooks/useHmisReports', () => ({
  usePatientThroughputReport: () => ({
    data: {
      totalEncounters: 12,
      activeEncounters: 3,
      completedEncounters: 9,
      averageEncounterDurationMinutes: 47,
      encountersByStatus: [{ status: 'ACTIVE', count: 3 }],
      hourlyDistribution: [{ hour: 9, count: 4 }],
      recentEncounters: [
        {
          encounterId: 'enc-1',
          patientName: 'Amina Uwera',
          status: 'COMPLETED',
          createdAt: '2026-06-12T08:00:00Z',
          durationMinutes: 52,
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useExportReport: () => ({
    mutate: mocks.mutate,
    isPending: false,
  }),
}))

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  }
})

describe('PatientThroughputReportPage', () => {
  beforeEach(() => {
    mocks.mutate.mockReset()
  })

  it('renders throughput metrics and recent encounters', () => {
    render(<PatientThroughputReportPage />)

    expect(screen.getByText('Patient Throughput')).toBeInTheDocument()
    expect(screen.getByText('Total Encounters')).toBeInTheDocument()
    expect(screen.getByText('Recent Encounters')).toBeInTheDocument()
    expect(screen.getByText('Amina Uwera')).toBeInTheDocument()
  })

  it('exports throughput report through the backend export endpoint hook', () => {
    render(<PatientThroughputReportPage />)

    fireEvent.click(screen.getByRole('button', { name: /Export/i }))

    expect(mocks.mutate).toHaveBeenCalledWith({ reportType: 'patient', format: 'csv' })
  })
})
