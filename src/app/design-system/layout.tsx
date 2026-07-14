'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { getSessionUser, getUserRole, isAuthInitialized, onAuthInitialized } from '@/lib/utils/auth'
import { normalizeUserRole } from '@/lib/authz/policy'

/**
 * Auth-gate the living style guide. Public access removed (Phase 0).
 * Restricted to ADMIN (and clinical leadership that already has admin-adjacent access).
 */
const DESIGN_SYSTEM_ROLES = new Set(['ADMIN', 'CLINICAL_DIRECTOR', 'MANAGER', 'COO'])

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const gate = () => {
      const user = getSessionUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const role = normalizeUserRole(getUserRole() || user.role)
      if (!role || !DESIGN_SYSTEM_ROLES.has(role)) {
        router.replace('/dashboard')
        return
      }
      setReady(true)
    }

    if (isAuthInitialized()) {
      gate()
    } else {
      return onAuthInitialized(gate)
    }
  }, [router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}
