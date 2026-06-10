'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLabInpatientFollowups, useUpdateLabOrderStatus } from '@/hooks/useLabOrders'

interface LabInpatientFollowupListProps {
  onViewOrder: (orderId: string) => void
}

function priorityClass(priority: string) {
  switch (priority) {
    case 'STAT':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'URGENT':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function LabInpatientFollowupList({ onViewOrder }: LabInpatientFollowupListProps) {
  const [page, setPage] = useState(0)
  const size = 20

  const followupQuery = useLabInpatientFollowups({ page, size })
  const { updateStatus, updatingStatus } = useUpdateLabOrderStatus()

  const rows = followupQuery.data?.data ?? []
  const meta = followupQuery.data?.meta
  const today = new Date().toISOString().slice(0, 10)

  const handleAccept = async (orderId: string) => {
    try {
      await updateStatus({ orderId, status: 'IN_PROGRESS' })
      toast.success('Follow-up accepted.')
      onViewOrder(orderId)
    } catch (error) {
      console.error('Failed to accept inpatient follow-up', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Ward/Unit</TableHead>
              <TableHead>Test Name</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {followupQuery.isLoading && rows.length === 0 ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`followup-skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                </TableRow>
              ))
            ) : null}

            {!followupQuery.isLoading && followupQuery.isError ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <div className="space-y-3">
                    <p className="text-sm text-red-600">Failed to load scheduled follow-up exams.</p>
                    <Button variant="outline" onClick={() => followupQuery.refetch()}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {!followupQuery.isLoading && !followupQuery.isError && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No scheduled follow-up exams
                </TableCell>
              </TableRow>
            ) : null}

            {!followupQuery.isError
              ? rows.map((order) => {
                  const dueDate = order.scheduledExamDate
                  const isToday = dueDate === today
                  const isOverdue = dueDate < today

                  return (
                    <TableRow
                      key={order.id}
                      className={isOverdue ? 'bg-red-50' : isToday ? 'bg-amber-50' : undefined}
                    >
                      <TableCell className="font-medium">{order.patientName}</TableCell>
                      <TableCell>{order.wardUnit}</TableCell>
                      <TableCell>{order.testName}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{new Date(order.scheduledExamDate).toLocaleDateString()}</span>
                          {isOverdue ? (
                            <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700">
                              OVERDUE
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{order.orderedByDoctorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityClass(order.priority)}>
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingStatus || order.status !== 'PENDING'}
                            onClick={() => handleAccept(order.id)}
                          >
                            Accept
                          </Button>
                          <Button size="sm" onClick={() => onViewOrder(order.id)}>
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={!meta?.hasPrevious}>
          Previous
        </Button>
        <p className="text-sm text-muted-foreground">
          Page {(meta?.page ?? page) + 1}
          {meta?.totalPages ? ` of ${meta.totalPages}` : ''}
        </p>
        <Button variant="outline" onClick={() => setPage((current) => current + 1)} disabled={!meta?.hasNext}>
          Next
        </Button>
      </div>
    </div>
  )
}
