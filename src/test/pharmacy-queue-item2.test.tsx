import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import { mapConsultationMedicationToDrugRequestItem } from '@/lib/pharmacy/drugRequestMapping'
import { DrugRequestQueue } from '@/components/pharmacy/DrugRequestQueue'

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    hasPermission: () => true,
    isRole: (role: string) => role === 'PHARMACIST',
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useDrugRequests', () => ({
  useDrugRequests: () => ({
    data: [
      {
        id: 'req-legacy-1',
        patientId: 'pat-1',
        patientName: 'Legacy Patient',
        requestedBy: 'doc-1',
        requestedByName: 'Dr Legacy',
        requestedAt: '2026-01-01T10:00:00.000Z',
        requestedAtFormatted: '2026-01-01T10:00:00.000Z',
        items: JSON.stringify([
          {
            drugName: 'Legacy Ceftriaxone order',
            notes: 'free-text legacy instruction',
          },
        ]),
        status: 'pending',
      },
    ],
    isLoading: false,
  }),
  useApproveDrugRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useFulfillDrugRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDenyDrugRequest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useInventory', () => ({
  useInventoryEntries: () => ({
    data: [],
    isLoading: false,
  }),
}))

describe('Item 2 pharmacy queue full prescription context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Test A: preserves structured fields through ConsultationMedication -> DrugRequestItem mapping', () => {
    const mapped = mapConsultationMedicationToDrugRequestItem({
      id: 'med-1',
      formularyId: 'form-1',
      drugName: 'Amoxicillin',
      dose: '500mg',
      route: 'Oral',
      frequency: 'TID',
      duration: '7 days',
      indication: 'CAP',
      allergyOverrideReason: 'Benefit outweighs risk',
    })

    expect(mapped.drugId).toBe('form-1')
    expect(mapped.drugName).toBe('Amoxicillin')
    expect(mapped.dose).toBe('500mg')
    expect(mapped.route).toBe('Oral')
    expect(mapped.frequency).toBe('TID')
    expect(mapped.duration).toBe('7 days')
    expect(mapped.allergyOverrideReason).toBe('Benefit outweighs risk')
  })

  it('Test B: renders legacy unstructured records safely without crashing frontend', () => {
    render(<DrugRequestQueue />)

    expect(screen.getByText('Drug Request Queue')).toBeInTheDocument()
    expect(screen.getByText('Legacy Ceftriaxone order free-text legacy instruction')).toBeInTheDocument()
  })
})
