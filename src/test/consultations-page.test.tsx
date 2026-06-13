import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ConsultationsPage from '@/app/dashboard/doctor/consultations/page'

const mocks = vi.hoisted(() => ({
  permissions: ['consultation:create'],
  consultations: [] as Array<Record<string, unknown>>,
  deleteConsultation: vi.fn(),
}))

vi.mock('@/hooks/api/useConsultations', () => ({
  useConsultations: () => ({
    data: mocks.consultations,
    isLoading: false,
  }),
  useDeleteConsultation: () => ({
    mutateAsync: mocks.deleteConsultation,
    isPending: false,
  }),
}))

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    isLoading: false,
    hasPermission: (permission: string) => mocks.permissions.includes(permission),
  }),
}))

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <div>{title}</div>,
}))

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
    title: string
    description: string
    action?: { label: string }
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action ? <button type="button">{action.label}</button> : null}
    </div>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

describe('ConsultationsPage', () => {
  beforeEach(() => {
    mocks.permissions = ['consultation:create']
    mocks.consultations = []
    mocks.deleteConsultation.mockReset()
  })

  it('shows the new consultation action when create permission exists', () => {
    render(<ConsultationsPage />)

    expect(screen.getAllByText('New Consultation').length).toBeGreaterThan(0)
  })

  it('hides create actions when the role only has read access', () => {
    mocks.permissions = ['consultation:read']

    render(<ConsultationsPage />)

    expect(screen.queryByText('New Consultation')).not.toBeInTheDocument()
    expect(screen.getByText(/view consultation records once encounters are created/i)).toBeInTheDocument()
  })

  it('shows delete for draft consultations when addendum permission exists', () => {
    mocks.permissions = ['consultation:read', 'consultation:addendum']
    mocks.consultations = [
      {
        id: 'consult-1',
        patientName: 'Amina Uwera',
        status: 'DRAFT',
        type: 'FOLLOW_UP',
        createdAt: '2026-06-12T09:00:00Z',
      },
      {
        id: 'consult-2',
        patientName: 'Jean Hakizimana',
        status: 'FINALIZED',
        type: 'GENERAL',
        createdAt: '2026-06-12T10:00:00Z',
      },
    ]

    render(<ConsultationsPage />)

    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getAllByText('View').length).toBe(2)
  })
})
