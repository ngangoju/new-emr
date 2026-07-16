'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UserRole, getSessionUser, getUserRole, isAuthInitialized, onAuthInitialized, AUTH_EVENTS, normalizeRole } from '@/lib/utils/auth'
import { FRONTEND_FEATURE_POLICY } from '@/lib/authz/policy'
import { canAccessFeature, getEffectiveRoles, hasAnyDynamicPermissions, hasDynamicPermission, normalizeRoles } from '@/lib/authz/capability'
import type { SessionUser } from '@/lib/utils/auth'

export function useRole() {
    const queryClient = useQueryClient()
    const [role, setRole] = useState<UserRole | null>(null)
    const [roles, setRoles] = useState<UserRole[]>([])
    const [permissions, setPermissions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkRole = () => {
            // Prefer the React Query ['me'] cache (seeded synchronously by
            // useLogin) so role resolves immediately after login without
            // depending on a localStorage read that may be stale/cleared.
            const cachedMe = queryClient.getQueryData<SessionUser | null>(['me'])
            const user = (cachedMe && typeof cachedMe === 'object' ? cachedMe : getSessionUser()) ?? undefined

            const normalizedPrimaryRole = normalizeRole(user?.role) ?? getUserRole()
            setRole(normalizedPrimaryRole)

            const normalizedRoles = normalizeRoles(user?.roles ?? [])
            setRoles(normalizedRoles)

            setPermissions(user?.permissions ?? [])
            setIsLoading(false)
        }

        // If auth is already initialized, check immediately
        if (isAuthInitialized()) {
            checkRole()
        } else {
            // Wait for auth to be initialized
            const unsubscribe = onAuthInitialized(() => {
                checkRole()
            })
            return unsubscribe
        }

        // Listen for storage changes (in case of login/logout in other tabs)
        window.addEventListener('storage', checkRole)

        // Listen for session cleared events
        const handleSessionCleared = () => {
            setRole(null)
            setRoles([])
            setPermissions([])
            setIsLoading(false)
        }
        window.addEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)

        return () => {
            window.removeEventListener('storage', checkRole)
            window.removeEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)
        }
    }, [queryClient])

    const hasPermission = (permission: string | keyof typeof FRONTEND_FEATURE_POLICY) => {
        const effectiveRoles = getEffectiveRoles({ role, roles })
        const permissionToCheck = String(permission)

        // 1) Dynamic permissions first (JWT/backend)
        if (hasAnyDynamicPermissions(permissions) && hasDynamicPermission(permissions, [permissionToCheck])) {
            return true
        }

        // 2) Legacy fallback only for known frontend feature permissions
        if (permission in FRONTEND_FEATURE_POLICY) {
            return canAccessFeature(permission as keyof typeof FRONTEND_FEATURE_POLICY, {
                role,
                roles: effectiveRoles,
                permissions,
            })
        }

        return false
    }

    const isRole = (checkRoles: UserRole | UserRole[]) => {
        const effectiveRoles = getEffectiveRoles({ role, roles })
        if (effectiveRoles.length === 0) return false

        if (Array.isArray(checkRoles)) {
            return checkRoles.some((checkRole) => effectiveRoles.includes(checkRole))
        }
        return effectiveRoles.includes(checkRoles)
    }

    return { role, roles, permissions, isLoading, hasPermission, isRole }
}
