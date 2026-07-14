'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pill, Clock, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { StatusBadge } from '@/components/shared'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  CompactModalShell,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { useDrugRequests, useFulfillDrugRequest, useDenyDrugRequest, useApproveDrugRequest } from '@/hooks/useDrugRequests'
import { useInventoryEntries } from '@/hooks/useInventory'
import { useRole } from '@/hooks/useRole'
import type { DrugRequest, DrugRequestItem, DrugRequestStatus, InventoryEntry } from '@/types/pharmacy'
import { normalizeDrugRequestItems, formatDrugRequestItemContext } from '@/lib/pharmacy/drugRequestMapping'
import { DrugRequestQueueRow } from '@/components/pharmacy/DrugRequestQueueRow'

function normalizeRequest(request: DrugRequest): DrugRequest {
  return { ...request, items: normalizeDrugRequestItems(request.items) }
}

function normalizeName(value: string | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

type RequestItemStockAssessment = {
  item: DrugRequestItem
  matches: InventoryEntry[]
  totalAvailable: number
  suggestedBatch: InventoryEntry | null
  isOutOfStock: boolean
  isInsufficient: boolean
  isLowStock: boolean
}

function getAssessmentKey(item: DrugRequestItem, index: number) {
  return `${item.drugId || item.drugName || 'drug'}-${index}`
}

function assessRequestItemStock(item: DrugRequestItem, inventoryEntries: InventoryEntry[]): RequestItemStockAssessment {
  const itemName = normalizeName(item.drugName)
  const matches = inventoryEntries
    .filter((entry) => {
      const brand = normalizeName(entry.medicationBrandName)
      const generic = normalizeName(entry.medicationGenericName)
      if (!itemName) return false
      return (
        itemName === brand ||
        itemName === generic ||
        brand.includes(itemName) ||
        generic.includes(itemName) ||
        itemName.includes(brand) ||
        itemName.includes(generic)
      )
    })
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())

  const totalAvailable = matches.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0)
  const suggestedBatch = matches.find((entry) => Number(entry.quantity || 0) > 0) ?? null

  return {
    item,
    matches,
    totalAvailable,
    suggestedBatch,
    isOutOfStock: matches.length === 0 || totalAvailable <= 0,
    isInsufficient: totalAvailable > 0 && totalAvailable < item.quantity,
    isLowStock: matches.some((entry) => Boolean(entry.isLowStock) || Boolean(entry.isCritical)),
  }
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
  const { data: inventoryEntries = [], isLoading: inventoryLoading } = useInventoryEntries()
  // Normalise items field: the backend returns it as a JSON string, not an array
  const requests = useMemo(() => rawRequests.map(normalizeRequest), [rawRequests])
  const { mutateAsync: approveRequest, isPending: approving } = useApproveDrugRequest()
  const { mutateAsync: fulfillRequest, isPending: fulfilling } = useFulfillDrugRequest()
  const { mutateAsync: denyRequest, isPending: denying } = useDenyDrugRequest()

  const [selectedRequest, setSelectedRequest] = useState<DrugRequest | null>(null)
  const [denialReason, setDenialReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [fulfillNotes, setFulfillNotes] = useState('')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showDenyDialog, setShowDenyDialog] = useState(false)
  const [showFulfillDialog, setShowFulfillDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<DrugRequestStatus | 'all'>('pending')
  const [selectedBatchesByItem, setSelectedBatchesByItem] = useState<Record<string, string>>({})

  const selectedRequestAssessments = useMemo(
    () =>
      selectedRequest
        ? selectedRequest.items.map((item) => assessRequestItemStock(item, inventoryEntries))
        : [],
    [inventoryEntries, selectedRequest],
  )
  const selectedRequestHasStockRisk = selectedRequestAssessments.some(
    (assessment) => assessment.isOutOfStock || assessment.isInsufficient || assessment.isLowStock,
  )
  const canConfirmFulfillment = selectedRequestAssessments.length > 0 && selectedRequestAssessments.every((assessment, index) => {
    const selectedBatchId = selectedBatchesByItem[getAssessmentKey(assessment.item, index)]
    if (!selectedBatchId) return false
    const selectedBatch = assessment.matches.find((entry) => entry.id === selectedBatchId)
    return Boolean(selectedBatch && Number(selectedBatch.quantity || 0) >= assessment.item.quantity)
  })
  const requestStockWarnings = useMemo(() => {
    return new Map(
      requests.map((request) => [
        request.id,
        request.items
          .map((item) => assessRequestItemStock(item, inventoryEntries))
          .some((assessment) => assessment.isOutOfStock || assessment.isInsufficient || assessment.isLowStock),
      ]),
    )
  }, [inventoryEntries, requests])

  useEffect(() => {
    if (!showFulfillDialog) return

    const defaults = Object.fromEntries(
      selectedRequestAssessments.map((assessment, index) => [
        getAssessmentKey(assessment.item, index),
        assessment.suggestedBatch?.id || '',
      ]),
    )
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBatchesByItem(defaults)
  }, [selectedRequestAssessments, showFulfillDialog])

  // Check permission - either CAN_DISPENSE permission or PHARMACIST role
  const canDispense = useMemo(() => {
    if (roleLoading) return false
    return hasPermission('CAN_DISPENSE') || hasPermission('drug_request:review') || hasPermission('pharmacy:dispense') || isRole('PHARMACIST')
  }, [hasPermission, isRole, roleLoading])

  // Filter requests by status
  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return requests
    return requests.filter((req) => req.status === activeTab)
  }, [requests, activeTab])

  // Get status badge — uses the shared StatusBadge (canonical tone → token map,
  // never hardcoded colors). Explicit tones preserve the original semantics.
  const getStatusBadge = (status: DrugRequestStatus) => {
    const tone =
      status === 'pending' ? 'pending' :
      status === 'approved' ? 'info' :
      status === 'fulfilled' ? 'success' :
      status === 'denied' ? 'critical' : 'neutral'
    const label = status.charAt(0).toUpperCase() + status.slice(1)
    return <StatusBadge status={status} tone={tone} label={label} />
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

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      await approveRequest({
        id: selectedRequest.id,
        notes: reviewNotes || undefined,
      })
      toast.success(`Drug request for ${selectedRequest.patientName} has been verified`)
      setShowApproveDialog(false)
      setSelectedRequest(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Failed to approve request:', error)
      toast.error('Failed to verify request. Please try again.')
    }
  }

  // Handle fulfill
  const handleFulfill = async () => {
    if (!selectedRequest) return

    if (!canConfirmFulfillment) {
      toast.error('Select a valid inventory batch for every medication before dispensing.')
      return
    }

    const dispenseAllocations = selectedRequestAssessments
      .map((assessment, index) => {
        const selectedBatchId = selectedBatchesByItem[getAssessmentKey(assessment.item, index)]
        return {
          inventoryId: selectedBatchId,
          quantity: assessment.item.quantity || 1,
          drugName: assessment.item.drugName,
        }
      })

    try {
      await fulfillRequest({
        id: selectedRequest.id,
        notes: fulfillNotes || undefined,
        dispenseAllocations,
      })
      toast.success(`Drug request for ${selectedRequest.patientName} has been fulfilled`)
      setShowFulfillDialog(false)
      setSelectedRequest(null)
      setFulfillNotes('')
      setSelectedBatchesByItem({})
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
        notes: reviewNotes || undefined,
      })
      toast.success(`Drug request for ${selectedRequest.patientName} has been denied`)
      setShowDenyDialog(false)
      setSelectedRequest(null)
      setDenialReason('')
      setReviewNotes('')
    } catch (error) {
      console.error('Failed to deny request:', error)
      toast.error('Failed to deny request. Please try again.')
    }
  }

  // Stats
  const stats = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
      denied: requests.filter((r) => r.status === 'denied').length,
      total: requests.length,
    }
  }, [requests])

  if (!roleLoading && !canDispense) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drug request queue unavailable</h3>
            <p className="text-muted-foreground">
              This workspace does not include pharmacy request processing for your current role.
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
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
          <TabsTrigger value="approved">
            Verified ({stats.approved})
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
                      onApprove={(selected) => {
                        setSelectedRequest(selected)
                        setReviewNotes('')
                        setShowApproveDialog(true)
                      }}
                      onFulfill={(selected) => {
                        setSelectedRequest(selected)
                        setFulfillNotes('')
                        setShowFulfillDialog(true)
                      }}
                      onDeny={(selected) => {
                        setSelectedRequest(selected)
                        setDenialReason('')
                        setReviewNotes('')
                        setShowDenyDialog(true)
                      }}
                      hasStockWarning={requestStockWarnings.get(request.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={!!selectedRequest && !showApproveDialog && !showFulfillDialog && !showDenyDialog}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <CompactModalShell className="sm:!max-w-2xl">
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Drug Request Details</DialogTitle>
              <DialogDescription>
                Request ID: {selectedRequest?.id}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
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

              {(selectedRequest.approvedAt || selectedRequest.fulfilledAt || selectedRequest.deniedAt) && (
                <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-4 md:grid-cols-3">
                  <div>
                    <Label className="text-muted-foreground">Verified</Label>
                    <p className="text-sm font-medium">
                      {selectedRequest.approvedAt
                        ? `${formatDate(selectedRequest.approvedAt)} by ${selectedRequest.approvedBy || 'Pharmacy'}`
                        : 'Not yet verified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dispensed</Label>
                    <p className="text-sm font-medium">
                      {selectedRequest.fulfilledAt
                        ? `${formatDate(selectedRequest.fulfilledAt)} by ${selectedRequest.fulfilledBy || 'Pharmacy'}`
                        : 'Not yet dispensed'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Denied</Label>
                    <p className="text-sm font-medium">
                      {selectedRequest.deniedAt
                        ? `${formatDate(selectedRequest.deniedAt)} by ${selectedRequest.deniedBy || 'Pharmacy'}`
                        : 'Not denied'}
                    </p>
                  </div>
                </div>
              )}

              {selectedRequestHasStockRisk ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-medium">Stock allocation needs attention</p>
                      <p>
                        One or more requested medications are low on stock, have no visible stock match, or do not
                        have enough quantity for immediate dispense.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

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
                        <TableCell className="text-muted-foreground">
                          {item.notes || '-'}
                          {(() => {
                            const assessment = selectedRequestAssessments[idx]
                            if (!assessment || inventoryLoading) return null
                            return (
                              <div className="mt-2 text-xs">
                                {assessment.isOutOfStock ? (
                                  <p className="text-red-700">No matching in-stock batch found.</p>
                                ) : assessment.isInsufficient ? (
                                  <p className="text-red-700">
                                    Only {assessment.totalAvailable} unit(s) visible in stock for this request.
                                  </p>
                                ) : (
                                  <p className="text-emerald-700">
                                    Suggested FIFO batch: {assessment.suggestedBatch?.batchNumber || 'N/A'}
                                  </p>
                                )}
                              </div>
                            )
                          })()}
                        </TableCell>
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
          </div>
        </CompactModalShell>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog
        open={showApproveDialog}
        onOpenChange={(open) => {
          setShowApproveDialog(open)
          if (!open) {
            setReviewNotes('')
          }
        }}
      >
        <CompactModalShell className="sm:!max-w-2xl">
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Verify Drug Request</DialogTitle>
              <DialogDescription>
                Confirm pharmacist review for {selectedRequest?.patientName} before dispensing.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedRequestHasStockRisk ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-medium">Stock warning</p>
                    <p>Review the suggested allocations below before marking this request as verified.</p>
                  </div>
                </div>
              </div>
            ) : null}
            <div>
              <Label>Medication Review</Label>
              <Table>
                <TableBody>
                  {selectedRequestAssessments.map((assessment, idx) => (
                    <TableRow key={`${assessment.item.drugId || assessment.item.drugName}-${idx}`}>
                      <TableCell className="font-medium">{formatDrugRequestItemContext(assessment.item)}</TableCell>
                      <TableCell>{assessment.item.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inventoryLoading ? (
                          'Checking stock...'
                        ) : assessment.isOutOfStock ? (
                          <span className="text-red-700">No matched stock available</span>
                        ) : assessment.isInsufficient ? (
                          <span className="text-red-700">
                            {assessment.totalAvailable} available, request exceeds stock
                          </span>
                        ) : (
                          <span className={assessment.isLowStock ? 'text-amber-700' : 'text-emerald-700'}>
                            FIFO batch {assessment.suggestedBatch?.batchNumber || 'N/A'} • {assessment.totalAvailable} in stock
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <Label>Verification Notes (Optional)</Label>
              <Textarea
                placeholder="Document pharmacist verification notes or substitution guidance..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false)
                setReviewNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? 'Verifying...' : 'Confirm Verification'}
            </Button>
          </DialogFooter>
        </CompactModalShell>
      </Dialog>

      {/* Fulfill Dialog */}
      <Dialog
        open={showFulfillDialog}
        onOpenChange={(open) => {
          setShowFulfillDialog(open)
          if (!open) {
            setFulfillNotes('')
            setSelectedBatchesByItem({})
          }
        }}
      >
        <CompactModalShell className="sm:!max-w-2xl">
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Fulfill Drug Request</DialogTitle>
              <DialogDescription>
                Mark this request as fulfilled for {selectedRequest?.patientName}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedRequestHasStockRisk ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-medium">Dispense warning</p>
                    <p>
                      At least one requested medication has insufficient or missing visible stock. Choose valid batches for every line item before confirming dispense.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div>
              <Label>Items to Dispense</Label>
              <Table>
                <TableBody>
                  {selectedRequestAssessments.map((assessment, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{assessment.item.drugName}</TableCell>
                      <TableCell>{assessment.item.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="space-y-2">
                          {inventoryLoading ? (
                            <span>Checking stock...</span>
                          ) : assessment.matches.length ? (
                            <Select
                              value={selectedBatchesByItem[getAssessmentKey(assessment.item, idx)] || ''}
                              onValueChange={(value) =>
                                setSelectedBatchesByItem((current) => ({
                                  ...current,
                                  [getAssessmentKey(assessment.item, idx)]: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select batch" />
                              </SelectTrigger>
                              <SelectContent>
                                {assessment.matches.map((match) => (
                                  <SelectItem key={match.id} value={match.id}>
                                    {match.batchNumber} • {match.quantity} in stock
                                    {match.isLowStock || match.isCritical ? ' • low stock' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-red-700">No matched batch</span>
                          )}
                          {!inventoryLoading ? (
                            assessment.isOutOfStock ? (
                              <span className="text-red-700">No matched stock available</span>
                            ) : assessment.isInsufficient ? (
                              <span className="text-red-700">{assessment.totalAvailable} available across matching batches</span>
                            ) : (
                              <span className={assessment.isLowStock ? 'text-amber-700' : 'text-emerald-700'}>
                                FIFO suggestion {assessment.suggestedBatch?.batchNumber || 'N/A'}
                              </span>
                            )
                          ) : null}
                        </div>
                      </TableCell>
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
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowFulfillDialog(false)
                setFulfillNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFulfill}
              disabled={fulfilling || !canConfirmFulfillment}
            >
              {fulfilling ? 'Processing...' : 'Confirm Fulfillment'}
            </Button>
          </DialogFooter>
        </CompactModalShell>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog
        open={showDenyDialog}
        onOpenChange={(open) => {
          setShowDenyDialog(open)
          if (!open) {
            setDenialReason('')
            setReviewNotes('')
          }
        }}
      >
        <CompactModalShell>
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Deny Drug Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for denying this request for {selectedRequest?.patientName}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
            <div>
              <Label>Pharmacist Notes (Optional)</Label>
              <Textarea
                placeholder="Add review context, substitution advice, or inventory notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDenyDialog(false)
                setDenialReason('')
                setReviewNotes('')
              }}
            >
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
        </CompactModalShell>
      </Dialog>
    </div>
  )
}

export default DrugRequestQueue
