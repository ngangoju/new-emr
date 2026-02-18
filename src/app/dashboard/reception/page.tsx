'use client'

import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Calendar, Clock, Search, Activity } from 'lucide-react'
import Link from 'next/link'
import { useRole } from '@/hooks/useRole'
import { useQueueStats } from '@/hooks/useQueue'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'
import { TriageQueue } from '@/components/clinical/TriageQueue'
import { CheckInModal } from '@/components/shared/CheckInModal'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReceptionPage() {
  const router = useRouter()
  const { role, isLoading: roleLoading } = useRole()
  const { data: stats, isLoading: statsLoading } = useQueueStats()
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)

  if (!roleLoading && !canAccessDashboardRoute(role, '/dashboard/reception')) {
    return <ForbiddenAccess />
  }

  const actions = [
    {
      title: "Check-in Patient",
      description: "Assign patient to queue and set triage priority",
      icon: UserPlus,
      onClick: () => setIsCheckInModalOpen(true),
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Register New Patient",
      description: "Create a new patient record in the system",
      icon: Users,
      href: "/dashboard/doctor/patients",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Appointments",
      description: "Manage and schedule patient visits",
      icon: Calendar,
      href: "/dashboard/doctor/schedule",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Patient Records",
      description: "Search and view historic patient files",
      icon: Search,
      href: "/dashboard/doctor/patients",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title="Reception & Triage"
        description="Patient check-in, triage priority management, and live visit queue monitoring."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((action) => (
          <div key={action.title} onClick={action.onClick ? action.onClick : undefined}>
            <Link href={action.href || '#'}>
              <Card className="hover:shadow-lg transition-all cursor-pointer group h-full border-none shadow-sm">
                <CardHeader>
                  <div className={`${action.bgColor} ${action.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">{action.title}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      <CheckInModal 
        open={isCheckInModalOpen} 
        onOpenChange={setIsCheckInModalOpen} 
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <TriageQueue />
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Queue Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl backdrop-blur-md">
                  <span className="text-sm font-bold opacity-80 uppercase tracking-wider">Waiting</span>
                  <span className="text-3xl font-black">{stats?.waitingCount || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl backdrop-blur-md">
                  <span className="text-sm font-bold opacity-80 uppercase tracking-wider">Seen Today</span>
                  <span className="text-3xl font-black">{stats?.seenTodayCount || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 border-slate-200"
                onClick={() => router.push('/dashboard/doctor/patients')}
              >
                <Users className="h-4 w-4 text-primary" />
                Recent Patients
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 border-slate-200"
                onClick={() => router.push('/dashboard/doctor/schedule')}
              >
                <Calendar className="h-4 w-4 text-primary" />
                Calendar View
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 border-slate-200"
                onClick={() => setIsCheckInModalOpen(true)}
              >
                <Activity className="h-4 w-4 text-red-500" />
                Emergency Check-in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
