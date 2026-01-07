'use client'

import { useState, useEffect } from 'react'
import { UserRole, ROLE_PERMISSIONS } from '@/lib/utils/auth'

export function useRole() {
    const [role, setRole] = useState<UserRole | null>(null)
    const [permissions, setPermissions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkRole = () => {
            const item = localStorage.getItem('user')
            if (item) {
                try {
                    const user = JSON.parse(item)
                    if (user.role) {
                        setRole(user.role.toUpperCase() as UserRole)
                    }
                    if (user.permissions) {
                        setPermissions(user.permissions)
                    }
                } catch (e) {
                    console.error('Failed to parse user from localStorage', e)
                }
            }
            setIsLoading(false)
        }

        checkRole()
        // Listen for storage changes (in case of login/logout in other tabs)
        window.addEventListener('storage', checkRole)
        return () => window.removeEventListener('storage', checkRole)
    }, [])

    const hasPermission = (permission: string | keyof typeof ROLE_PERMISSIONS) => {
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
        if (permission in ROLE_PERMISSIONS) {
            return ROLE_PERMISSIONS[permission as keyof typeof ROLE_PERMISSIONS].includes(role as any)
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
