import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock('@/lib/utils/auth', () => ({
  getUserRole: vi.fn(() => 'ADMIN'),
}))

import { useQuery } from '@tanstack/react-query'
import { useUsers } from '@/hooks/useUsers'

describe('useUsers', () => {
  it('filters by role using roles[] when available (multi-role)', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [
        {
          id: '1',
          username: 'alice',
          name: 'Alice',
          email: 'alice@test.dev',
          role: 'DOCTOR',
          roles: ['DOCTOR', 'NURSE'],
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: '2',
          username: 'bob',
          name: 'Bob',
          email: 'bob@test.dev',
          role: 'RECEPTIONIST',
          roles: ['RECEPTIONIST'],
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
    } as never)

    const { result } = renderHook(() => useUsers({ role: 'NURSE' }))

    expect(result.current.filteredUsers).toHaveLength(1)
    expect(result.current.filteredUsers[0].id).toBe('1')
  })

  it('falls back to legacy role field when roles[] is absent', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [
        {
          id: '1',
          username: 'carol',
          name: 'Carol',
          email: 'carol@test.dev',
          role: 'PHARMACIST',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
    } as never)

    const { result } = renderHook(() => useUsers({ role: 'PHARMACIST' }))

    expect(result.current.filteredUsers).toHaveLength(1)
    expect(result.current.filteredUsers[0].id).toBe('1')
  })
})

