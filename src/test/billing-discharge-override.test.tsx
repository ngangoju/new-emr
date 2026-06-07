import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { BillingDashboard } from '@/components/billing/BillingDashboard'

const mutateAsyncMock = vi.fn()

const baseInvoice = {
  id: 'INV-001',
  patientId: 'PAT-001',
  doctorId: 'DOC-1',
  doctorName: 'Dr. Who',
  patient: { id: 'PAT-001', fullName: 'Jane Doe', nationalId: '1234' },
  items: [],
  subtotal: 5000,
  discount: 0,
  insuranceCopayPercentage: 0,
  insuranceDue: 0,
  patientDue: 0,
  total: 5000,
  status: 'pending' as const,
  payments: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

let mockRole: 'ADMIN' | 'NURSE' = 'NURSE'
let mockPatientDue = 0

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    role: mockRole,
    roles: [mockRole],
    permissions: [],
    isLoading: false,
    hasPermission: () => false,
    isRole: (roles: string | string[]) => {
      if (Array.isArray(roles)) return roles.includes(mockRole)
      return roles === mockRole
    },
  }),
}))

vi.mock('@/hooks/useInvoices', () => ({
  useInvoices: () => ({
    pending: [{ ...baseInvoice, patientDue: mockPatientDue }],
    stats: { pendingCount: 1, totalRevenue: 0, pendingAmount: mockPatientDue, todayCount: 0 },
  }),
}))

vi.mock('@/hooks/usePayments', () => ({
  useCreatePayment: () => ({ createPayment: vi.fn(), creating: false }),
  useCreateMobileMoneyPayment: () => ({
    createMobileMoneyPayment: vi.fn(),
    creatingMobileMoneyPayment: false,
  }),
  usePayments: () => ({ data: [] }),
  useMobileMoneyTransaction: () => ({ data: null }),
}))

vi.mock('@/hooks/useAdmissions', () => ({
  useAdmissions: () => ({ data: [{ id: 'ADM-1' }] }),
  useDischargePatient: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}))

vi.mock('@/hooks/useWorkflow', () => ({
  useDischargeReadiness: () => ({
    data: {
      ready: true,
      blockers: [],
      ownerRole: 'CASHIER',
      responsibleRole: 'CASHIER',
      packetStatus: 'MATCHES_LAST_EXPORT',
    },
  }),
}))

vi.mock('@/components/billing/InvoicesTable', () => ({
  InvoicesTable: ({ invoices, onProcessPayment }: { invoices: Array<typeof baseInvoice>; onProcessPayment?: (invoice: typeof baseInvoice) => void }) => (
    <div>
      {invoices.map((invoice) => (
        <button key={invoice.id} onClick={() => onProcessPayment?.(invoice)}>
          Open {invoice.id}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('@/components/billing/ReportCharts', () => ({
  ReportCharts: () => <div>ReportCharts</div>,
}))

vi.mock('@/components/billing/InvoiceGenerator', () => ({
  InvoiceGenerator: ({ trigger }: { trigger: React.ReactNode }) => <div>{trigger}</div>,
}))

vi.mock('@/components/billing/PaymentMethodsSelect', () => ({
  PaymentMethodsSelect: () => <div>PaymentMethodsSelect</div>,
}))

vi.mock('@/components/shared/DoctorSelector', () => ({
  DoctorSelector: () => <div>DoctorSelector</div>,
}))

describe('billing discharge override flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRole = 'NURSE'
    mockPatientDue = 0
  })

  it('givenZeroBalance_whenNurseViews_thenDischargeButtonEnabled', async () => {
    render(<BillingDashboard />)

    fireEvent.click(screen.getByRole('button', { name: /Open INV-001/i }))

    const dischargeButton = await screen.findByRole('button', { name: 'Discharge Patient' })
    expect(dischargeButton).toBeEnabled()
  })

  it('givenOutstandingBalance_whenNonAdminViews_thenButtonDisabledWithTooltip', async () => {
    mockRole = 'NURSE'
    mockPatientDue = 5000

    render(<BillingDashboard />)

    fireEvent.click(screen.getByRole('button', { name: /Open INV-001/i }))

    const dischargeButton = await screen.findByRole('button', { name: 'Discharge Patient' })
    expect(dischargeButton).toBeDisabled()

    expect(dischargeButton).toHaveAttribute('title', 'Outstanding balance: 5000 RWF — contact billing')
  })

  it('givenOutstandingBalance_whenAdminSubmitsWithReason_thenDischargeSucceeds', async () => {
    mockRole = 'ADMIN'
    mockPatientDue = 5000
    mutateAsyncMock.mockResolvedValueOnce({ id: 'ADM-1' })

    render(<BillingDashboard />)

    fireEvent.click(screen.getByRole('button', { name: /Open INV-001/i }))

    const overrideButton = await screen.findByRole('button', { name: 'Override & Discharge' })
    expect(overrideButton).toBeEnabled()
    fireEvent.click(overrideButton)

    const reasonInput = await screen.findByLabelText(/Override Reason/i)
    fireEvent.change(reasonInput, { target: { value: 'Patient requires transfer; family guarantees payment.' } })

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Override & Discharge' }))

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: 'ADM-1',
        overrideReason: 'Patient requires transfer; family guarantees payment.',
      })
    })

    expect(await screen.findByText('Admin Discharge — Unpaid Balance')).toBeInTheDocument()
    expect(await screen.findByText('Pending Collection')).toBeInTheDocument()
  })
})
