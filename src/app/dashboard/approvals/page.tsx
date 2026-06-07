'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Percent,
  DollarSign,
  User,
  Calendar,
} from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import { usePendingApprovals, useApprovalStats, useApproveRequest, useDenyRequest } from '@/hooks/useApprovals'
import type { ApprovalRequest, ApprovalType } from '@/types/approval'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'

export default function ApprovalsPage() {
  const { hasPermission, isLoading: roleLoading } = useRole()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [denyReason, setDenyReason] = useState('')

  // Check permission
  const canApprove = hasPermission('CAN_APPROVE') || hasPermission('approval:read') || hasPermission('approval:decide')

  // Filter by type
  const typeFilter = activeTab === 'all' ? undefined : activeTab as ApprovalType

  // Fetch data
  const { data: approvals = [], isLoading: approvalsLoading } = usePendingApprovals(typeFilter)
  const { data: stats, isLoading: statsLoading } = useApprovalStats()

  // Mutations
  const approveMutation = useApproveRequest()
  const denyMutation = useDenyRequest()

  // Handle approval
  const handleApprove = async (request: ApprovalRequest) => {
    try {
      await approveMutation.mutateAsync({ id: request.id })
    } catch (error) {
      console.error('Failed to approve request:', error)
    }
  }

  // Handle deny click
  const handleDenyClick = (request: ApprovalRequest) => {
    setSelectedRequest(request)
    setDenyReason('')
    setDenyDialogOpen(true)
  }

  // Confirm deny
  const handleDenyConfirm = async () => {
    if (!selectedRequest || !denyReason.trim()) return
    
    try {
      await denyMutation.mutateAsync({ 
        id: selectedRequest.id, 
        reason: denyReason 
      })
      setDenyDialogOpen(false)
      setSelectedRequest(null)
      setDenyReason('')
    } catch (error) {
      console.error('Failed to deny request:', error)
    }
  }

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-RW', { 
      style: 'currency', 
      currency: 'RWF' 
    }).format(amount)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
  if (roleLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Permission check
  if (!canApprove) {
    return <ForbiddenAccess />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve pending requests from staff
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.pendingApprovals ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingInvoiceDeletions ?? 0} invoice deletions, {stats?.pendingDiscounts ?? 0} discounts
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats?.todayApproved ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Approved today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{stats?.todayDenied ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Denied today
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="invoice_deletion">Invoice Deletions</TabsTrigger>
          <TabsTrigger value="discount">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Approval Requests List */}
          {approvalsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : approvals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending approvals at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvals.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {request.type === 'invoice_deletion' ? (
                            <FileText className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Percent className="h-5 w-5 text-purple-500" />
                          )}
                          <CardTitle className="text-lg">
                            {request.type === 'invoice_deletion' ? 'Invoice Deletion Request' : 'Discount Request'}
                          </CardTitle>
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.requestedByName || request.requestedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(request.requestedAt)}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Request Details */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {request.type === 'invoice_deletion' ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Invoice ID</p>
                              <p className="font-medium">{request.invoiceId || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Invoice Total</p>
                              <p className="font-medium">{formatCurrency(request.invoiceTotal)}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Delete Reason</p>
                            <p className="font-medium">{request.deleteReason || 'No reason provided'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Patient Name</p>
                              <p className="font-medium">{request.patientName || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Patient ID</p>
                              <p className="font-medium font-mono">{request.patientId || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Discount Amount</p>
                              <p className="font-medium text-green-600">
                                {request.discountAmount ? formatCurrency(request.discountAmount) : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Discount Percentage</p>
                              <p className="font-medium text-purple-600">
                                {request.discountPercentage ? `${request.discountPercentage}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Reason</p>
                            <p className="font-medium">{request.discountReason || 'No reason provided'}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                      <Button
                        variant="destructive"
                        onClick={() => handleDenyClick(request)}
                        disabled={approveMutation.isPending || denyMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Deny
                      </Button>
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(request)}
                        disabled={approveMutation.isPending || denyMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Deny Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this {selectedRequest?.type === 'invoice_deletion' ? 'invoice deletion' : 'discount'} request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deny-reason">Reason for denial</Label>
              <Textarea
                id="deny-reason"
                placeholder="Enter the reason..."
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDenyConfirm}
              disabled={!denyReason.trim() || denyMutation.isPending}
            >
              Confirm Denial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
