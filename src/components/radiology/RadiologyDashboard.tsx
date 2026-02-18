'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Clock, CheckCircle2, Image as ImageIcon, Upload, Search, Activity, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePendingImagingOrders, useImagingOrders } from '@/hooks/useImaging'
import type { ImagingOrder } from '@/types/imaging'
import { format } from 'date-fns'
import { AcquisitionModal } from './AcquisitionModal'
import { ReportingForm } from './ReportingForm'

export function RadiologyDashboard() {
  const { data: pending = [], isLoading: loadingPending } = usePendingImagingOrders()
  const { data: allOrders = [], isLoading: loadingAll } = useImagingOrders()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ImagingOrder | null>(null)
  const [reportingOrder, setReportingOrder] = useState<ImagingOrder | null>(null)

  const completed = useMemo(() => 
    allOrders.filter(o => o.status === 'COMPLETED' || o.status === 'REPORTED'),
    [allOrders]
  )

  const filteredPending = useMemo(() => {
    return pending.filter(order => 
      order.patientFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patientLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.imagingType.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [pending, searchTerm])

  const stats = {
    pending: pending.length,
    completed: completed.length,
    urgent: pending.filter(o => o.priority === 'URGENT' || o.priority === 'EMERGENCY').length,
    totalToday: allOrders.filter(o => {
        const today = new Date().toISOString().split('T')[0];
        return o.createdAt.startsWith(today);
    }).length
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Radiology Dashboard"
        description="Manage imaging orders, upload DICOM studies, and view radiology reports."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-orange-50/50 border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Urgent/Emergency</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.urgent}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Processed Today</CardTitle>
            <ImageIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalToday}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Worklist</h2>
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient or test..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Body Part</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Ordered At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPending ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading worklist...
                    </TableCell>
                  </TableRow>
                ) : filteredPending.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pending imaging orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPending.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">
                          {order.patientFirstName} {order.patientLastName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono uppercase">
                          {order.patientId.substring(0, 8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[10px]">
                          {order.imagingType}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.bodyPart || 'Not specified'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            order.priority === 'EMERGENCY' ? 'destructive' : 
                            order.priority === 'URGENT' ? 'default' : 'secondary'
                          }
                          className={order.priority === 'URGENT' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                        >
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(order.orderedAt), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className="gap-2" onClick={() => setSelectedOrder(order)}>
                          <Upload className="h-4 w-4" />
                          Acquire Study
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {completed.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-semibold">Recently Completed</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed.slice(0, 5).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.patientFirstName} {order.patientLastName}
                      </TableCell>
                      <TableCell>{order.imagingType}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.completedAt ? format(new Date(order.completedAt), 'MMM d, HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === 'COMPLETED' ? (
                            <Button size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700 gap-2" onClick={() => setReportingOrder(order)}>
                                <FileText className="h-4 w-4" />
                                Create Report
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={() => setReportingOrder(order)}>View Report</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <AcquisitionModal 
        order={selectedOrder} 
        onOpenChange={(open) => !open && setSelectedOrder(null)} 
      />

      <ReportingForm 
        order={reportingOrder}
        onOpenChange={(open) => !open && setReportingOrder(null)}
      />
    </div>
  )
}
