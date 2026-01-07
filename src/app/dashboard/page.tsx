'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QueueBoard } from '@/components/doctor/QueueBoard'
import { ConsultationsChart } from '@/components/charts/ConsultationsChart'
import { PatientStatsChart } from '@/components/charts/PatientStatsChart'
import { 
  Users, 
  Clock, 
  Calendar, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Plus,
  FileText,
  CheckCircle, 
  Timer,
  TrendingUp,
  AlertCircle,
  ArrowRight 
} from 'lucide-react'
import { useDashboardStats, useTodayAppointments, useRecentPatients } from '@/hooks/api/useDashboard'

import { useRouter } from 'next/navigation'
import { useRole } from '@/hooks/useRole'

export default function DoctorDashboard() {
  const router = useRouter()
  const { role, isLoading: roleLoading, hasPermission } = useRole()
  
  // Fetch real data from backend
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: upcomingAppointments = [], isLoading: appointmentsLoading } = useTodayAppointments()
  const { data: recentPatients = [], isLoading: patientsLoading } = useRecentPatients()

  React.useEffect(() => {
    if (!roleLoading && role) {
      if (role === 'RECEPTIONIST' || role === 'RECEIPTION' || role === 'CUSTOMER-CARE') {
        router.push('/dashboard/reception')
      } else if (role === 'STORE') {
        router.push('/dashboard/pharmacy')
      } else if (role === 'LABORANTIN' || role === 'RADIOLOGIST') {
        router.push('/dashboard/lab')
      } else if (role === 'BILLING_OFFICER' || role === 'CASHIER' || role === 'DAF' || role === 'COO') {
        router.push('/dashboard/billing')
      } else if (role === 'MANAGER' || role === 'HUMAN-RESOURCE') {
        router.push('/dashboard/admin')
      }
    }
  }, [role, roleLoading, router])

  const userRole = role ? (role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()) : 'Doctor'

  // Show loading skeleton if data is loading
  if (roleLoading || statsLoading || appointmentsLoading || patientsLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <header className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
            Good Morning, {userRole}
          </h1>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </header>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">
          Good Morning, {userRole}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your day. You have {stats?.todayAppointments || 0} appointments scheduled.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Appointments
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.todayAppointments || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              <span className="text-success">+3</span>&nbsp;from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Consultations
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for your attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patients Seen Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.seen || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Consultations completed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Wait Time
            </CardTitle>
            <Timer className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.avgWait || '0 min'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Excellent performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Patient Queue - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-heading">Patient Queue</CardTitle>
                <CardDescription>Real-time patient queue status</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <QueueBoard />
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-heading">Upcoming Today</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No appointments today</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    You don't have any scheduled appointments for today. Enjoy your free time!
                  </p>
                </div>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{apt.time}</p>
                        <Badge variant="secondary" className="text-xs">
                          {apt.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{apt.patientName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/schedule">View Full Schedule</Link>
            </Button>
          </CardContent>
        </Card>
      </div>


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-heading">Consultation Activity</CardTitle>
            <CardDescription>Weekly consultation overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ConsultationsChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-heading">Patient Demographics</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientStatsChart />
          </CardContent>
        </Card>
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-heading">Recent Patients</CardTitle>
              <CardDescription>Patients you've seen recently</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/doctor/patients">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No recent patients</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  You haven't seen any patients recently. Start by registering a new patient or viewing your patient list.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/dashboard/doctor/patients">View All Patients</Link>
                </Button>
              </div>
            ) : (
              recentPatients.map((patient) => (
                <div 
                  key={patient.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-accent/20 text-primary font-semibold">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{patient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-muted-foreground">Last Visit</p>
                      <p className="text-sm font-medium">{patient.lastVisit}</p>
                    </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    {patient.status}
                  </Badge>
                  {hasPermission('CAN_VIEW_MEDICAL_RECORDS') && (
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Alert */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Quick Actions</h4>
              <p className="text-sm text-muted-foreground">
                Start a new consultation or register a new patient
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {hasPermission('CAN_REGISTER_PATIENT') && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/doctor/patients">
                  <Users className="h-4 w-4 mr-2" />
                  New Patient
                </Link>
              </Button>
            )}
            {hasPermission('CAN_PRESCRIBE') && (
              <Button asChild>
                <Link href="/dashboard/doctor/consultations/new">
                  <FileText className="h-4 w-4 mr-2" />
                  New Consultation
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
