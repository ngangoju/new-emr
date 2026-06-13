import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TariffManagementPage from '@/app/dashboard/admin/tariffs/page'

const mocks = vi.hoisted(() => ({
  role: 'CLINICAL_DIRECTOR',
  updateTariffPrice: vi.fn(),
  updateTariff: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('@/lib/utils/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils/auth')>('@/lib/utils/auth')

  return {
    ...actual,
    getUserRole: () => mocks.role,
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
  }),
}))

vi.mock('@/hooks/useTariffs', () => ({
  useTariffs: () => ({
    data: {
      data: [
        {
          id: 'tariff-1',
          serviceName: 'General Consultation',
          billingCode: 'CONS-001',
          category: 'CONSULTATION',
          basePrice: 10000,
          privatePrice: 15000,
          rssbMmiPrice: 8000,
          mutuellePrice: 7000,
          description: 'Consultation tariff',
          active: true,
        },
      ],
    },
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useTariffManagement', () => ({
  useCreateTariff: () => ({
    createTariff: vi.fn(),
    isCreating: false,
  }),
  useUpdateTariff: () => ({
    updateTariff: mocks.updateTariff,
    isUpdating: false,
  }),
  useDeleteTariff: () => ({
    deleteTariff: vi.fn(),
    isDeleting: false,
  }),
  useBulkCreateTariffs: () => ({
    bulkCreateTariffs: vi.fn(),
    isImporting: false,
  }),
  useUpdateTariffPrice: () => ({
    updateTariffPrice: mocks.updateTariffPrice,
    isUpdatingPrice: false,
  }),
}))

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean
    children: React.ReactNode
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('TariffManagementPage', () => {
  beforeEach(() => {
    mocks.role = 'CLINICAL_DIRECTOR'
    mocks.updateTariffPrice.mockReset()
    mocks.updateTariffPrice.mockResolvedValue(undefined)
    mocks.updateTariff.mockReset()
    mocks.updateTariff.mockResolvedValue(undefined)
    mocks.replace.mockReset()
  })

  it('treats CLINICAL_DIRECTOR as price-only tariff editor', async () => {
    const user = userEvent.setup()
    render(<TariffManagementPage />)

    expect(screen.getByRole('button', { name: /Add Tariff/i })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByDisplayValue('General Consultation')).toBeDisabled()
    expect(screen.getByDisplayValue('CONS-001')).toBeDisabled()
  })

  it('routes clinical-director edits through updateTariffPrice', async () => {
    const user = userEvent.setup()
    render(<TariffManagementPage />)

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    const basePriceInput = screen.getByDisplayValue('10000')
    await user.clear(basePriceInput)
    await user.type(basePriceInput, '12000')

    const privatePriceInput = screen.getByDisplayValue('15000')
    await user.clear(privatePriceInput)
    await user.type(privatePriceInput, '17000')

    const rssbPriceInput = screen.getByDisplayValue('8000')
    await user.clear(rssbPriceInput)
    await user.type(rssbPriceInput, '9000')

    await user.click(screen.getByRole('button', { name: /Update Tariff|Save Changes|Update/i }))

    expect(mocks.updateTariffPrice).toHaveBeenCalledWith({
      id: 'tariff-1',
      input: {
        basePrice: 12000,
        privatePrice: 17000,
        rssbMmiPrice: 9000,
      },
    })
    expect(mocks.updateTariff).not.toHaveBeenCalled()
  })
})
