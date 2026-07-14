'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRole } from '@/hooks/useRole'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useLabOrderDetail, useRejectSample } from '@/hooks/useLabOrders'
import { LabResultForm } from '@/components/lab/LabResultForm'

interface LabOrderDetailDialogProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function priorityClass(priority: string) {
  switch (priority) {
    case 'STAT':
      return 'bg-critical-muted text-critical border-critical/30'
    case 'URGENT':
      return 'bg-warning-muted text-warning-foreground border-warning/40'
    default:
      return 'bg-muted text-foreground border-border'
  }
}

export function LabOrderDetailDialog({ orderId, open, onOpenChange }: LabOrderDetailDialogProps) {
  const { hasPermission, isLoading: roleLoading } = useRole()
  const canEnterResults = !roleLoading && hasPermission('lab:result:enter')
  const detailQuery = useLabOrderDetail(orderId ?? '')
  const { rejectSample, rejecting } = useRejectSample()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const order = detailQuery.data

  const handleReject = async () => {
    if (!orderId) return
    if (rejectionReason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters.')
      return
    }

    try {
      await rejectSample({ orderId, reason: rejectionReason.trim() })
      setRejectOpen(false)
      setRejectionReason('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to reject specimen', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Lab Order Detail</DialogTitle>
            <DialogDescription>Review order metadata, reject specimen, or submit result.</DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          ) : null}

          {!detailQuery.isLoading && detailQuery.isError ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-red-600">Failed to load lab order detail.</p>
              <Button variant="outline" onClick={() => detailQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          {order ? (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-xl border bg-muted p-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-semibold">{order.patientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Test</p>
                  <p className="font-semibold">{order.testName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ordered By</p>
                  <p className="font-semibold">{order.orderedByDoctorName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ordered At</p>
                  <p className="font-semibold">{new Date(order.orderedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={priorityClass(order.priority)}>
                    {order.priority}
                  </Badge>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                {order.scheduledExamDate ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Exam Date</p>
                    <p className="font-semibold">{new Date(order.scheduledExamDate).toLocaleDateString()}</p>
                  </div>
                ) : null}
              </div>

              {order.rejectionReason ? (
                <div className="rounded-xl border bg-critical-muted border-critical/30 p-4">
                  <p className="text-sm font-semibold text-critical-foreground">Rejection reason</p>
                  <p className="mt-1 text-sm text-critical-foreground">{order.rejectionReason}</p>
                </div>
              ) : null}

              {canEnterResults && (order.status === 'PENDING' || order.status === 'IN_PROGRESS') ? (
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                    Reject Specimen
                  </Button>
                </div>
              ) : null}

              {canEnterResults && order.status === 'IN_PROGRESS' ? (
                <LabResultForm order={order} onSubmitted={() => onOpenChange(false)} />
              ) : (
                <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  {order.status === 'PENDING'
                    ? 'Accept this order from the worklist before entering results.'
                    : 'Results are already finalized for this order.'}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Specimen</DialogTitle>
            <DialogDescription>Provide a required rejection reason with at least 10 characters.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="lab-rejection-reason">Rejection Reason</Label>
            <Input
              id="lab-rejection-reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="e.g. Insufficient specimen volume"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={rejecting} onClick={handleReject}>
              {rejecting ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
