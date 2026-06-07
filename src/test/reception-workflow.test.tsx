import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ReceptionPage from '@/app/dashboard/reception/page'

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    role: 'RECEPTIONIST',
    isLoading: false,
    hasPermission: (permission: string) => (
      ['CAN_REGISTER_PATIENT', 'patient:create', 'queue:manage'].includes(permission)
    ),
  }),
}))

vi.mock('@/hooks/useQueue', () => ({
  useQueueStats: () => ({ data: { waitingCount: 0, seenTodayCount: 0 } }),
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
  it('opens the register visit workflow from the check-in action', () => {
    render(<ReceptionPage />)

    fireEvent.click(screen.getByRole('button', { name: /Check-in Patient/i }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Register Visit')
  })

  it('opens patient registration from the registration action', () => {
    render(<ReceptionPage />)

    fireEvent.click(screen.getByRole('button', { name: /Register New Patient/i }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Register New Patient')
  })
})
