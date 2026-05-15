'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign,
  Clock,
  Users, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { usePatientThroughputReport, useRevenueReport, usePendingItemsReport } from '@/hooks/useHmisReports'
import { useRole } from '@/hooks/useRole'

export default function ReportsDashboard() {
  const { isRole } = useRole()

  if (isRole(['NURSE', 'CHIEF_NURSE'])) {
    // TODO: Nurse reports flow still broken. Restore after dedicated reports stabilization work.
    return (
      <div className="space-y-6">
        <PageHeader
          title="Operational Reports"
          description="Reports are temporarily unavailable for nurse workflows."
        />
        <Card>
          <CardHeader>
            <CardTitle>Reports - under maintenance</CardTitle>
            <CardDescription>
              Nurse reports remain intentionally disabled in this release while the reports module is repaired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const reports = [
    {
      title: 'Patient Throughput',
      description: 'Analyze patient flow, department workload, and encounter duration.',
      icon: Users,
      href: '/dashboard/reports/throughput',
      color: 'bg-blue-100 text-blue-700',
      stats: 'Encounters, Status, Hourly Flow'
    },
    {
      title: 'Revenue Summary',
      description: 'Track financial performance, insurance claims, and outstanding payments.',
      icon: DollarSign,
      href: '/dashboard/reports/revenue',
      color: 'bg-green-100 text-green-700',
      stats: 'Revenue, Insurance, Aging'
    },
    {
      title: 'Pending Items',
      description: 'Monitor incomplete workflows and potential bottlenecks in real-time.',
      icon: AlertCircle,
      href: '/dashboard/reports/pending-items',
      color: 'bg-orange-100 text-orange-700',
      stats: 'Open Encounters, Unsigned Notes'
    }
  ]

  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: throughput } = usePatientThroughputReport(today, today)
  const { data: revenue } = useRevenueReport(today, today)
  const { data: pending } = usePendingItemsReport()

  const avgDuration = throughput?.averageEncounterDurationMinutes 
    ? Math.round(throughput.averageEncounterDurationMinutes) 
    : 0

  const activePatients = pending?.openEncounterCount || 0
  const totalRevenue = revenue?.totalRevenue || 0
  const pendingLabs = pending?.pendingLabOrderCount || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Reports"
        description="Access real-time insights for clinical operations, finance, and quality assurance."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: report.color.includes('blue') ? '#3b82f6' : report.color.includes('green') ? '#22c55e' : '#f97316' }}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${report.color} mb-3`}>
                    <report.icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">{report.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {report.stats}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Avg. Visit Duration</span>
              </div>
              <div className="text-2xl font-bold">{avgDuration} min</div>
              <p className="text-xs text-muted-foreground mt-1">based on closed encounters today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Active Patients</span>
              </div>
              <div className="text-2xl font-bold">{activePatients}</div>
              <p className="text-xs text-muted-foreground mt-1">currently checked in</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Revenue Today</span>
              </div>
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} RWF</div>
              <p className="text-xs text-muted-foreground mt-1">total invoiced amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Pending Lab Orders</span>
              </div>
              <div className="text-2xl font-bold">{pendingLabs}</div>
              <p className="text-xs text-muted-foreground mt-1">awaiting results</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
