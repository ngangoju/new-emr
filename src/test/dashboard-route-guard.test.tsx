import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardRouteGuard } from '@/components/auth/DashboardRouteGuard'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
}))

const roleState = {
  role: 'DOCTOR',
  roles: ['DOCTOR'],
  permissions: [] as string[],
  isLoading: false,
}
vi.mock('@/hooks/useRole', () => ({
  useRole: () => roleState,
}))

const getSessionUserMock = vi.fn()
vi.mock('@/lib/utils/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/auth')>()
  return {
    ...actual,
    getSessionUser: () => getSessionUserMock(),
  }
})

// Prevent the real /auth/me network call; the query cache drives the result.
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(() => new Promise(() => {})) },
}))

function renderGuard(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardRouteGuard>
        <div data-testid="protected-content">protected</div>
      </DashboardRouteGuard>
    </QueryClientProvider>,
  )
}

describe('DashboardRouteGuard session sources (QA audit login-bounce regression)', () => {
  beforeEach(() => {
    replaceMock.mockClear()
    getSessionUserMock.mockReset()
  })

  it('renders children when localStorage is empty but React-Query [me] is seeded', () => {
    // The exact post-login bounce scenario: storage read transiently empty,
    // but useLogin has seeded the in-memory session.
    getSessionUserMock.mockReturnValue(null)
    const queryClient = new QueryClient()
    queryClient.setQueryData(['me'], { id: 'u1', username: 'matt', role: 'DOCTOR' })

    renderGuard(queryClient)

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
  })

  it('renders children when only the persisted session exists', () => {
    getSessionUserMock.mockReturnValue({ id: 'u1', username: 'matt', role: 'DOCTOR' })

    renderGuard(new QueryClient())

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('shows the loader (not children, no redirect) when neither source has a session', () => {
    getSessionUserMock.mockReturnValue(null)

    renderGuard(new QueryClient())

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    // No hard bounce from the guard itself while the session is still unresolved.
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
