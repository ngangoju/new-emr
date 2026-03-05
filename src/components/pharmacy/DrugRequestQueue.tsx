'use client'

import { useState, useMemo } from 'react'
import { Pill, User, Clock, CheckCircle, XCircle, AlertCircle, Eye, Package } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { useDrugRequests, useFulfillDrugRequest, useDenyDrugRequest } from '@/hooks/useDrugRequests'
import { useRole } from '@/hooks/useRole'
import type { DrugRequest, DrugRequestItem, DrugRequestStatus } from '@/types/pharmacy'
import { normalizeDrugRequestItems, formatDrugRequestItemContext } from '@/lib/pharmacy/drugRequestMapping'
import { DrugRequestQueueRow } from '@/components/pharmacy/DrugRequestQueueRow'

function normalizeRequest(request: DrugRequest): DrugRequest {
  return { ...request, items: normalizeDrugRequestItems(request.items) }
}

/**
 * DrugRequestQueue - A queue for pharmacists to view and fulfill drug requests
 *
 * Features:
 * - View pending requests in a queue
 * - View request details (patient, items, quantity)
 * - Approve/Fulfill button
 * - Deny button with reason
 * - Filter by status (pending, fulfilled, denied)
 * - Permission check for CAN_DISPENSE or PHARMACIST role
 */
export function DrugRequestQueue() {
  const { hasPermission, isRole, isLoading: roleLoading } = useRole()
  const { data: rawRequests = [], isLoading } = useDrugRequests({})
  // Normalise items field: the backend returns it as a JSON string, not an array
  const requests = useMemo(() => rawRequests.map(normalizeRequest), [rawRequests])
  const { mutateAsync: fulfillRequest, isPending: fulfilling } = useFulfillDrugRequest()
  const { mutateAsync: denyRequest, isPending: denying } = useDenyDrugRequest()

  const [selectedRequest, setSelectedRequest] = useState<DrugRequest | null>(null)
  const [denialReason, setDenialReason] = useState('')
  const [fulfillNotes, setFulfillNotes] = useState('')
  const [showDenyDialog, setShowDenyDialog] = useState(false)
  const [showFulfillDialog, setShowFulfillDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<DrugRequestStatus | 'all'>('pending')

  // Check permission - either CAN_DISPENSE permission or PHARMACIST role
  const canDispense = useMemo(() => {
    if (roleLoading) return false
    return hasPermission('CAN_DISPENSE') || isRole('PHARMACIST') || isRole('ADMIN')
  }, [hasPermission, isRole, roleLoading])

  // Filter requests by status
  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return requests
    return requests.filter((req) => req.status === activeTab)
  }, [requests, activeTab])

  // Get status badge variant
  const getStatusBadge = (status: DrugRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Approved</Badge>
      case 'fulfilled':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Fulfilled</Badge>
      case 'denied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Denied</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Format date - handles both ISO string and formatted date from backend
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return dateString // Return as-is if parsing fails
    }
  }

  // Handle fulfill
  const handleFulfill = async () => {
    if (!selectedRequest) return

    try {
      await fulfillRequest({
        id: selectedRequest.id,
        notes: fulfillNotes || undefined,
      })
      toast.success(`Drug request for ${selectedRequest.patientName} has been fulfilled`)
      setShowFulfillDialog(false)
      setSelectedRequest(null)
      setFulfillNotes('')
    } catch (error) {
      console.error('Failed to fulfill request:', error)
      toast.error('Failed to fulfill request. Please try again.')
    }
  }

  // Handle deny
  const handleDeny = async () => {
    if (!selectedRequest || !denialReason.trim()) {
      toast.error('Please provide a reason for denial')
      return
    }

    try {
      await denyRequest({
        id: selectedRequest.id,
        reason: denialReason,
      })
      toast.success(`Drug request for ${selectedRequest.patientName} has been denied`)
      setShowDenyDialog(false)
      setSelectedRequest(null)
      setDenialReason('')
    } catch (error) {
      console.error('Failed to deny request:', error)
      toast.error('Failed to deny request. Please try again.')
    }
  }

  // Stats
  const stats = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
      denied: requests.filter((r) => r.status === 'denied').length,
      total: requests.length,
    }
  }, [requests])

  // Show access denied if no permission
  if (!roleLoading && !canDispense) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You do not have permission to manage drug requests.
              Contact your administrator if you need this access.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Drug Request Queue
          </h2>
          <p className="text-muted-foreground">
            Review and fulfill drug requests from nurses and doctors
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fulfilled}</p>
                <p className="text-sm text-muted-foreground">Fulfilled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.denied}</p>
                <p className="text-sm text-muted-foreground">Denied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DrugRequestStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="fulfilled">
            Fulfilled ({stats.fulfilled})
          </TabsTrigger>
          <TabsTrigger value="denied">
            Denied ({stats.denied})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({stats.total})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Request List */}
      <Card>
        <CardHeader>
          <CardTitle>Drug Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No drug requests found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <DrugRequestQueueRow
                      key={request.id}
                      request={request}
                      formatDate={formatDate}
                      getStatusBadge={getStatusBadge}
                      onView={setSelectedRequest}
                      onFulfill={(selected) => {
                        setSelectedRequest(selected)
                        setShowFulfillDialog(true)
                      }}
                      onDeny={(selected) => {
                        setSelectedRequest(selected)
                        setShowDenyDialog(true)
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!selectedRequest && !showFulfillDialog && !showDenyDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Drug Request Details</DialogTitle>
            <DialogDescription>
              Request ID: {selectedRequest?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedRequest.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p className="font-medium">{selectedRequest.requestedByName || selectedRequest.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{formatDate(selectedRequest.requestedAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Items</Label>
                {selectedRequest.items.some((item) => Boolean(item.allergyOverrideReason)) && (
                  <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Allergy override reason provided for one or more medications.
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medication</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Prescription Context</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequest.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {formatDrugRequestItemContext(item)}
                          {item.allergyOverrideReason && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-destructive font-medium border border-destructive/20 bg-destructive/5 p-1 rounded">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              Doctor Override: {item.allergyOverrideReason}
                            </div>
                          )}
                          {item.interactionOverrideReason && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-amber-700 font-medium border border-amber-700/20 bg-amber-50 p-1 rounded">
                              <AlertCircle className="w-3 h-3 flex-shrink-0" />
                              Doctor Override: {item.interactionOverrideReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {[item.dose, item.route, item.frequency, item.duration].filter(Boolean).join(' • ') || 'Legacy unstructured record'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedRequest.notes && (
                <div>
                  <Label className="text-muted-foreground">Additional Notes</Label>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.status === 'denied' && selectedRequest.denialReason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <Label className="text-red-700">Denial Reason</Label>
                  <p className="text-sm text-red-800">{selectedRequest.denialReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fulfill Dialog */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Drug Request</DialogTitle>
            <DialogDescription>
              Mark this request as fulfilled for {selectedRequest?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Items to Dispense</Label>
              <Table>
                <TableBody>
                  {selectedRequest?.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.drugName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any notes about the dispensed items..."
                value={fulfillNotes}
                onChange={(e) => setFulfillNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFulfillDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFulfill}
              disabled={fulfilling}
            >
              {fulfilling ? 'Processing...' : 'Confirm Fulfillment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Drug Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this request for {selectedRequest?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Items Requested</Label>
              <Table>
                <TableBody>
                  {selectedRequest?.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.drugName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <Label>Reason for Denial *</Label>
              <Textarea
                placeholder="Enter the reason for denial..."
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDenyDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeny}
              disabled={denying || !denialReason.trim()}
            >
              {denying ? 'Processing...' : 'Confirm Denial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DrugRequestQueue
