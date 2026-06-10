'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
  import { Bell, Search, Menu, User, Settings, LogOut, Sun, Moon, Loader2, CheckCheck } from "lucide-react"
import { useUIStore } from "@/lib/stores/uiStore"
import { AUTH_EVENTS, clearSession, getSessionUser, type SessionUser } from '@/lib/utils/auth'
import { getDashboardNavigationForRole, normalizeUserRole } from '@/lib/authz/policy'
import { findDashboardSearchTarget } from '@/lib/utils/dashboardSearch'
  import { useUnreadCount, useNotificationsModule } from '@/hooks/useNotifications'
import { formatRelativeTime } from '@/lib/utils/date'
import { getNotificationColor } from '@/types/notification'

type HeaderUser = SessionUser & {
  name?: string
}

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<HeaderUser>({ 
    username: 'User', 
    name: 'User',
    role: 'user' 
  })
  const [mounted, setMounted] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Notification hooks
  const { data: unreadCount = 0, isLoading: isLoadingUnreadCount, refetch: refetchUnreadCount } = useUnreadCount()
  const { notifications = [], isLoading: isLoadingNotifications, markAsRead, markAllAsRead, isMarkingAllAsRead, refetch: refetchNotifications } = useNotificationsModule({ limit: 10 })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const sessionUser = getSessionUser()
    if (sessionUser) {
      setUser(sessionUser)
    }

    const handleSessionCleared = () => {
      setUser({ username: 'User', name: 'User', role: 'user' })
    }

    window.addEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)

    return () => window.removeEventListener(AUTH_EVENTS.SESSION_CLEARED, handleSessionCleared)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault()
        alert('Command palette stub - Cmd+K for quick search patients/invoices/consults')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Use username or name, whichever is available
  const displayName = user.name || user.username || 'User'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
 
  const isDarkMode = useUIStore((state) => state.isDarkMode)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
 
  const handleLogout = () => {
    clearSession({ redirectToLogin: false, reason: 'manual-logout' })
    router.replace('/login')
  }

  const handleDashboardSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const role = normalizeUserRole(user.role)
    const allowedTargets = getDashboardNavigationForRole(role)
    const target = findDashboardSearchTarget(searchQuery, allowedTargets)

    if (!target) {
      return
    }

    router.push(target.href)
  }

  // Handle notification dropdown open
  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open)
    if (open) {
      refetchNotifications()
      refetchUnreadCount()
    }
  }

  // Handle marking a notification as read
  const handleNotificationClick = async (notification: { id: string; isRead: boolean; entityType?: string; entityId?: string }) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
      refetchUnreadCount()
    }
    
    // Navigate to entity if applicable
    if (notification.entityType && notification.entityId) {
      const route = getEntityRoute(notification.entityType)
      if (route) {
        router.push(route)
        setNotificationsOpen(false)
      }
    }
  }

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    refetchUnreadCount()
  }

  // Helper to get route from entity type
  const getEntityRoute = (entityType: string): string | null => {
    switch (entityType) {
      case 'CONSULTATION': return `/dashboard/doctor/consultations`
      case 'LAB_ORDER': return `/dashboard/lab`
      case 'IMAGING_ORDER': return `/dashboard/radiology`
      case 'DRUG_REQUEST': return `/dashboard/pharmacy`
      case 'ADMISSION': return `/dashboard/nurse/admissions`
      case 'INVOICE': return `/dashboard/billing`
      case 'APPROVAL': return `/dashboard/approvals`
      case 'QUEUE_ENTRY': return `/dashboard/nurse`
      default: return null
    }
  }

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex flex-1 items-center space-x-2 md:justify-end">
            <div className="relative flex-1 flex md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="pl-10 pr-4 h-9 w-full" disabled />
            </div>
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full" disabled>
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full" disabled>
              <Sun className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full" disabled>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">?</div>
            </Button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button variant="ghost" size="sm" className="mr-4 hidden md:flex animate-scale-in" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex flex-1 items-center space-x-2 md:justify-end">
          <form className="relative flex-1 flex md:w-80" onSubmit={handleDashboardSearchSubmit}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search patients, consultations, appointments..."
              className="pl-10 pr-4 h-9 w-full"
            />
          </form>
          <DropdownMenu open={notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                {isLoadingUnreadCount ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full flex items-center justify-center text-[10px]"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" sideOffset={8}>
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAllAsRead}
                  >
                    {isMarkingAllAsRead ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <CheckCheck className="h-3 w-3 mr-1" />
                    )}
                    Mark all read
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <>
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <Bell className={`h-4 w-4 mt-0.5 ${getNotificationColor(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="w-full text-center text-sm"
                    onClick={() => {
                      router.push('/dashboard/notifications')
                      setNotificationsOpen(false)
                    }}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="h-9 w-9 rounded-full p-0"
            aria-label="Toggle dark mode"
          >
            <Sun className={`h-4 w-4 ${isDarkMode ? 'invisible' : ''}`} />
            <Moon className={`h-4 w-4 ${isDarkMode ? '' : 'invisible'}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-sm">
                  {initials}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.role?.toUpperCase() || 'USER'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
