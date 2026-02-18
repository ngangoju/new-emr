'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import { useRole } from '@/hooks/useRole'
import { getAccessToken } from '@/lib/utils/auth'
import { Spinner } from '@/components/ui/spinner'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'

type DashboardRouteGuardProps = {
    children: React.ReactNode
}

export function DashboardRouteGuard({ children }: DashboardRouteGuardProps) {
    const pathname = usePathname()
    const { role, isLoading } = useRole()
    const hasToken = Boolean(getAccessToken())

    if (isLoading || !hasToken) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner />
            </div>
        )
    }

    if (!canAccessDashboardRoute(role, pathname || '/dashboard')) {
        return <ForbiddenAccess />
    }

    return <>{children}</>
}
