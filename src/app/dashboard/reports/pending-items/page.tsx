'use client'

import { format } from 'date-fns'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  UserCheck,
  Stethoscope,
  FlaskConical,
  Image,
  Pill,
  Timer
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { usePendingItemsReport } from '@/hooks/useHmisReports'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PendingItemsReportPage() {
  const { data: report, isLoading, isError } = usePendingItemsReport()

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-500 font-medium">Failed to load dashboard data</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const getOverdueBadge = (isOverdue: boolean) => {
    if (isOverdue) {
      return <Badge variant="destructive" className="ml-2">Overdue</Badge>
    }
    return null
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
            <h1 className="text-2xl font-bold tracking-tight">Pending Items Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of incomplete clinical workflows
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {format(new Date(), 'HH:mm')}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Open Encounters</p>
                    <p className="text-2xl font-bold">{report.openEncounterCount}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Unsigned Notes</p>
                    <p className="text-2xl font-bold">{report.unsignedConsultationCount}</p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-orange-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Unreported Imaging</p>
                    <p className="text-2xl font-bold">{report.unreportedImagingOrderCount}</p>
                  </div>
                  <Image className="h-8 w-8 text-purple-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Pending Labs</p>
                    <p className="text-2xl font-bold">{report.pendingLabOrderCount}</p>
                  </div>
                  <FlaskConical className="h-8 w-8 text-cyan-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Unserved Scrips</p>
                    <p className="text-2xl font-bold">{report.unservedPrescriptionCount}</p>
                  </div>
                  <Pill className="h-8 w-8 text-rose-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="encounters" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="encounters">Encounters</TabsTrigger>
              <TabsTrigger value="consultations">Consultations</TabsTrigger>
              <TabsTrigger value="imaging">Imaging</TabsTrigger>
              <TabsTrigger value="labs">Lab Orders</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            </TabsList>

            {/* TAB: Encounters */}
            <TabsContent value="encounters">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Open Encounters</CardTitle>
                  <CardDescription>Patients currently in the clinical flow (excluding closed/cancelled)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead className="text-right">Duration (hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.pendingEncounters.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8">No open encounters</TableCell></TableRow>
                      ) : (
                        report.pendingEncounters.map((e) => (
                          <TableRow key={e.encounterId}>
                            <TableCell className="font-medium">{e.patientName}</TableCell>
                            <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                            <TableCell>{format(new Date(e.createdAt), 'MMM d, HH:mm')}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-1">
                                {e.hoursOpen}h
                                {getOverdueBadge(e.isOverdue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Consultations */}
            <TabsContent value="consultations">
               <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Unsigned Consultations</CardTitle>
                  <CardDescription>Clinical notes awaiting provider signature</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Awaiting (hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.pendingConsultations.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8">No unsigned notes</TableCell></TableRow>
                      ) : (
                        report.pendingConsultations.map((c) => (
                          <TableRow key={c.consultationId}>
                            <TableCell className="font-medium">{c.patientName}</TableCell>
                            <TableCell>{c.doctorName}</TableCell>
                            <TableCell>{format(new Date(c.createdAt), 'MMM d, HH:mm')}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-1">
                                {c.hoursUnsigned}h
                                {getOverdueBadge(c.isOverdue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Imaging */}
            <TabsContent value="imaging">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Imaging Awaiting Reports</CardTitle>
                  <CardDescription>Completed scans needing radiologist interpretation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Modality</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead className="text-right">Awaiting (hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.pendingImagingOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8">No pending reports</TableCell></TableRow>
                      ) : (
                        report.pendingImagingOrders.map((o) => (
                          <TableRow key={o.orderId}>
                            <TableCell className="font-medium">{o.patientName}</TableCell>
                            <TableCell><Badge variant="secondary">{o.imagingType}</Badge></TableCell>
                            <TableCell>{format(new Date(o.completedAt), 'MMM d, HH:mm')}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-1">
                                {o.hoursAwaitingReport}h
                                {getOverdueBadge(o.isOverdue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Lab Orders */}
            <TabsContent value="labs">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Lab Orders</CardTitle>
                  <CardDescription>Ordered tests with no results yet</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Ordered</TableHead>
                        <TableHead className="text-right">Elapsed (hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.pendingLabOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8">No pending lab orders</TableCell></TableRow>
                      ) : (
                        report.pendingLabOrders.map((l) => (
                          <TableRow key={l.orderId}>
                            <TableCell className="font-medium">{l.patientName}</TableCell>
                            <TableCell>{l.testName}</TableCell>
                            <TableCell>{format(new Date(l.orderedAt), 'MMM d, HH:mm')}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-1">
                                {l.hoursPending}h
                                {getOverdueBadge(l.isOverdue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Prescriptions */}
            <TabsContent value="prescriptions">
               <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Unserved Prescriptions</CardTitle>
                  <CardDescription>Issued medications awaiting pharmacy dispensation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Medications</TableHead>
                        <TableHead>Prescribed</TableHead>
                        <TableHead className="text-right">Waiting (hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.pendingPrescriptions.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center py-8">No pending prescriptions</TableCell></TableRow>
                      ) : (
                        report.pendingPrescriptions.map((p) => (
                          <TableRow key={p.prescriptionId}>
                            <TableCell className="font-medium">{p.patientName}</TableCell>
                            <TableCell className="max-w-xs truncate">{p.medicationName}</TableCell>
                            <TableCell>{format(new Date(p.prescribedAt), 'MMM d, HH:mm')}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-1">
                                {p.hoursPending}h
                                {getOverdueBadge(p.isOverdue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}

