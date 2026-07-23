import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'

import TenantsPage from '@/app/dashboard/admin/tenants/page'
import type { TenantDto } from '@/hooks/api/useAdminTenants'

const mocks = vi.hoisted(() => ({
  useAdminTenants: vi.fn(),
  mutation: {
    mutateAsync: vi.fn(),
    isPending: false,
  },
}))

vi.mock('@/hooks/api/useAdminTenants', () => ({
  useAdminTenants: mocks.useAdminTenants,
  useCreateTenant: () => mocks.mutation,
  useUpdateTenant: () => mocks.mutation,
  useDeleteTenant: () => mocks.mutation,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

function tenant(overrides: Partial<TenantDto>): TenantDto {
  return {
    id: 'tenant-x',
    name: 'Tenant X',
    subdomain: 'tenant-x',
    plan: 'free',
    status: 'active',
    settings: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('TenantsPage', () => {
  it('renders all tenants in the table', () => {
    mocks.useAdminTenants.mockReturnValue({
      data: [
        tenant({ id: 't-1', name: 'Kigali Clinic', subdomain: 'kigali', plan: 'pro' }),
        tenant({ id: 't-2', name: 'Huye Clinic', subdomain: 'huye', status: 'suspended' }),
      ],
      isLoading: false,
      error: null,
    })

    render(<TenantsPage />)

    expect(screen.getByText('Kigali Clinic')).toBeInTheDocument()
    expect(screen.getByText('Huye Clinic')).toBeInTheDocument()
    expect(screen.getByText('kigali')).toBeInTheDocument()
    expect(screen.getByText('huye')).toBeInTheDocument()
    expect(screen.getByText('suspended')).toBeInTheDocument()
  })

  it('shows an access denied panel when the list query 403s', () => {
    mocks.useAdminTenants.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 403,
      } as AxiosResponse),
    })

    render(<TenantsPage />)

    expect(screen.getByText(/Access denied — platform admin only/)).toBeInTheDocument()
    expect(screen.queryByText('New Tenant')).not.toBeInTheDocument()
  })
})
