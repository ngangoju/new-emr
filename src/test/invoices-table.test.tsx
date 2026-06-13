import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvoicesTable } from '@/components/billing/InvoicesTable'
import type { Invoice } from '@/types/billing'

const mocks = vi.hoisted(() => ({
  hasPermission: vi.fn(),
  isRole: vi.fn(),
  requestDiscountApproval: vi.fn(),
  requestInvoiceVoid: vi.fn(),
  myApprovals: [] as Array<Record<string, unknown>>,
  pendingApprovals: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    hasPermission: mocks.hasPermission,
    isRole: mocks.isRole,
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useApprovals', () => ({
  usePendingApprovals: () => ({
    data: mocks.pendingApprovals,
  }),
  useMyApprovals: () => ({
    data: mocks.myApprovals,
  }),
  useRequestDiscountApproval: () => ({
    mutateAsync: mocks.requestDiscountApproval,
    isPending: false,
  }),
  useRequestInvoiceVoid: () => ({
    mutateAsync: mocks.requestInvoiceVoid,
    isPending: false,
  }),
}))

const baseInvoice: Invoice = {
  id: 'invoice-1',
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  doctorName: 'Dr. Kay',
  patient: {
    id: 'patient-1',
    fullName: 'Aline Patient',
    nationalId: '1199988877776666',
    phone: '0788000000',
    email: 'aline@example.com',
    dateOfBirth: new Date('1995-02-01T00:00:00Z'),
    gender: 'female',
    address: {
      province: 'Kigali',
      district: 'Gasabo',
      sector: 'Remera',
      cell: 'Nyarutarama',
      village: 'Village 1',
    },
    insurance: {
      provider: 'RSSB',
      cardNumber: 'RSSB-123',
      copayPercentage: 0,
    },
    allergies: [],
    emergencyContact: {
      name: 'Pacifique Patient',
      phone: '0788111111',
      relationship: 'Brother',
    },
    status: 'active',
    createdAt: new Date('2026-06-12T08:00:00Z'),
    updatedAt: new Date('2026-06-12T08:00:00Z'),
  },
  items: [],
  subtotal: 10000,
  discount: 0,
  insuranceCopayPercentage: 0,
  insuranceDue: 0,
  patientDue: 10000,
  total: 10000,
  status: 'ISSUED' as const,
  paymentStatus: 'UNPAID' as const,
  payments: [],
  createdAt: new Date('2026-06-12T08:00:00Z'),
  updatedAt: new Date('2026-06-12T08:00:00Z'),
}

describe('InvoicesTable discount workflow state', () => {
  beforeEach(() => {
    mocks.hasPermission.mockReset()
    mocks.hasPermission.mockReturnValue(false)
    mocks.isRole.mockReset()
    mocks.isRole.mockImplementation((roles: string | string[]) => {
      const roleList = Array.isArray(roles) ? roles : [roles]
      return roleList.includes('DOCTOR')
    })
    mocks.requestDiscountApproval.mockReset()
    mocks.requestInvoiceVoid.mockReset()
    mocks.myApprovals = []
    mocks.pendingApprovals = []
  })

  it('shows pending approval state to doctors and suppresses duplicate request action', () => {
    mocks.myApprovals = [
      {
        id: 'approval-1',
        type: 'discount',
        status: 'pending',
        targetId: 'invoice-1',
        requestedAt: '2026-06-12T10:00:00Z',
      },
    ]

    render(<InvoicesTable invoices={[baseInvoice]} />)

    expect(screen.getByText('DISCOUNT_PENDING_APPROVAL')).toBeInTheDocument()
    expect(screen.queryByTitle('Request Discount Approval')).not.toBeInTheDocument()
  })

  it('shows denied state and allows the doctor to submit a replacement request', () => {
    mocks.myApprovals = [
      {
        id: 'approval-2',
        type: 'discount',
        status: 'denied',
        targetId: 'invoice-1',
      },
    ]

    render(<InvoicesTable invoices={[baseInvoice]} />)

    expect(screen.getByText('DISCOUNT_DENIED')).toBeInTheDocument()
    expect(screen.getByTitle('Request Discount Approval')).toBeInTheDocument()
  })

  it('shows no discount state when no request exists', () => {
    render(<InvoicesTable invoices={[baseInvoice]} />)

    expect(screen.queryByText('DISCOUNT_PENDING_APPROVAL')).not.toBeInTheDocument()
    expect(screen.queryByText('DISCOUNT_DENIED')).not.toBeInTheDocument()
    expect(screen.queryByText('DISCOUNT_APPLIED')).not.toBeInTheDocument()
    expect(screen.getByTitle('Request Discount Approval')).toBeInTheDocument()
  })

  it('shows approved/applied state when invoice has discount amount', () => {
    const invoiceWithDiscount: Invoice = {
      ...baseInvoice,
      discountAmount: 5000,
      discountReason: 'Financial hardship',
      discountApprovedBy: 'admin-user-id',
    }

    render(<InvoicesTable invoices={[invoiceWithDiscount]} />)

    expect(screen.getByText('DISCOUNT_APPLIED')).toBeInTheDocument()
  })

  it('suppresses duplicate pending request action', () => {
    // Multiple pending requests - only the latest by requestedAt should matter
    mocks.myApprovals = [
      {
        id: 'approval-old',
        type: 'discount',
        status: 'pending',
        targetId: 'invoice-1',
        requestedAt: '2026-06-10T10:00:00Z',
      },
      {
        id: 'approval-new',
        type: 'discount',
        status: 'pending',
        targetId: 'invoice-1',
        requestedAt: '2026-06-12T10:00:00Z',
      },
    ]

    render(<InvoicesTable invoices={[baseInvoice]} />)

    expect(screen.getByText('DISCOUNT_PENDING_APPROVAL')).toBeInTheDocument()
    expect(screen.queryByTitle('Request Discount Approval')).not.toBeInTheDocument()
  })
})
