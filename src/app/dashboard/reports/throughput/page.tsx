'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { ArrowLeft, Loader2, Users, Clock, CheckCircle, Timer } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportDateRangePicker } from '@/components/reports/ReportDateRangePicker'
import { usePatientThroughputReport, useExportReport } from '@/hooks/useHmisReports'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function PatientThroughputReportPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  })

  // Format dates for API
  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : startDate

  const { data: report, isLoading, isError } = usePatientThroughputReport(startDate, endDate)
  const exportReport = useExportReport()
  const isExporting = exportReport.isPending

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-500 font-medium">Failed to load report data</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Patient Throughput</h1>
            <p className="text-muted-foreground">
              Monitor patient flow and encounter lifecycle
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReportDateRangePicker date={date} setDate={setDate} disabled={isLoading} />
          <Button 
            variant="outline" 
            disabled={isLoading || isExporting}
            onClick={() => exportReport.mutate({ reportType: 'patient', format: 'csv' })}
          >
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Encounters</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalEncounters}</div>
                <p className="text-xs text-muted-foreground">
                  Across all departments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{report.activeEncounters}</div>
                <p className="text-xs text-muted-foreground">
                  In progress or pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{report.completedEncounters}</div>
                <p className="text-xs text-muted-foreground">
                  Fully processed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {report.averageEncounterDurationMinutes 
                    ? `${Math.round(report.averageEncounterDurationMinutes)} min`
                    : '--'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Check-in to completion
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Encounters by Status Bar Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Encounters by Status</CardTitle>
                <CardDescription>
                   Distribution of patient visits across lifecycle stages
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.encountersByStatus}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="status" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="currentColor" 
                        radius={[4, 4, 0, 0]} 
                        className="fill-primary" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Hourly Distribution Area Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Hourly Traffic</CardTitle>
                <CardDescription>
                  Patient arrival patterns (24h)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => `${value}:00`}
                      />
                      <YAxis hide />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="currentColor" 
                        fill="currentColor" 
                        fillOpacity={0.2} 
                        className="stroke-primary fill-primary" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Encounters Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Encounters</CardTitle>
              <CardDescription>
                Latest 20 patient visits and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.recentEncounters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No encounters found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.recentEncounters.map((encounter) => (
                      <TableRow key={encounter.encounterId}>
                        <TableCell className="font-medium">{encounter.patientName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            encounter.status === 'CLOSED' ? 'default' : 
                            encounter.status === 'CANCELLED' ? 'destructive' : 
                            'secondary'
                          }>
                            {encounter.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(encounter.createdAt), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          {encounter.durationMinutes ? `${Math.round(encounter.durationMinutes)} min` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
