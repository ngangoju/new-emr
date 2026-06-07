'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Spinner } from '@/components/ui/spinner'
import { useRole } from '@/hooks/useRole'
import { getRoleDefaultDashboardRoute } from '@/lib/authz/policy'

export function ForbiddenAccess() {
    const router = useRouter()
    const { role, isLoading } = useRole()

    useEffect(() => {
        if (isLoading) return
        router.replace(getRoleDefaultDashboardRoute(role))
    }, [isLoading, role, router])

    return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner />
            <p className="text-sm">Opening your workspace...</p>
        </div>
    )
}
