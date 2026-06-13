import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ReportsDashboard from '@/app/dashboard/reports/page'

const mocks = vi.hoisted(() => ({
  permissions: ['report:operational:read'],
}))

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    isLoading: false,
    hasPermission: (permission: string) => mocks.permissions.includes(permission),
  }),
}))

vi.mock('@/hooks/useHmisReports', () => ({
  usePatientThroughputReport: () => ({
    data: { averageEncounterDurationMinutes: 48 },
  }),
  useRevenueReport: () => ({
    data: { totalRevenue: 250000 },
  }),
  usePendingItemsReport: () => ({
    data: { openEncounterCount: 11, pendingLabOrderCount: 4 },
  }),
}))

describe('ReportsDashboard', () => {
  beforeEach(() => {
    mocks.permissions = ['report:operational:read']
  })

  it('shows report cards when the role has reporting permission', () => {
    render(<ReportsDashboard />)

    expect(screen.getByText('Patient Throughput')).toBeInTheDocument()
    expect(screen.getByText('Revenue Summary')).toBeInTheDocument()
    expect(screen.getByText('Pending Items')).toBeInTheDocument()
    expect(screen.getByText('System Usage')).toBeInTheDocument()
    expect(screen.queryByText('Reports unavailable')).not.toBeInTheDocument()
  })

  it('shows the unavailable state when the role lacks report permissions', () => {
    mocks.permissions = []

    render(<ReportsDashboard />)

    expect(screen.getByText('Reports unavailable')).toBeInTheDocument()
    expect(screen.getByText(/does not include report access/i)).toBeInTheDocument()
  })
})
