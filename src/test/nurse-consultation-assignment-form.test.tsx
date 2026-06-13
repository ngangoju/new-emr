import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NurseConsultationAssignmentForm } from '@/components/nurse/NurseConsultationAssignmentForm'

const mocks = vi.hoisted(() => ({
  patient: {
    id: 'PAT-1',
    firstName: 'Aline',
    lastName: 'Uwase',
    dateOfBirth: '1994-01-10',
    gender: 'FEMALE',
    phone: '0780000000',
  },
  createConsultation: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: mocks.success,
    error: mocks.error,
  },
}))

vi.mock('@/components/shared/PatientSelector', () => ({
  PatientSelector: ({ onSelect }: { onSelect: (patient: typeof mocks.patient) => void }) => (
    <button type="button" onClick={() => onSelect(mocks.patient)}>
      Pick patient
    </button>
  ),
}))

vi.mock('@/components/shared/DoctorSelector', () => ({
  DoctorSelector: ({ onValueChange }: { onValueChange: (value: string) => void }) => (
    <select
      aria-label="Assign Doctor"
      onChange={(event) => onValueChange(event.target.value)}
      defaultValue=""
    >
      <option value="">Select doctor</option>
      <option value="DOC-7">Dr. Kayitesi</option>
    </select>
  ),
}))

vi.mock('@/hooks/api/useConsultations', () => ({
  useCreateConsultation: () => ({
    mutateAsync: mocks.createConsultation,
    isPending: false,
  }),
}))

vi.mock('@/hooks/api/usePatients', () => ({
  usePatient: () => ({ data: null }),
  usePatientVitals: () => ({
    data: [
      {
        recordedAt: '2026-06-12T08:30:00.000Z',
        bloodPressure: '118/76',
        heartRate: 80,
        temperature: 37.2,
        triageDisposition: 'WAIT_FOR_DOCTOR',
        triageNote: 'Monitor dizziness.',
      },
    ],
  }),
}))

describe('NurseConsultationAssignmentForm', () => {
  beforeEach(() => {
    mocks.createConsultation.mockReset()
    mocks.createConsultation.mockResolvedValue({ id: 'CONS-1' })
    mocks.success.mockReset()
    mocks.error.mockReset()
  })

  it('submits a consultation handoff with triage context', async () => {
    render(<NurseConsultationAssignmentForm />)

    fireEvent.click(screen.getByRole('button', { name: /Pick patient/i }))
    fireEvent.change(screen.getByLabelText('Assign Doctor'), {
      target: { value: 'DOC-7' },
    })
    fireEvent.change(screen.getByLabelText(/Triage Summary/i), {
      target: { value: 'Severe headache with blurred vision after triage.' },
    })
    fireEvent.change(screen.getByLabelText(/Additional Nurse Note/i), {
      target: { value: 'Patient reports symptoms started this morning.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Assign Consultation/i }))

    await waitFor(() => {
      expect(mocks.createConsultation).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'PAT-1',
          doctorId: 'DOC-7',
          findings: 'Severe headache with blurred vision after triage.',
          notes: expect.stringContaining('Latest vitals: Temp 37.2 C | BP 118/76 | HR 80 | Disposition WAIT_FOR_DOCTOR'),
        }),
      )
    })

    expect(mocks.createConsultation).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: expect.stringContaining('Nurse note: Patient reports symptoms started this morning.'),
      }),
    )
    expect(mocks.success).toHaveBeenCalledWith('Consultation handoff sent to doctor.')
  })

  it('blocks submission until a doctor is selected', async () => {
    render(<NurseConsultationAssignmentForm />)

    fireEvent.click(screen.getByRole('button', { name: /Pick patient/i }))
    fireEvent.change(screen.getByLabelText(/Triage Summary/i), {
      target: { value: 'Needs urgent physician review.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Assign Consultation/i }))

    await waitFor(() => {
      expect(mocks.error).toHaveBeenCalledWith('Please select a doctor for the handoff.')
    })
    expect(mocks.createConsultation).not.toHaveBeenCalled()
  })
})
