'use client'

import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Calendar, Clock, Search } from 'lucide-react'
import Link from 'next/link'
import { useRole } from '@/hooks/useRole'
import { redirect } from 'next/navigation'

export default function ReceptionPage() {
  const { isRole, isLoading, hasPermission } = useRole()

  if (!isLoading && !isRole(['ADMIN', 'RECEPTIONIST', 'RECEIPTION', 'CUSTOMER-CARE'])) {
    redirect('/dashboard')
  }

  const actions = [
    {
      title: "Register New Patient",
      description: "Create a new patient record in the system",
      icon: UserPlus,
      href: "/dashboard/doctor/patients",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Appointment Scheduling",
      description: "Manage and schedule patient visits",
      icon: Calendar,
      href: "/dashboard/doctor/schedule",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Visit Queue",
      description: "Monitor and manage current patient flow",
      icon: Clock,
      href: "/dashboard",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Search Records",
      description: "Find existing patient files quickly",
      icon: Search,
      href: "/dashboard/doctor/patients",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Reception Management"
        description="Daily patient registration, scheduling, and queue management"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="hover:shadow-lg transition-all cursor-pointer group h-full">
              <CardHeader>
                <div className={`${action.bgColor} ${action.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-heading">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">New Registrations</span>
                <span className="text-2xl font-bold">12</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Scheduled Appointments</span>
                <span className="text-2xl font-bold">45</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Active in Queue</span>
                <span className="text-2xl font-bold">8</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-5 w-5" />
              Recent Patients
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="h-5 w-5" />
              Calendar View
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
