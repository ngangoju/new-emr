'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLabPendingWorklist, useUpdateLabOrderStatus } from '@/hooks/useLabOrders'

interface LabPendingWorklistProps {
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

function statusClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function LabPendingWorklist({ onViewOrder }: LabPendingWorklistProps) {
  const [page, setPage] = useState(0)
  const size = 20

  const pendingQuery = useLabPendingWorklist({ page, size })
  const { updateStatus, updatingStatus } = useUpdateLabOrderStatus()

  const rows = pendingQuery.data?.data ?? []
  const meta = pendingQuery.data?.meta

  const handleAccept = async (orderId: string) => {
    try {
      await updateStatus({ orderId, status: 'IN_PROGRESS' })
      toast.success('Order accepted.')
    } catch (error) {
      console.error('Failed to accept lab order', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Ordered By</TableHead>
              <TableHead>Ordered At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingQuery.isLoading && rows.length === 0 ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`pending-skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-36" /></TableCell>
                </TableRow>
              ))
            ) : null}

            {!pendingQuery.isLoading && pendingQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <div className="space-y-3">
                    <p className="text-sm text-red-600">Failed to load pending exams.</p>
                    <Button variant="outline" onClick={() => pendingQuery.refetch()}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {!pendingQuery.isLoading && !pendingQuery.isError && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No pending exams
                </TableCell>
              </TableRow>
            ) : null}

            {!pendingQuery.isError
              ? rows.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.patientName}</TableCell>
                    <TableCell>{order.testName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={priorityClass(order.priority)}>
                        {order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.orderedByDoctorName}</TableCell>
                    <TableCell>{new Date(order.orderedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={statusClass(order.status)}>
                          {order.status}
                        </Badge>
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
                ))
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
