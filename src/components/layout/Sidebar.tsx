'use client'

import React, { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import Link from "next/link"
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
} from "lucide-react"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Patients", href: "/dashboard/doctor/patients", icon: Users },
  { title: "Consultations", href: "/dashboard/doctor/consultations", icon: Stethoscope },
  { title: "Schedule", href: "/dashboard/doctor/schedule", icon: CalendarDays },
  { title: "Records", href: "/dashboard/doctor/records", icon: FileText },
  { title: "Billing", href: "/dashboard/billing", icon: DollarSign },
  { title: "Pharmacy", href: "/dashboard/pharmacy", icon: Pill },
  { title: "Lab", href: "/dashboard/lab", icon: Microscope },
  { title: "Admin", href: "/dashboard/admin", icon: UserCog },
]

export function Sidebar({ className }: { className?: string }) {
  const [userRole, setUserRole] = useState('Doctor')

  useEffect(() => {
    const item = localStorage.getItem('user')
    if (item) {
      try {
        const user = JSON.parse(item)
        if (user.role) {
          // Capitalize first letter
          setUserRole(user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase())
        }
      } catch (e) {
        // ignore
      }
    }
  }, [])

  return (
    <div className={cn("flex flex-col h-full w-64 border-r bg-card p-4 shadow-sm animate-slide-in-right", className)}>
      {/* Logo */}
      <div className="mb-8 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground leading-tight">EMR</h1>
            <p className="text-xs text-muted-foreground font-medium">{userRole} Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center space-x-3 rounded-lg p-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="h-5 w-5 shrink-0 opacity-80 group-hover:opacity-100" />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 pt-8 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}