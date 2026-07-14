'use client'

import React, { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  type LucideIcon,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  DollarSign,
  Pill,
  Microscope,
  UserCog,
  Settings,
  UserPlus,
  Image as ImageIcon,
  BarChart3,
  FileJson,
  CheckCircle,
  Bell,
} from "lucide-react"

import { UserRole, getSessionUser, getUserRole, isAuthInitialized, onAuthInitialized, AUTH_EVENTS } from "@/lib/utils/auth"
import { useUIStore } from "@/lib/stores/uiStore"
import { getDashboardNavigationForRole } from "@/lib/authz/policy"
import { useUnreadCount } from "@/hooks/useNotifications"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

const NAV_ICONS_BY_HREF: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/dashboard/reception': UserPlus,
  '/dashboard/doctor/patients': Users,
  '/dashboard/doctor/consultations': Stethoscope,
  '/dashboard/doctor/schedule': CalendarDays,
  '/dashboard/notifications': Bell,
  '/dashboard/lab': Microscope,
  '/dashboard/radiology': ImageIcon,
  '/dashboard/pharmacy': Pill,
  '/dashboard/billing': DollarSign,
  '/dashboard/cashier/close': DollarSign,
  '/dashboard/doctor/records': FileText,
  '/dashboard/admin': UserCog,
  '/dashboard/admin/tariffs': FileJson,
  '/dashboard/admin/roles': UserCog,
  '/dashboard/reports': BarChart3,
  '/dashboard/approvals': CheckCircle,
}

export function Sidebar({ className }: { className?: string }) {
  const [userRole, setUserRole] = useState<UserRole>('DOCTOR')
  const [sessionUserState, setSessionUserState] = useState<{ roles: string[]; permissions: string[] }>({
    roles: [],
    permissions: [],
  })
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const mobileNavOpen = useUIStore((state) => state.mobileNavOpen)
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen)
  const { data: unreadCount = 0 } = useUnreadCount()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    
    const checkRole = () => {
      const role = getUserRole()
      const sessionUser = getSessionUser()

      if (role) {
        setUserRole(role)
      }

      setSessionUserState({
        roles: Array.isArray(sessionUser?.roles) ? sessionUser.roles : [],
        permissions: Array.isArray(sessionUser?.permissions) ? sessionUser.permissions : [],
      })
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
      setUserRole('DOCTOR')
      setSessionUserState({ roles: [], permissions: [] })
    }
    window.addEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)
    
    return () => {
      window.removeEventListener('storage', checkRole)
      window.removeEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)
    }
  }, [])

  const roleForFiltering = mounted ? userRole : 'DOCTOR'

  const filteredNavItems: NavItem[] = getDashboardNavigationForRole(roleForFiltering, {
    roles: sessionUserState.roles,
    permissions: sessionUserState.permissions,
  }).map((item) => ({
    ...item,
    icon: NAV_ICONS_BY_HREF[item.href] ?? LayoutDashboard,
  }))

  return (
    <>
    {/* Mobile drawer overlay */}
    {mobileNavOpen ? (
      <button
        type="button"
        className="fixed inset-0 z-40 bg-foreground/40 md:hidden"
        aria-label="Close navigation"
        onClick={() => setMobileNavOpen(false)}
      />
    ) : null}
    <div className={cn(
      "flex flex-col h-full border-r bg-card p-4 shadow-sm animate-slide-in-right transition-all duration-300",
      "fixed inset-y-0 left-0 z-50 w-64 md:static md:z-auto",
      mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      sidebarCollapsed ? "md:w-20" : "md:w-64",
      className
    )}>
      {/* Logo */}
      <div className={cn(
        "mb-8 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border transition-all duration-300",
        sidebarCollapsed && "md:p-2"
      )}>
        <div className={cn(
          "flex items-center",
          sidebarCollapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground leading-tight">EMR</h1>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">
                {userRole} PORTAL
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
        {filteredNavItems.map((item) => {
          const currentPath = pathname?.replace(/\/$/, '') || ''
          const itemPath = item.href.replace(/\/$/, '')
          
          const isActive = currentPath === itemPath
          const isNotifications = item.href === '/dashboard/notifications'
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "group relative flex items-center rounded-lg p-3 text-sm font-medium transition-all",
                sidebarCollapsed ? "md:justify-center space-x-3 md:space-x-0" : "space-x-3",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-primary/15 hover:text-foreground"
              )}
              title={sidebarCollapsed ? item.title : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0",
                isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
              )} />
              {!sidebarCollapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span>{item.title}</span>
                  {isNotifications && unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-5 min-w-5 px-1.5 text-[10px]"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              )}
              {sidebarCollapsed && isNotifications && unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute right-3 top-2 h-4 min-w-4 px-1 text-[9px]"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 pt-4 border-t space-y-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "w-full text-muted-foreground hover:text-foreground",
            sidebarCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={() => router.push('/dashboard/settings')}
          title={sidebarCollapsed ? "Settings" : undefined}
        >
          <Settings className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
          {!sidebarCollapsed && "Settings"}
        </Button>
      </div>
    </div>
    {/* Desktop spacer so fixed mobile drawer doesn't collapse layout on md+ */}
    <div
      className={cn(
        "hidden md:block shrink-0 transition-all duration-300",
        sidebarCollapsed ? "w-20" : "w-64",
      )}
      aria-hidden
    />
    </>
  )
}
