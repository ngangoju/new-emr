import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'

import AdminAnalyticsPage from '@/app/dashboard/admin/analytics/page'
import type { TenantStatsDto } from '@/hooks/api/useAnalyticsTenants'

const mocks = vi.hoisted(() => ({
  useAnalyticsTenants: vi.fn(),
}))

vi.mock('@/hooks/api/useAnalyticsTenants', () => ({
  useAnalyticsTenants: mocks.useAnalyticsTenants,
}))

function stats(overrides: Partial<TenantStatsDto>): TenantStatsDto {
  return {
    tenantId: 'tenant-x',
    tenantName: 'Tenant X',
    patientCount: 0,
    appointmentCount: 0,
    consultationCount: 0,
    labOrderCount: 0,
    prescriptionCount: 0,
    visitTicketCount: 0,
    invoiceCount: 0,
    invoiceRevenue: 0,
    activeUserCount: 0,
    ...overrides,
  }
}

function forbiddenError(): AxiosError {
  return new AxiosError(
    'Forbidden',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    { status: 403 } as AxiosResponse
  )
}

describe('AdminAnalyticsPage', () => {
  it('renders per-tenant rows and a totals row', () => {
    mocks.useAnalyticsTenants.mockReturnValue({
      data: [
        stats({
          tenantId: 't-1',
          tenantName: 'Kigali Clinic',
          patientCount: 10,
          appointmentCount: 4,
          activeUserCount: 3,
        }),
        stats({
          tenantId: 't-2',
          tenantName: 'Huye Clinic',
          patientCount: 5,
          appointmentCount: 6,
          activeUserCount: 2,
        }),
      ],
      isLoading: false,
      error: null,
    })

    render(<AdminAnalyticsPage />)

    expect(screen.getByText('Kigali Clinic')).toBeInTheDocument()
    expect(screen.getByText('Huye Clinic')).toBeInTheDocument()

    const totalsRow = screen.getByTestId('analytics-totals-row')
    expect(within(totalsRow).getByText('Totals')).toBeInTheDocument()
    // patientCount 10 + 5 = 15, appointmentCount 4 + 6 = 10, activeUserCount 3 + 2 = 5
    expect(within(totalsRow).getByText('15')).toBeInTheDocument()
    expect(within(totalsRow).getByText('10')).toBeInTheDocument()
    expect(within(totalsRow).getByText('5')).toBeInTheDocument()

    expect(
      screen.getAllByText(/Aggregated counts only — no patient-identifiable data/).length
    ).toBeGreaterThan(0)
  })

  it('shows an access denied panel when the query 403s', () => {
    mocks.useAnalyticsTenants.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: forbiddenError(),
    })

    render(<AdminAnalyticsPage />)

    expect(
      screen.getByText(/Access denied — platform admin only/)
    ).toBeInTheDocument()
    expect(screen.queryByTestId('analytics-totals-row')).not.toBeInTheDocument()
  })
})
