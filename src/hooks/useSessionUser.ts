'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getSessionUser, type SessionUser } from '@/lib/utils/auth'

/**
 * Single source of truth for "who is logged in" on the client.
 *
 * Why this exists: `useLogin` seeds React Query's `['me']` cache with the user
 * the moment login resolves, but the dashboard guard previously read ONLY
 * `localStorage` via `getSessionUser()`. On the first navigation after login
 * there is a window where the guard's effect can run before/while the
 * localStorage write settles (or after a stale read), and `getSessionUser()`
 * returns null — which bounces a freshly-authenticated user back to /login.
 *
 * This hook prefers the in-memory `['me']` cache (authoritative, set
 * synchronously by `useLogin`) and falls back to `getSessionUser()` for cases
 * where the cache is cold (e.g. a hard refresh that rehydrates from
 * localStorage). Either source is sufficient to prove an authenticated session.
 */
export function useSessionUser(): SessionUser | null {
    const queryClient = useQueryClient()
    const cachedMe = queryClient.getQueryData<SessionUser | null>(['me'])

    return useMemo(() => {
        if (cachedMe && typeof cachedMe === 'object') return cachedMe
        return getSessionUser()
    }, [cachedMe])
}
