import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RevenueReportPage from '@/app/dashboard/reports/revenue/page'

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}))

vi.mock('@/hooks/useHmisReports', () => ({
  useRevenueReport: () => ({
    data: {
      totalRevenue: 120000,
      totalCollected: 100000,
      totalOutstanding: 20000,
      insuranceShare: 60000,
      patientShare: 60000,
      revenueByInsurance: [{ insuranceType: 'RSSB', amount: 70000, invoiceCount: 4 }],
      revenueByCategory: [{ category: 'Consultation', amount: 50000, invoiceCount: 3 }],
      paymentStatusBreakdown: [],
      agingReport: [{ bucket: '0-30 days', count: 2, amount: 20000 }],
      recentInvoices: [],
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

describe('RevenueReportPage', () => {
  beforeEach(() => {
    mocks.mutate.mockReset()
  })

  it('renders revenue summary data', () => {
    render(<RevenueReportPage />)

    expect(screen.getByText('Revenue Summary')).toBeInTheDocument()
    expect(screen.getByText('Total Invoiced')).toBeInTheDocument()
    expect(screen.getByText('Revenue by Insurance Type')).toBeInTheDocument()
  })

  it('exports revenue report through the backend export endpoint hook', () => {
    render(<RevenueReportPage />)

    fireEvent.click(screen.getByRole('button', { name: /Export/i }))

    expect(mocks.mutate).toHaveBeenCalledWith({ reportType: 'financial', format: 'csv' })
  })
})
