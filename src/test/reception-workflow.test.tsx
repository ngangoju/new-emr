import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ReceptionPage from '@/app/dashboard/reception/page'

const mocks = vi.hoisted(() => ({
  roleState: {
    role: 'RECEPTIONIST',
    isLoading: false,
    permissions: ['CAN_REGISTER_PATIENT', 'patient:create', 'queue:manage', 'queue:read'],
  },
  useQueueStats: vi.fn(() => ({ data: { waitingCount: 0, seenTodayCount: 0 } })),
}))

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    role: mocks.roleState.role,
    isLoading: mocks.roleState.isLoading,
    hasPermission: (permission: string) => (
      mocks.roleState.permissions.includes(permission)
    ),
  }),
}))

vi.mock('@/hooks/useQueue', () => ({
  useQueueStats: mocks.useQueueStats,
}))

vi.mock('@/components/clinical/TriageQueue', () => ({
  TriageQueue: () => <div>Live Triage Worklist</div>,
}))

vi.mock('@/components/reception/ReceptionIntakeWorkspace', () => ({
  ReceptionIntakeWorkspace: () => <div>Intake Workspace</div>,
}))

vi.mock('@/components/shared/CheckInModal', () => ({
  CheckInModal: ({ open }: { open: boolean }) => (
    open ? <div role="dialog">Register Visit</div> : null
  ),
}))

vi.mock('@/components/shared/PatientRegistrationModal', () => ({
  PatientRegistrationModal: ({ open }: { open: boolean }) => (
    open ? <div role="dialog">Register New Patient</div> : null
  ),
}))

describe('Reception workflow actions', () => {
  beforeEach(() => {
    mocks.roleState.role = 'RECEPTIONIST'
    mocks.roleState.isLoading = false
    mocks.roleState.permissions = ['CAN_REGISTER_PATIENT', 'patient:create', 'queue:manage', 'queue:read']
    mocks.useQueueStats.mockClear()
    mocks.useQueueStats.mockReturnValue({ data: { waitingCount: 0, seenTodayCount: 0 } })
  })

  it('opens the register visit workflow from the check-in action', () => {
    render(<ReceptionPage />)

    fireEvent.click(screen.getByRole('button', { name: /Check-in Patient/i }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Register Visit')
    expect(mocks.useQueueStats).toHaveBeenCalledWith({ enabled: true })
  })

  it('opens patient registration from the registration action', () => {
    render(<ReceptionPage />)

    fireEvent.click(screen.getByRole('button', { name: /Register New Patient/i }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Register New Patient')
  })

  it('does not poll queue stats when the role lacks queue read permission', () => {
    mocks.roleState.permissions = ['CAN_REGISTER_PATIENT', 'patient:create']

    render(<ReceptionPage />)

    expect(mocks.useQueueStats).toHaveBeenCalledWith({ enabled: false })
  })
})
