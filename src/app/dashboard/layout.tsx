'use client'

import { useEffect, Suspense, useState } from "react"
import { motion } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AUTH_EVENTS, getSessionUser, getUserRole, isAuthInitialized, onAuthInitialized } from "@/lib/utils/auth"
import { canAccessDashboardRoute, getRoleDefaultDashboardRoute } from "@/lib/authz/policy"

import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { CommandPalette } from "@/components/layout/CommandPalette"
import { DashboardRouteGuard } from "@/components/auth/DashboardRouteGuard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const ensureAuthenticated = async () => {
      // Trust EITHER the persisted session OR the in-memory React-Query ['me']
      // that useLogin seeds on success. A transient localStorage read must not
      // bounce a valid login back to /login (redirect loop bug).
      let meData = queryClient.getQueryData(['me']) as { id?: string; role?: string } | null | undefined
      let sessionUser = getSessionUser() ?? meData ?? null

      // Grace path for F-003: on a hard reload the in-memory cache is empty but
      // the HttpOnly cookie may still be valid. Probe /auth/me once before deciding.
      if (!sessionUser) {
        try {
          const res = await fetch('/backend/auth/me', { credentials: 'include' })
          if (res.ok) {
            meData = await res.json() as { id?: string; role?: string }
            sessionUser = meData ?? null
          }
        } catch {
          // Network error — fall through to redirect
        }
      }

      if (!sessionUser) {
        router.replace('/login')
        return
      }

      const role = getUserRole() ?? (meData?.role as never) ?? null
      const currentPath = pathname || '/dashboard'
      const hasRouteAccess = canAccessDashboardRoute(role, currentPath)

      if (!hasRouteAccess) {
        const fallback = getRoleDefaultDashboardRoute(role)
        router.replace(fallback)
      }
      
      setIsLoading(false)
    }

    // If auth is already initialized, check immediately
    if (isAuthInitialized()) {
      void ensureAuthenticated()
    } else {
      // Wait for auth to be initialized
      const unsubscribe = onAuthInitialized(() => {
        void ensureAuthenticated()
      })
      return unsubscribe
    }

    const handleSessionCleared = () => {
      router.replace('/login')
    }

    window.addEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)

    return () => {
      window.removeEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)
    }
  }, [pathname, router, queryClient])


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <CommandPalette />
        <Suspense fallback={<div className="flex h-screen items-center justify-center p-8">
          <Spinner />
        </div>}>
          <motion.main
            className="flex-1 p-6 lg:p-8 overflow-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardRouteGuard>
              {children}
            </DashboardRouteGuard>
          </motion.main>
        </Suspense>
      </div>
    </div>
  )
}
