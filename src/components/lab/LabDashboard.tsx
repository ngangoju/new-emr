'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2, Clock, FileCheck, TestTube } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  useLabOrders,
  useRejectSample,
  useUpdateLabOrderStatus,
} from '@/hooks/useLabOrders'
import type { LabOrder, LabPanelParameter } from '@/types/lab'
import { LabTestPanelForm } from '@/components/lab/LabTestPanelForm'
import { FinalizeResultModal } from '@/components/lab/FinalizeResultModal'
import toast from 'react-hot-toast'

function statusBadgeClass(status: LabOrder['status']) {
  switch (status) {
    case 'pending':
      return 'border-gray-600 text-gray-600'
    case 'in_progress':
      return 'border-blue-600 text-blue-600'
    case 'completed':
      return 'border-green-600 text-green-600'
    case 'rejected':
      return 'border-red-600 text-red-600'
    default:
      return ''
  }
}

function statusLabel(status: LabOrder['status']) {
  switch (status) {
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'rejected':
      return 'Rejected'
    case 'pending':
    default:
      return 'Pending'
  }
}

export function LabDashboard() {
  const { pending, completed, stats, loading } = useLabOrders()
  const { updateStatus, updatingStatus } = useUpdateLabOrderStatus()
  const { rejectSample, rejecting } = useRejectSample()

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
  const [panelValues, setPanelValues] = useState<Record<string, string>>({})
  const [criticalParameters, setCriticalParameters] = useState<Array<Pick<LabPanelParameter, 'code' | 'name'>>>([])
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [rejectingOrder, setRejectingOrder] = useState<LabOrder | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const pendingCount = useMemo(() => pending.length, [pending])

  const handleStartCollection = async (orderId: string) => {
    await updateStatus({ orderId, status: 'in_progress' })
    toast.success('Order marked In Progress.')
  }

  const handleEnterResults = (order: LabOrder) => {
    setSelectedOrder(order)
    setPanelValues({})
    setCriticalParameters([])
  }

  const handleRejectSubmit = async () => {
    if (!rejectingOrder) return
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.')
      return
    }
    await rejectSample({ orderId: rejectingOrder.id, reason: rejectionReason.trim() })
    setRejectingOrder(null)
    setRejectionReason('')
  }

  return (
    <>
      <PageHeader
        title="Lab Dashboard"
        description="Structured lab results, processing workflow, and finalized queue."
      />

      {loading && <div className="mb-4 rounded-md border p-3 text-sm text-muted-foreground">Loading lab orders...</div>}

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Today</CardTitle>
            <Clock className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <TestTube className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
            <FileCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lab Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.patientName}</TableCell>
                    <TableCell>{order.testType}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {order.status === 'pending' && (
                        <Button size="sm" variant="outline" disabled={updatingStatus} onClick={() => handleStartCollection(order.id)}>
                          Mark In Progress
                        </Button>
                      )}
                      {order.status !== 'rejected' && (
                        <Button size="sm" variant="outline" onClick={() => setRejectingOrder(order)}>
                          Reject Sample
                        </Button>
                      )}
                      {(order.status === 'in_progress' || order.status === 'pending') && (
                        <Button size="sm" onClick={() => handleEnterResults(order)}>
                          Enter Structured Results
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {pending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No pending queue entries
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.patientName}</TableCell>
                    <TableCell>{order.testType}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass('completed')}>
                        Completed
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {completed.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No completed results
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Structured Result Entry</DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Order ${selectedOrder.id} · ${selectedOrder.patientName} · ${selectedOrder.testType}`
                : 'Structured result entry'}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <LabTestPanelForm
              panelId={selectedOrder.panelId || selectedOrder.testType}
              values={panelValues}
              onValuesChange={setPanelValues}
              onCriticalParametersChange={(codes) => {
                setCriticalParameters(
                  codes.map((code) => ({
                    code,
                    name: code,
                  })),
                )
              }}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Cancel
            </Button>
            <Button onClick={() => setFinalizeOpen(true)} disabled={!selectedOrder}>
              Finalize Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedOrder && (
        <FinalizeResultModal
          open={finalizeOpen}
          orderId={selectedOrder.id}
          values={panelValues}
          criticalParameters={criticalParameters}
          onOpenChange={setFinalizeOpen}
          onSubmitted={async () => {
            await updateStatus({ orderId: selectedOrder.id, status: 'completed' })
            setSelectedOrder(null)
            setPanelValues({})
            setCriticalParameters([])
          }}
        />
      )}

      <Dialog open={Boolean(rejectingOrder)} onOpenChange={(open) => !open && setRejectingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Sample</DialogTitle>
            <DialogDescription>
              Enter a mandatory reason. This sends a notification to the ordering nurse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Input
              id="reject-reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="e.g. Hemolyzed specimen"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingOrder(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={rejecting}>
              {rejecting ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

