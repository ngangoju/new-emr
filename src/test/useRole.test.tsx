import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import { useRole } from '@/hooks/useRole'

vi.mock('@/lib/utils/auth', async () => {
    const actual = await vi.importActual<typeof import('@/lib/utils/auth')>('@/lib/utils/auth')
    return {
        ...actual,
        getSessionUser: vi.fn(),
        getUserRole: vi.fn(),
        isAuthInitialized: vi.fn(),
        onAuthInitialized: vi.fn(),
    }
})

import {
    getSessionUser,
    getUserRole,
    isAuthInitialized,
    onAuthInitialized,
} from '@/lib/utils/auth'

describe('useRole authorization adapter behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(isAuthInitialized).mockReturnValue(true)
        vi.mocked(onAuthInitialized).mockReturnValue(() => { })
    })

    it('allows action by dynamic permission first', async () => {
        vi.mocked(getUserRole).mockReturnValue('RECEPTIONIST')
        vi.mocked(getSessionUser).mockReturnValue({
            role: 'RECEPTIONIST',
            permissions: ['CAN_MANAGE_USERS'],
        })

        const { result } = renderHook(() => useRole())

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.hasPermission('CAN_MANAGE_USERS')).toBe(true)
    })

    it('falls back to legacy permission map when dynamic permissions are absent', async () => {
        vi.mocked(getUserRole).mockReturnValue('DOCTOR')
        vi.mocked(getSessionUser).mockReturnValue({
            role: 'DOCTOR',
            permissions: [],
        })

        const { result } = renderHook(() => useRole())

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.hasPermission('CAN_PRESCRIBE')).toBe(true)
        expect(result.current.hasPermission('CAN_MANAGE_USERS')).toBe(false)
    })

    it('keeps deterministic dynamic-first behavior when both dynamic and legacy are present', async () => {
        vi.mocked(getUserRole).mockReturnValue('ADMIN')
        vi.mocked(getSessionUser).mockReturnValue({
            role: 'ADMIN',
            permissions: ['CAN_VIEW_LAB'],
        })

        const { result } = renderHook(() => useRole())

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        // Legacy ADMIN would allow this, but dynamic permissions are authoritative when present.
        expect(result.current.hasPermission('CAN_MANAGE_USERS')).toBe(false)
        expect(result.current.hasPermission('CAN_VIEW_LAB')).toBe(true)
    })

    it('supports multi-role checks through roles[] while preserving role', async () => {
        vi.mocked(getUserRole).mockReturnValue('RECEPTIONIST')
        vi.mocked(getSessionUser).mockReturnValue({
            role: 'RECEPTIONIST',
            roles: ['RECEPTIONIST', 'CLINICAL_DIRECTOR'],
            permissions: [],
        })

        const { result } = renderHook(() => useRole())

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.role).toBe('RECEPTIONIST')
        expect(result.current.roles).toEqual(['RECEPTIONIST', 'CLINICAL_DIRECTOR'])
        expect(result.current.isRole('CLINICAL_DIRECTOR')).toBe(true)
        expect(result.current.isRole(['DOCTOR', 'CLINICAL_DIRECTOR'])).toBe(true)
    })
})

