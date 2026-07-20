'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { canAccessDashboardRoute, getRoleDefaultDashboardRoute } from '@/lib/authz/policy'
import { useRole } from '@/hooks/useRole'
import { getSessionUser } from '@/lib/utils/auth'
import { useMe } from '@/hooks/api/useAuth'
import { Spinner } from '@/components/ui/spinner'
import toast from 'react-hot-toast'

type DashboardRouteGuardProps = {
    children: React.ReactNode
}

export function DashboardRouteGuard({ children }: DashboardRouteGuardProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { role, roles, permissions, isLoading } = useRole()
    // Trust BOTH the persisted session and the in-memory React-Query ['me'] that
    // useLogin seeds on success. A transient localStorage read (e.g. before the write
    // flushes, or in a restricted-storage context) must not bounce a valid login.
    const { data: meData } = useMe()
    const hasSessionUser = Boolean(getSessionUser()) || Boolean(meData)

    const hasAccess = !isLoading && hasSessionUser
        ? canAccessDashboardRoute(role, pathname || '/dashboard', { roles, permissions })
        : null // null = still deciding

    useEffect(() => {
        if (hasAccess === false) {
            const fallback = getRoleDefaultDashboardRoute(role)
            toast.error("You don't have permission to access that page.", { id: 'route-denied' })
            router.replace(fallback)
        }
    }, [hasAccess, role, router])

    // Render a loader while deciding (never render children prematurely)
    if (isLoading || !hasSessionUser || hasAccess === null || hasAccess === false) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner />
            </div>
        )
    }

    return <>{children}</>
}
