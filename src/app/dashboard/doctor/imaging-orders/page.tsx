'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileSearch,
  Image as ImageIcon,
  UserSearch,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateImagingOrderModal } from '@/components/radiology/CreateImagingOrderModal'
import { useImagingOrders, usePatientImagingOrders } from '@/hooks/useImaging'
import type { Patient } from '@/hooks/api/usePatients'
import type { ImagingOrder } from '@/types/imaging'

function StatusBadge({ status }: { status: ImagingOrder['status'] }) {
  if (status === 'REPORTED') {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Reported</Badge>
  }

  if (status === 'COMPLETED') {
    return <Badge variant="default">Completed</Badge>
  }

  if (status === 'IN_PROGRESS') {
    return <Badge className="bg-amber-500 hover:bg-amber-500">In Progress</Badge>
  }

  if (status === 'SCHEDULED') {
    return <Badge variant="secondary">Scheduled</Badge>
  }

  if (status === 'CANCELLED') {
    return <Badge variant="destructive">Cancelled</Badge>
  }

  return <Badge variant="outline">Ordered</Badge>
}

function PriorityBadge({ priority }: { priority: ImagingOrder['priority'] }) {
  if (priority === 'EMERGENCY') {
    return <Badge variant="destructive">Emergency</Badge>
  }

  if (priority === 'URGENT') {
    return <Badge className="bg-orange-500 hover:bg-orange-500">Urgent</Badge>
  }

  return <Badge variant="secondary">Routine</Badge>
}

function OrderList({
  title,
  description,
  orders,
  emptyState,
}: {
  title: string
  description: string
  orders: ImagingOrder[]
  emptyState: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyState}</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{order.imagingType}</Badge>
                    {order.bodyPart ? <Badge variant="secondary">{order.bodyPart}</Badge> : null}
                    <PriorityBadge priority={order.priority} />
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {[order.patientFirstName, order.patientLastName].filter(Boolean).join(' ') || 'Patient context'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.instructions?.trim() || 'No clinical indication documented yet.'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ordered {format(new Date(order.orderedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/doctor/patients/${order.patientId}`}>
                      Open Patient Chart
                    </Link>
                  </Button>
                  {order.status === 'REPORTED' || order.status === 'COMPLETED' ? (
                    <Button asChild size="sm">
                      <Link href={`/dashboard/doctor/patients/${order.patientId}#imaging`}>
                        Review Results
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ImagingOrdersPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const { data: imagingOrders = [] } = useImagingOrders()
  const { data: patientOrders = [] } = usePatientImagingOrders(selectedPatient?.id || '')

  const activeOrders = useMemo(
    () =>
      imagingOrders.filter(
        (order) => order.status === 'ORDERED' || order.status === 'SCHEDULED' || order.status === 'IN_PROGRESS',
      ),
    [imagingOrders],
  )

  const reportReadyOrders = useMemo(
    () =>
      imagingOrders.filter(
        (order) =>
          (order.status === 'COMPLETED' || order.status === 'REPORTED') && !order.physicianAcknowledgedAt,
      ),
    [imagingOrders],
  )

  const selectedPatientRecentOrders = useMemo(
    () =>
      [...patientOrders]
        .sort((left, right) => new Date(right.orderedAt).getTime() - new Date(left.orderedAt).getTime())
        .slice(0, 5),
    [patientOrders],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Imaging Orders"
        description="Track diagnostic imaging requests, launch encounter follow-up, and create new orders in patient context."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-100 bg-blue-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-blue-900">
              <Clock3 className="h-4 w-4" />
              Active Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-blue-950">{activeOrders.length}</p>
            <p className="text-sm text-blue-800/80">Ordered, scheduled, or in progress</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-emerald-900">
              <CheckCircle2 className="h-4 w-4" />
              Awaiting Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-950">{reportReadyOrders.length}</p>
            <p className="text-sm text-emerald-800/80">Completed or reported, not yet acknowledged</p>
          </CardContent>
        </Card>

        <Card className="border-violet-100 bg-violet-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-violet-900">
              <ImageIcon className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-violet-950">{imagingOrders.length}</p>
            <p className="text-sm text-violet-800/80">All visible imaging requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserSearch className="h-5 w-5" />
              Create Order In Patient Context
            </CardTitle>
            <CardDescription>
              Start from the patient chart whenever possible so the order stays tied to the active consultation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <p className="font-medium">Recommended workflow</p>
              <p className="mt-1 text-blue-900/80">
                Use the consultation workspace for encounter-linked orders. This queue is best for follow-up,
                same-day additions, and reviewing report turnaround.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Patient</label>
              <PatientSelector
                selectedPatientId={selectedPatient?.id}
                onSelect={(patient) => setSelectedPatient(patient)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowCreateModal(true)} disabled={!selectedPatient}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Create Imaging Order
              </Button>
              {selectedPatient ? (
                <Button asChild variant="outline">
                  <Link href={`/dashboard/doctor/patients/${selectedPatient.id}`}>
                    Open Patient Chart
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>

            {selectedPatient ? (
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">Recent imaging activity for this patient</p>
                  </div>
                  <Badge variant="outline">{patientOrders.length}</Badge>
                </div>

                {selectedPatientRecentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No prior imaging orders found for this patient.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPatientRecentOrders.map((order) => (
                      <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/20 p-3">
                        <div>
                          <p className="text-sm font-medium">
                            {order.imagingType}
                            {order.bodyPart ? ` • ${order.bodyPart}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.orderedAt), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <PriorityBadge priority={order.priority} />
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Select a patient to review imaging history and place a new request.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Workflow Notes
            </CardTitle>
            <CardDescription>Keep orders clinically useful for the radiology team and for discharge follow-up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border p-3">
              Provide a clinical indication with enough context for protocoling and reporting.
            </div>
            <div className="rounded-lg border p-3">
              Use urgent or emergency priority only when it should change acquisition timing.
            </div>
            <div className="rounded-lg border p-3">
              Reported studies should be acknowledged from the patient chart so they clear workflow blockers.
            </div>
            <div className="rounded-lg border p-3">
              For admission and discharge cases, review imaging together with labs before sign-off.
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/radiology">
                <FileSearch className="mr-2 h-4 w-4" />
                Open Radiology Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OrderList
          title="Awaiting Doctor Follow-Up"
          description="Completed and reported studies that still need chart review or acknowledgment."
          orders={reportReadyOrders.slice(0, 6)}
          emptyState="No completed imaging studies are waiting for doctor follow-up right now."
        />

        <OrderList
          title="Active Imaging Queue"
          description="Orders still moving through scheduling, acquisition, or reporting."
          orders={activeOrders.slice(0, 6)}
          emptyState="No active imaging orders are currently queued."
        />
      </div>

      {selectedPatient ? (
        <CreateImagingOrderModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
        />
      ) : null}
    </div>
  )
}
