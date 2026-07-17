'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import { useRole } from '@/hooks/useRole'
import { getSessionUser } from '@/lib/utils/auth'
import { useMe } from '@/hooks/api/useAuth'
import { Spinner } from '@/components/ui/spinner'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'

type DashboardRouteGuardProps = {
    children: React.ReactNode
}

export function DashboardRouteGuard({ children }: DashboardRouteGuardProps) {
    const pathname = usePathname()
    const { role, roles, permissions, isLoading } = useRole()
    // Trust BOTH the persisted session and the in-memory React-Query ['me'] that
    // useLogin seeds on success. A transient localStorage read (e.g. before the write
    // flushes, or in a restricted-storage context) must not bounce a valid login.
    const { data: meData } = useMe()
    const hasSessionUser = Boolean(getSessionUser()) || Boolean(meData)

    if (isLoading || !hasSessionUser) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner />
            </div>
        )
    }

    if (!canAccessDashboardRoute(role, pathname || '/dashboard', { roles, permissions })) {
        return <ForbiddenAccess />
    }

    return <>{children}</>
}
