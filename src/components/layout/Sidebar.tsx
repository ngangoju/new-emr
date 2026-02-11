'use client'

import React, { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  FileText,
  DollarSign,
  Pill,
  Microscope,
  UserCog,
  Settings,
  ClipboardList,
  UserPlus,
} from "lucide-react"

import { UserRole } from "@/lib/utils/auth"
import { useUIStore } from "@/lib/stores/uiStore"

interface NavItem {
  title: string
  href: string
  icon: any
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { 
    title: "Dashboard", 
    href: "/dashboard", 
    icon: LayoutDashboard 
  },
  { 
    title: "Reception", 
    href: "/dashboard/reception", 
    icon: UserPlus,
    roles: ['ADMIN', 'RECEIPTION', 'RECEPTIONIST', 'CUSTOMER-CARE']
  },
  { 
    title: "Patients", 
    href: "/dashboard/doctor/patients", 
    icon: Users,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEIPTION', 'RECEPTIONIST', 'CUSTOMER-CARE', 'CHIEF-NURSE', 'CLINICAL-DIRECTOR']
  },
  { 
    title: "Consultations", 
    href: "/dashboard/doctor/consultations", 
    icon: Stethoscope,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF-NURSE', 'CLINICAL-DIRECTOR']
  },
  { 
    title: "Schedule", 
    href: "/dashboard/doctor/schedule", 
    icon: CalendarDays,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF-NURSE', 'CLINICAL-DIRECTOR', 'RECEIPTION', 'RECEPTIONIST']
  },
  { 
    title: "Lab Results", 
    href: "/dashboard/lab", 
    icon: Microscope,
    roles: ['ADMIN', 'LABORANTIN', 'LAB_TECH', 'DOCTOR', 'NURSE', 'CLINICAL-DIRECTOR', 'RADIOLOGIST']
  },
  { 
    title: "Pharmacy", 
    href: "/dashboard/pharmacy", 
    icon: Pill,
    roles: ['ADMIN', 'STORE', 'PHARMACIST', 'DOCTOR', 'CLINICAL-DIRECTOR']
  },
  { 
    title: "Billing", 
    href: "/dashboard/billing", 
    icon: DollarSign,
    roles: ['ADMIN', 'BILLING_OFFICER', 'CASHIER', 'DAF', 'COO']
  },
  { 
    title: "Medical Records", 
    href: "/dashboard/doctor/records", 
    icon: FileText,
    roles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF-NURSE', 'CLINICAL-DIRECTOR']
  },
  { 
    title: "Admin", 
    href: "/dashboard/admin", 
    icon: UserCog,
    roles: ['ADMIN', 'MANAGER', 'DAF', 'COO', 'HUMAN-RESOURCE']
  },
]

export function Sidebar({ className }: { className?: string }) {
  const [userRole, setUserRole] = useState<UserRole>('DOCTOR')
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)

  useEffect(() => {
    setMounted(true)
    const item = localStorage.getItem('user')
    if (item) {
      try {
        const user = JSON.parse(item)
        if (user.role) {
          setUserRole(user.role.toUpperCase() as UserRole)
        }
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const filteredNavItems = mounted 
    ? navItems.filter(item => !item.roles || item.roles.includes(userRole))
    : navItems.filter(item => !item.roles || item.roles.includes('DOCTOR'))

  return (
    <div className={cn(
      "flex flex-col h-full border-r bg-card p-4 shadow-sm animate-slide-in-right transition-all duration-300",
      sidebarCollapsed ? "w-20" : "w-64",
      className
    )}>
      {/* Logo */}
      <div className={cn(
        "mb-8 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border transition-all duration-300",
        sidebarCollapsed && "p-2"
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
          
          const isActive = itemPath === '/dashboard' 
            ? currentPath === '/dashboard'
            : currentPath === itemPath || currentPath.startsWith(itemPath + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg p-3 text-sm font-medium transition-all",
                sidebarCollapsed ? "justify-center" : "space-x-3",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              title={sidebarCollapsed ? item.title : undefined}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0",
                isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
              )} />
              {!sidebarCollapsed && <span>{item.title}</span>}
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
  )
}