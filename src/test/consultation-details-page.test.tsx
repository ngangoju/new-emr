import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ConsultationDetailsPage from '@/app/dashboard/doctor/consultations/[id]/page'

const mocks = vi.hoisted(() => ({
  consultation: {
    id: 'consult-1',
    patientId: 'patient-1',
    patientName: 'Amina Uwera',
    doctorName: 'Habimana',
    status: 'DRAFT',
    type: 'GENERAL',
    notes: 'Observation notes',
    diagnosis: 'Working diagnosis',
    presentingComplaint: 'Abdominal pain',
    createdAt: '2026-06-12T09:00:00Z',
  },
}))

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')

  return {
    ...actual,
    use: <T,>(value: T) => value,
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/hooks/api/useConsultations', () => ({
  useConsultation: () => ({
    data: mocks.consultation,
    isLoading: false,
    isError: false,
  }),
  useSignConsultation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateConsultation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteConsultation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useSaveConsultationScribe: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('@/components/doctor/DoctorTreatmentWorkspace', () => ({
  DoctorTreatmentWorkspace: () => <div>Treatment Workspace</div>,
}))

describe('ConsultationDetailsPage', () => {
  beforeEach(() => {
    mocks.consultation.status = 'DRAFT'
  })

  it('shows delete action for draft consultations', async () => {
    render(<ConsultationDetailsPage params={Promise.resolve({ id: 'consult-1' })} />)

    expect(await screen.findByText('Delete Draft Consultation')).toBeInTheDocument()
    expect(screen.getByText('Finalize & Sign')).toBeInTheDocument()
  })

  it('hides delete action for finalized consultations', async () => {
    mocks.consultation.status = 'FINALIZED'

    render(<ConsultationDetailsPage params={Promise.resolve({ id: 'consult-1' })} />)

    expect(await screen.findByText('Visit Information')).toBeInTheDocument()
    expect(screen.queryByText('Delete Draft Consultation')).not.toBeInTheDocument()
  })
})
