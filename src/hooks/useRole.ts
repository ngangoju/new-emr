'use client'

import { useState, useEffect } from 'react'
import { UserRole, getSessionUser, getUserRole, isAuthInitialized, onAuthInitialized, AUTH_EVENTS } from '@/lib/utils/auth'
import { FRONTEND_FEATURE_POLICY } from '@/lib/authz/policy'

export function useRole() {
    const [role, setRole] = useState<UserRole | null>(null)
    const [permissions, setPermissions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkRole = () => {
            const role = getUserRole()
            if (role) {
                setRole(role)
            }

            const user = getSessionUser()
            if (user && user.permissions) {
                setPermissions(user.permissions)
            }
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
            setPermissions([])
            setIsLoading(false)
        }
        window.addEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)

        return () => {
            window.removeEventListener('storage', checkRole)
            window.removeEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)
        }
    }, [])

    const hasPermission = (permission: string | keyof typeof FRONTEND_FEATURE_POLICY) => {
        if (!role) return false

        // 1. Check backend permissions array (from JWT)
        if (permissions.length > 0) {
            // Check for exact match or wildcard match (e.g. '*' or 'patient:*')
            const isAuthorized = permissions.some(p => {
                if (p === '*') return true;
                if (p.endsWith(':*')) {
                    const prefix = p.split(':')[0];
                    return typeof permission === 'string' && permission.startsWith(prefix);
                }
                return p === permission;
            });
            if (isAuthorized) return true;
        }

        // 2. Fallback to local role-based permissions (for backward compatibility)
        if (permission in FRONTEND_FEATURE_POLICY) {
            return FRONTEND_FEATURE_POLICY[permission as keyof typeof FRONTEND_FEATURE_POLICY].includes(role)
        }

        return false;
    }

    const isRole = (checkRoles: UserRole | UserRole[]) => {
        if (!role) return false
        if (Array.isArray(checkRoles)) {
            return checkRoles.includes(role)
        }
        return role === checkRoles
    }

    return { role, permissions, isLoading, hasPermission, isRole }
}
