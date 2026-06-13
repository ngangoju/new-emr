import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ImagingOrdersPage from '@/app/dashboard/doctor/imaging-orders/page'

const mocks = vi.hoisted(() => ({
  orders: [
    {
      id: 'order-reported',
      patientId: 'patient-1',
      patientFirstName: 'Amina',
      patientLastName: 'Uwera',
      doctorId: 'doctor-1',
      imagingType: 'CT',
      bodyPart: 'Abdomen',
      priority: 'URGENT',
      instructions: 'Persistent abdominal pain with guarding and fever.',
      status: 'REPORTED',
      orderedAt: '2026-06-12T09:30:00Z',
      createdAt: '2026-06-12T09:30:00Z',
      updatedAt: '2026-06-12T09:30:00Z',
      approvedAt: '2026-06-12T11:00:00Z',
      physicianAcknowledgedAt: undefined,
    },
    {
      id: 'order-active',
      patientId: 'patient-2',
      patientFirstName: 'Jean',
      patientLastName: 'Hakizimana',
      doctorId: 'doctor-1',
      imagingType: 'X-Ray',
      bodyPart: 'Chest',
      priority: 'ROUTINE',
      instructions: 'Persistent cough and chest discomfort.',
      status: 'ORDERED',
      orderedAt: '2026-06-12T08:15:00Z',
      createdAt: '2026-06-12T08:15:00Z',
      updatedAt: '2026-06-12T08:15:00Z',
      approvedAt: undefined,
      physicianAcknowledgedAt: undefined,
    },
  ],
  patientOrders: [] as Array<Record<string, unknown>>,
  selectedPatientId: undefined as string | undefined,
  modalOpen: false,
  modalPatientName: '',
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('@/components/shared/PatientSelector', () => ({
  PatientSelector: ({
    onSelect,
  }: {
    onSelect: (patient: { id: string; firstName: string; lastName: string }) => void
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          id: 'patient-1',
          firstName: 'Amina',
          lastName: 'Uwera',
        })
      }
    >
      Select Patient
    </button>
  ),
}))

vi.mock('@/components/radiology/CreateImagingOrderModal', () => ({
  CreateImagingOrderModal: ({
    open,
    patientName,
  }: {
    open: boolean
    patientName?: string
  }) => {
    mocks.modalOpen = open
    mocks.modalPatientName = patientName || ''
    return open ? <div>Create order modal for {patientName}</div> : null
  },
}))

vi.mock('@/hooks/useImaging', () => ({
  useImagingOrders: () => ({
    data: mocks.orders,
  }),
  usePatientImagingOrders: (patientId: string) => {
    mocks.selectedPatientId = patientId
    return {
      data: patientId === 'patient-1' ? mocks.patientOrders : [],
    }
  },
}))

describe('ImagingOrdersPage', () => {
  beforeEach(() => {
    mocks.patientOrders = [
      {
        id: 'prior-order',
        patientId: 'patient-1',
        imagingType: 'Ultrasound',
        bodyPart: 'Pelvis',
        priority: 'ROUTINE',
        status: 'COMPLETED',
        orderedAt: '2026-06-11T14:00:00Z',
      },
    ]
    mocks.selectedPatientId = undefined
    mocks.modalOpen = false
    mocks.modalPatientName = ''
  })

  it('surfaces orders awaiting doctor follow-up', () => {
    render(<ImagingOrdersPage />)

    expect(screen.getByText('Awaiting Doctor Follow-Up')).toBeInTheDocument()
    expect(screen.getByText('Amina Uwera')).toBeInTheDocument()
    expect(screen.getByText('Review Results')).toBeInTheDocument()
    expect(screen.getByText('Active Imaging Queue')).toBeInTheDocument()
  })

  it('enables patient-context creation after selecting a patient', () => {
    render(<ImagingOrdersPage />)

    const createButton = screen.getByRole('button', { name: /create imaging order/i })
    expect(createButton).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Select Patient' }))

    expect(mocks.selectedPatientId).toBe('patient-1')
    expect(screen.getByText('Recent imaging activity for this patient')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /create imaging order/i }))

    expect(mocks.modalOpen).toBe(true)
    expect(mocks.modalPatientName).toBe('Amina Uwera')
    expect(screen.getByText('Create order modal for Amina Uwera')).toBeInTheDocument()
  })
})
