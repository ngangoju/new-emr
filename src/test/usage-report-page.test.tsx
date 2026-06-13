import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import UsageReportPage from '@/app/dashboard/reports/usage/page'

const mocks = vi.hoisted(() => ({
  exportReport: vi.fn(),
}))

vi.mock('@/hooks/useReports', () => ({
  useUsageReport: () => ({
    data: {
      title: 'System Usage',
      period: 'Today',
      data: [
        { label: 'DOCTOR', value: 5, color: '#10b981' },
        { label: 'NURSE', value: 3, color: '#3b82f6' },
        { label: 'ACCOUNTANT', value: 2, color: '#f59e0b' },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useExportReport: () => ({
    exportReport: mocks.exportReport,
    exporting: false,
  }),
}))

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  }
})

describe('UsageReportPage', () => {
  beforeEach(() => {
    mocks.exportReport.mockReset()
    mocks.exportReport.mockResolvedValue(undefined)
  })

  it('renders usage metrics and role breakdown', () => {
    render(<UsageReportPage />)

    expect(screen.getByText('System Usage')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getAllByText('DOCTOR').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NURSE').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ACCOUNTANT').length).toBeGreaterThan(0)
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })

  it('exports usage data in csv and json formats', () => {
    render(<UsageReportPage />)

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }))
    fireEvent.click(screen.getByRole('button', { name: /Export JSON/i }))

    expect(mocks.exportReport).toHaveBeenNthCalledWith(1, { reportType: 'usage', format: 'csv' })
    expect(mocks.exportReport).toHaveBeenNthCalledWith(2, { reportType: 'usage', format: 'json' })
  })
})
