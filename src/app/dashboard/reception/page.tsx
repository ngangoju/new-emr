'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Calendar, Clock, Activity, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { useRole } from '@/hooks/useRole'
import { useQueueStats } from '@/hooks/useQueue'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'
import { TriageQueue } from '@/components/clinical/TriageQueue'
import { CheckInModal } from '@/components/shared/CheckInModal'
import { useRouter } from 'next/navigation'
import { ReceptionIntakeWorkspace } from '@/components/reception/ReceptionIntakeWorkspace'
import { PatientRegistrationModal } from '@/components/shared/PatientRegistrationModal'

export default function ReceptionPage() {
  const router = useRouter()
  const { role, isLoading: roleLoading, hasPermission } = useRole()
  const { data: stats } = useQueueStats({ enabled: !roleLoading })
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  const [isRegisterPatientOpen, setIsRegisterPatientOpen] = useState(false)
  const canRegisterPatient = hasPermission('CAN_REGISTER_PATIENT') || hasPermission('patient:create')
  const canCreateVisit = hasPermission('queue:manage') || canRegisterPatient
  const canManageSchedule = canAccessDashboardRoute(role, '/dashboard/doctor/schedule')
  const canPrepareAdmission = canAccessDashboardRoute(role, '/dashboard/reception/admit')

  if (!roleLoading && !canAccessDashboardRoute(role, '/dashboard/reception')) {
    return <ForbiddenAccess />
  }

  const actions = [
    {
      title: "Check-in Patient",
      description: "Create initial invoice, assign doctor, and send to triage",
      icon: UserPlus,
      onClick: () => setIsCheckInModalOpen(true),
      color: "text-red-600",
      bgColor: "bg-red-50",
      visible: canCreateVisit,
    },
    {
      title: "Register New Patient",
      description: "Create a new patient record in the system",
      icon: Users,
      onClick: () => setIsRegisterPatientOpen(true),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      visible: canRegisterPatient,
    },
    {
      title: "Appointments",
      description: "Manage and schedule patient visits",
      icon: Calendar,
      href: "/dashboard/doctor/schedule",
      color: "text-green-600",
      bgColor: "bg-green-50",
      visible: canManageSchedule,
    },
    {
      title: "Pre-Admission Intake",
      description: "Prepare bed request details for nursing review",
      icon: ClipboardCheck,
      href: "/dashboard/reception/admit",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      visible: canPrepareAdmission,
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title="Reception & Triage"
        description="Patient check-in, triage priority management, and live visit queue monitoring."
      />

      {canRegisterPatient && (
        <>
          <div className="flex justify-end">
            <Button size="lg" className="gap-2" onClick={() => setIsRegisterPatientOpen(true)}>
              <UserPlus className="h-4 w-4" />
              New Patient
            </Button>
          </div>
          <PatientRegistrationModal
            open={isRegisterPatientOpen}
            onOpenChange={setIsRegisterPatientOpen}
          />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.filter((action) => action.visible).map((action) => (
          <div key={action.title}>
            {action.href ? (
              <Link href={action.href}>
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
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (action.title === 'Check-in Patient') {
                    setIsCheckInModalOpen(true)
                    return
                  }
                  if (action.title === 'Register New Patient') {
                    setIsRegisterPatientOpen(true)
                  }
                }}
                className="group h-full min-h-[196px] w-full justify-start whitespace-normal rounded-xl p-0 text-left text-foreground hover:bg-transparent"
              >
                <span className="flex h-full w-full flex-col rounded-xl bg-card py-6 shadow-sm transition-all group-hover:shadow-lg">
                  <span className="grid auto-rows-min items-start gap-2 px-6">
                    <span className={`${action.bgColor} ${action.color} mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:rotate-12`}>
                      <action.icon className="h-6 w-6" />
                    </span>
                    <span className="text-xl font-bold tracking-tight">{action.title}</span>
                    <span className="text-sm font-medium text-slate-500">{action.description}</span>
                  </span>
                </span>
              </Button>
            )}
          </div>
        ))}
      </div>

      <CheckInModal 
        open={isCheckInModalOpen} 
        onOpenChange={setIsCheckInModalOpen} 
      />

      <ReceptionIntakeWorkspace />

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
              {canPrepareAdmission && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-slate-200"
                  onClick={() => router.push('/dashboard/reception/admit')}
                >
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  Pre-Admission Review
                </Button>
              )}
              {canManageSchedule && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-slate-200"
                  onClick={() => router.push('/dashboard/doctor/schedule')}
                >
                  <Calendar className="h-4 w-4 text-primary" />
                  Calendar View
                </Button>
              )}
              {canCreateVisit && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 border-slate-200"
                  onClick={() => setIsCheckInModalOpen(true)}
                >
                  <Activity className="h-4 w-4 text-red-500" />
                  Emergency Check-in
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
