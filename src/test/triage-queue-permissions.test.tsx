import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TriageQueue } from '@/components/clinical/TriageQueue'

const mocks = vi.hoisted(() => ({
  useQueue: vi.fn(() => ({ data: [], isLoading: false })),
  useSocketEvent: vi.fn(),
  roleState: {
    isLoading: false,
    permissions: [] as string[],
    roles: [] as string[],
  },
}))

vi.mock('@/hooks/useQueue', () => ({
  useQueue: mocks.useQueue,
}))

vi.mock('@/hooks/useSocket', () => ({
  useSocketEvent: mocks.useSocketEvent,
}))

vi.mock('@/hooks/useRole', () => ({
  useRole: () => ({
    isLoading: mocks.roleState.isLoading,
    hasPermission: (permission: string) => mocks.roleState.permissions.includes(permission),
    isRole: (roles: string | string[]) => {
      const allowedRoles = Array.isArray(roles) ? roles : [roles]
      return allowedRoles.some((role) => mocks.roleState.roles.includes(role))
    },
  }),
}))

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  )
}

describe('TriageQueue permission guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.roleState.isLoading = false
    mocks.roleState.permissions = []
    mocks.roleState.roles = []
    mocks.useQueue.mockReturnValue({ data: [], isLoading: false })
  })

  it('does not fetch the active queue without queue read permission', () => {
    renderWithQueryClient(<TriageQueue />)

    expect(mocks.useQueue).toHaveBeenCalledWith({ enabled: false })
    expect(screen.getByText('Queue visibility is not available for your current role.')).toBeInTheDocument()
  })

  it('enables the active queue when queue read permission is present', () => {
    mocks.roleState.permissions = ['queue:read']

    renderWithQueryClient(<TriageQueue />)

    expect(mocks.useQueue).toHaveBeenCalledWith({ enabled: true })
    expect(screen.getByText('No patients in the active queue')).toBeInTheDocument()
  })
})
