'use client'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, CheckCircle2, FileCheck, TestTube, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLabOrders, useUploadResult } from '@/hooks/useLabOrders'
import type { LabOrder } from '@/types/lab'
import type { LabResult } from '@/types/lab'
import toast from 'react-hot-toast'

export function LabDashboard() {
  const { pending, completed, stats, loading } = useLabOrders()
  const { uploadResult, uploading } = useUploadResult()
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
  const [resultText, setResultText] = useState('')
  const [tech, setTech] = useState('')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<LabResult['status']>('normal')
  const [markAsFinal, setMarkAsFinal] = useState(false)

  const handleEnterResults = (order: LabOrder) => {
    setSelectedOrder(order)
    setResultText(order.results?.text || '')
    setTech(order.results?.tech || '')
    setComment(order.results?.comment || '')
    setStatus(order.results?.status || 'normal')
    setMarkAsFinal(false)
  }

  const pendingCount = useMemo(() => pending.length, [pending])

  const resetDialog = () => {
    setSelectedOrder(null)
    setResultText('')
    setTech('')
    setComment('')
    setStatus('normal')
    setMarkAsFinal(false)
  }

  const handleSubmitResult = async () => {
    if (!selectedOrder) return

    if (!resultText.trim()) {
      toast.error('Result text is required.')
      return
    }

    if (!tech.trim()) {
      toast.error('Lab technician name is required.')
      return
    }

    const payload: LabResult = {
      text: resultText.trim(),
      tech: tech.trim(),
      comment: comment.trim() || undefined,
      status,
    }

    try {
      await uploadResult({
        orderId: selectedOrder.id,
        result: payload,
        markAsFinal,
      })

      resetDialog()
    } catch {
      // handled by interceptors/mutation onError
    }
  }

  const handleExportSummary = () => {
    toast.success('Lab summary export is non-critical in A5 and remains unchanged.')
  }

  return (
    <>
        <PageHeader
          title="Lab Dashboard"
          description="Pending orders table, results entry, imaging upload, completed table with PDF export."
        />
      {loading && (
        <div className="mb-6 rounded-md border p-3 text-sm text-muted-foreground">
          Loading lab orders...
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Today</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
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
            <FileCheck className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.patientName}</TableCell>
                    <TableCell>{order.testType}</TableCell>
                    <TableCell>
                      <Badge variant={order.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleEnterResults(order)}>
                        Enter Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No pending orders
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Results</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportSummary}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.patientName}</TableCell>
                    <TableCell>{order.testType}</TableCell>
                    <TableCell>
                      {order.results?.completedAt?.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Completed
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {completed.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No completed orders
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Lab Result</DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? `Order ${selectedOrder.id} · ${selectedOrder.patientName} · ${selectedOrder.testType}`
                : 'Submit lab result'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lab-tech">Technician</Label>
              <Input
                id="lab-tech"
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                placeholder="Lab technician name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lab-result">Result Payload</Label>
              <Textarea
                id="lab-result"
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                placeholder="Structured result text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lab-comment">Comment (optional)</Label>
              <Input
                id="lab-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Additional notes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lab-status">Result Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as LabResult['status'])}>
                <SelectTrigger id="lab-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="abnormal">Abnormal</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="mark-as-final"
                checked={markAsFinal}
                onCheckedChange={(checked) => setMarkAsFinal(Boolean(checked))}
              />
              <Label htmlFor="mark-as-final">Mark as final (approved)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResult} disabled={uploading}>
              {uploading ? 'Submitting...' : markAsFinal ? 'Finalize Result' : 'Submit Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
