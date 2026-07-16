'use client'

import { useEffect, Suspense, useState } from "react"
import { motion } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"
import { usePathname, useRouter } from "next/navigation"
import { AUTH_EVENTS, getUserRole, isAuthInitialized, onAuthInitialized } from "@/lib/utils/auth"
import { canAccessDashboardRoute, getRoleDefaultDashboardRoute } from "@/lib/authz/policy"
import { useSessionUser } from "@/hooks/useSessionUser"

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
  const [isLoading, setIsLoading] = useState(true)
  const sessionUser = useSessionUser()

  useEffect(() => {
    const ensureAuthenticated = () => {
      // sessionUser is derived from React Query ['me'] (seeded by useLogin)
      // with localStorage as fallback — never blocks a fresh login on a
      // stale/cleared localStorage read.
      if (!sessionUser) {
        router.replace('/login')
        return
      }

      const role = getUserRole()
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
      ensureAuthenticated()
    } else {
      // Wait for auth to be initialized
      const unsubscribe = onAuthInitialized(() => {
        ensureAuthenticated()
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
  }, [pathname, router, sessionUser])

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
