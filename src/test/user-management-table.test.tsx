import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserManagementTable } from '@/components/admin/UserManagementTable'

const mocks = vi.hoisted(() => ({
  users: [
    {
      id: 'user-1',
      username: 'alice',
      name: 'Alice Admin',
      email: 'alice@example.com',
      role: 'ADMIN',
      status: 'active',
      active: true,
      createdAt: '2026-06-12T08:00:00Z',
    },
    {
      id: 'user-2',
      username: 'nina',
      name: 'Nina Nurse',
      email: 'nina@example.com',
      role: 'NURSE',
      status: 'inactive',
      active: false,
      createdAt: '2026-06-12T08:00:00Z',
    },
  ],
  createUser: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => ({
    users: mocks.users,
    filteredUsers: mocks.users,
    stats: {
      total: mocks.users.length,
      active: 1,
      inactive: 1,
    },
    loading: false,
  }),
  useCreateUser: () => ({
    createUser: mocks.createUser,
    isCreating: false,
  }),
  useUpdateUser: () => ({
    updateUser: mocks.updateUser,
    isUpdating: false,
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
  }: {
    children: React.ReactNode
    onClick?: () => void
  }) => (
    <button type="button" onClick={onClick}>
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

describe('UserManagementTable', () => {
  beforeEach(() => {
    mocks.createUser.mockReset()
    mocks.createUser.mockResolvedValue(undefined)
    mocks.updateUser.mockReset()
    mocks.updateUser.mockResolvedValue(undefined)
  })

  it('creates a user from the admin dialog', async () => {
    const { container } = render(<UserManagementTable />)

    fireEvent.click(screen.getByRole('button', { name: /Add User/i }))

    const inputs = container.querySelectorAll('input')
    fireEvent.change(inputs[1] as HTMLInputElement, { target: { value: 'sam' } })
    fireEvent.change(inputs[2] as HTMLInputElement, { target: { value: 'Sam Supervisor' } })
    fireEvent.change(inputs[3] as HTMLInputElement, { target: { value: 'sam@example.com' } })
    fireEvent.change(inputs[4] as HTMLInputElement, { target: { value: 'StrongPass123' } })

    fireEvent.click(screen.getByRole('button', { name: /Create User/i }))

    expect(mocks.createUser).toHaveBeenCalledWith({
      username: 'sam',
      name: 'Sam Supervisor',
      email: 'sam@example.com',
      password: 'StrongPass123',
      role: 'USER',
    })
  })

  it('opens edit flow and saves updated user details', async () => {
    render(<UserManagementTable />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.change(screen.getByDisplayValue('Alice Admin'), { target: { value: 'Alice Updated' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    expect(mocks.updateUser).toHaveBeenCalledWith({
      id: 'user-1',
      input: {
        username: 'alice',
        name: 'Alice Updated',
        email: 'alice@example.com',
        role: 'ADMIN',
        active: true,
      },
    })
  })

  it('toggles user active status through the disable or enable action', async () => {
    render(<UserManagementTable />)

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }))

    expect(mocks.updateUser).toHaveBeenNthCalledWith(1, {
      id: 'user-1',
      input: {
        username: 'alice',
        name: 'Alice Admin',
        email: 'alice@example.com',
        role: 'ADMIN',
        active: false,
      },
    })

    expect(mocks.updateUser).toHaveBeenNthCalledWith(2, {
      id: 'user-2',
      input: {
        username: 'nina',
        name: 'Nina Nurse',
        email: 'nina@example.com',
        role: 'NURSE',
        active: true,
      },
    })
  })
})
