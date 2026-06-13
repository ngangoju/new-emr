import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import NurseDashboardPage from '@/app/dashboard/nurse/page'

const mocks = vi.hoisted(() => ({
  permissions: ['vitals:write', 'consultation:create', 'billing:invoice:create', 'drug_request:create'],
  roleLoading: false,
  searchParams: new URLSearchParams('patientId=PAT-9'),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams,
}))

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    isLoading: mocks.roleLoading,
    hasPermission: (permission: string) => mocks.permissions.includes(permission),
  }),
}))

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <div>{title}</div>,
}))

vi.mock('@/components/clinical/TriageQueue', () => ({
  TriageQueue: () => <div>Triage queue</div>,
}))

vi.mock('@/components/nurse/NurseVitalsForm', () => ({
  NurseVitalsForm: ({ initialPatientId }: { initialPatientId?: string }) => (
    <div>Vitals form for {initialPatientId}</div>
  ),
}))

vi.mock('@/components/nurse/NurseConsultationAssignmentForm', () => ({
  NurseConsultationAssignmentForm: ({ initialPatientId }: { initialPatientId?: string }) => (
    <div>Consultation form for {initialPatientId}</div>
  ),
}))

vi.mock('@/components/nurse/NurseBilling', () => ({
  NurseBilling: () => <div>Nurse billing</div>,
}))

vi.mock('@/components/nurse/DrugRequestForm', () => ({
  DrugRequestForm: () => <div>Drug request form</div>,
}))

describe('NurseDashboardPage', () => {
  beforeEach(() => {
    mocks.permissions = ['vitals:write', 'consultation:create', 'billing:invoice:create', 'drug_request:create']
    mocks.roleLoading = false
    mocks.searchParams = new URLSearchParams('patientId=PAT-9')
  })

  it('shows the consultation tab when the role can create consultations', async () => {
    render(<NurseDashboardPage />)

    const consultationTab = await screen.findByRole('tab', { name: 'Consultation' })
    expect(consultationTab).toBeInTheDocument()
    expect(screen.getByText('Vitals form for PAT-9')).toBeInTheDocument()
  })

  it('hides the consultation tab when the permission is missing', async () => {
    mocks.permissions = ['vitals:write', 'billing:invoice:create']

    render(<NurseDashboardPage />)

    expect(await screen.findByRole('tab', { name: 'Vitals' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Consultation' })).not.toBeInTheDocument()
  })
})
