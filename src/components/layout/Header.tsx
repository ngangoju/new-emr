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
import { Bell, Search, Menu, User, Settings, LogOut, Sun, Moon } from "lucide-react"
import { useUIStore } from "@/lib/stores/uiStore"
import { AUTH_EVENTS, clearSession, getSessionUser } from '@/lib/utils/auth'
import { getDashboardNavigationForRole, normalizeUserRole } from '@/lib/authz/policy'
import { findDashboardSearchTarget } from '@/lib/utils/dashboardSearch'

export function Header() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>({ 
    username: 'User', 
    name: 'User',
    role: 'user' 
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <p className="font-medium">New consultation request</p>
                <p className="text-xs text-muted-foreground">John Doe - 10 min ago</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <p className="font-medium">Lab results ready</p>
                <p className="text-xs text-muted-foreground">Jane Smith - 1 hour ago</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <p className="font-medium">Patient checked in</p>
                <p className="text-xs text-muted-foreground">Bob Wilson - 2 hours ago</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="w-full text-center">
                View all notifications
              </DropdownMenuItem>
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
