import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TenantSwitcher } from '@/components/layout/TenantSwitcher'
import type { MyTenant } from '@/hooks/api/useMyTenants'

const mocks = vi.hoisted(() => ({
  tenants: [] as MyTenant[],
  setSelectedTenantId: vi.fn(),
  getSelectedTenantId: vi.fn<() => string | null>(() => null),
  getSessionUser: vi.fn<() => { tenantId?: string } | null>(() => null),
}))

vi.mock('@/hooks/api/useMyTenants', () => ({
  useMyTenants: () => ({ data: mocks.tenants }),
}))

vi.mock('@/lib/tenantSession', () => ({
  getSelectedTenantId: () => mocks.getSelectedTenantId(),
  setSelectedTenantId: (id: string | null) => mocks.setSelectedTenantId(id),
}))

vi.mock('@/lib/utils/auth', () => ({
  getSessionUser: () => mocks.getSessionUser(),
}))

// Flatten the dropdown so items render without opening a portal (mirrors the
// existing user-management-table.test.tsx approach).
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

const tenantA: MyTenant = { id: 'tenant-a', name: 'Alpha Clinic', status: 'ACTIVE', role: 'DOCTOR' }
const tenantB: MyTenant = { id: 'tenant-b', name: 'Beta Hospital', status: 'ACTIVE', role: 'NURSE' }

function renderSwitcher() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantSwitcher />
    </QueryClientProvider>,
  )
}

describe('TenantSwitcher', () => {
  beforeEach(() => {
    mocks.tenants = []
    mocks.setSelectedTenantId.mockReset()
    mocks.getSelectedTenantId.mockReset()
    mocks.getSelectedTenantId.mockReturnValue(null)
    mocks.getSessionUser.mockReset()
    mocks.getSessionUser.mockReturnValue(null)
  })

  it('renders nothing when the user has 0 tenants (platform admin)', () => {
    mocks.tenants = []
    const { container } = renderSwitcher()
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the tenant read-only and offers no switching with exactly 1 tenant', () => {
    mocks.tenants = [tenantA]
    renderSwitcher()

    expect(screen.getByText('Alpha Clinic')).toBeInTheDocument()
    // No "Switch tenant" affordance for a single-tenant user.
    expect(screen.queryByText('Switch tenant')).not.toBeInTheDocument()
    expect(screen.queryByText('Beta Hospital')).not.toBeInTheDocument()
  })

  it('lists all tenants and persists the selection on switch', () => {
    mocks.tenants = [tenantA, tenantB]
    mocks.getSelectedTenantId.mockReturnValue('tenant-a')
    renderSwitcher()

    // Both tenants appear in the dropdown.
    expect(screen.getByText('Beta Hospital')).toBeInTheDocument()
    expect(screen.getAllByText('Alpha Clinic').length).toBeGreaterThan(0)

    // Selecting the other tenant persists it (drives X-Tenant-ID on next request).
    fireEvent.click(screen.getByText('Beta Hospital'))
    expect(mocks.setSelectedTenantId).toHaveBeenCalledWith('tenant-b')
  })
})
