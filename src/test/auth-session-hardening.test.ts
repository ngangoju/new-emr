import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    AUTH_EVENTS,
    clearSession,
    getAccessToken,
    getSessionUser,
    setAccessToken,
    setSessionUser,
} from '@/lib/utils/auth'

describe('auth session hardening', () => {
    beforeEach(() => {
        localStorage.clear()
        setAccessToken('')
        clearSession({ redirectToLogin: false })
    })

    it('keeps access token in memory only', () => {
        setAccessToken('in-memory-token')

        expect(getAccessToken()).toBe('in-memory-token')
        expect(localStorage.getItem('accessToken')).toBe('in-memory-token')
    })

    it('recovers persisted access token into memory for bootstrap continuity', async () => {
        localStorage.setItem('accessToken', 'persisted-token')

        vi.resetModules()
        const { getAccessToken: getAccessTokenFromFreshModule } = await import('@/lib/utils/auth')

        expect(getAccessTokenFromFreshModule()).toBe('persisted-token')
    })

    it('clears legacy session keys and dispatches a session-cleared event', () => {
        localStorage.setItem('accessToken', 'x')
        localStorage.setItem('refreshToken', 'y')
        localStorage.setItem('token', 'z')
        localStorage.setItem('user', JSON.stringify({ username: 'alice' }))
        localStorage.setItem('userRole', 'DOCTOR')

        const listener = vi.fn()
        window.addEventListener(AUTH_EVENTS.SESSION_CLEARED, listener as EventListener)

        clearSession({ redirectToLogin: false, reason: 'unauthorized' })

        expect(getAccessToken()).toBeNull()
        expect(localStorage.getItem('accessToken')).toBeNull()
        expect(localStorage.getItem('refreshToken')).toBeNull()
        expect(localStorage.getItem('token')).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
        expect(localStorage.getItem('userRole')).toBeNull()
        expect(listener).toHaveBeenCalledTimes(1)

        const event = listener.mock.calls[0][0] as CustomEvent<{ reason: string }>
        expect(event.detail.reason).toBe('unauthorized')
    })

    it('returns null and sanitizes invalid stored user payload', () => {
        localStorage.setItem('user', '{invalid-json')

        expect(getSessionUser()).toBeNull()
        expect(localStorage.getItem('user')).toBeNull()
    })

    it('reads valid stored session user payload', () => {
        setSessionUser({ username: 'doctor1', role: 'DOCTOR', permissions: ['*'] })

        expect(getSessionUser()).toEqual({ username: 'doctor1', role: 'DOCTOR', permissions: ['*'] })
    })
})

describe('api unauthorized handling', () => {
    it('attaches in-memory token in request interceptor', async () => {
        vi.resetModules()
        vi.doMock('react-hot-toast', () => ({ default: { error: vi.fn() } }))

        const handleUnauthorized = vi.fn()
        vi.doMock('@/lib/utils/auth', () => ({
            getAccessToken: () => 'jwt-token',
            handleUnauthorized,
        }))

        const { api } = await import('@/lib/api')
        const requestFulfilled = (api.interceptors.request as any).handlers[0].fulfilled

        const config = await requestFulfilled({ headers: {} })
        expect(config.headers.Authorization).toBe('Bearer jwt-token')
    })

    it('calls unauthorized handler on 401 responses', async () => {
        vi.resetModules()
        vi.doMock('react-hot-toast', () => ({ default: { error: vi.fn() } }))

        const handleUnauthorized = vi.fn()
        vi.doMock('@/lib/utils/auth', () => ({
            getAccessToken: () => null,
            handleUnauthorized,
        }))

        const { api } = await import('@/lib/api')
        const responseRejected = (api.interceptors.response as any).handlers[0].rejected

        await expect(responseRejected({ response: { status: 401, data: { message: 'Unauthorized' } } })).rejects.toBeDefined()
        expect(handleUnauthorized).toHaveBeenCalledTimes(1)
    })

    it('handles 403 as forbidden feedback without clearing session', async () => {
        vi.resetModules()

        const toastError = vi.fn()
        vi.doMock('react-hot-toast', () => ({ default: { error: toastError } }))

        const handleUnauthorized = vi.fn()
        vi.doMock('@/lib/utils/auth', () => ({
            getAccessToken: () => 'jwt-token',
            handleUnauthorized,
        }))

        const { api } = await import('@/lib/api')
        const responseRejected = (api.interceptors.response as any).handlers[0].rejected

        await expect(responseRejected({ response: { status: 403, data: { message: 'Forbidden' } } })).rejects.toBeDefined()

        expect(handleUnauthorized).not.toHaveBeenCalled()
        expect(toastError).toHaveBeenCalledTimes(1)
        expect(toastError).toHaveBeenCalledWith('You are not allowed to perform this action.')
    })
})
