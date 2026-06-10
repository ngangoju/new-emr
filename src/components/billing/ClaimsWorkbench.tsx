'use client'

import { useState } from 'react'
import { FileText, CheckCircle, XCircle, AlertCircle, RefreshCcw } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import { useClaims, useUpdateClaimStatus } from '@/hooks/useClaims'
import { useRole } from '@/hooks/useRole'
import type { InsuranceClaim, ClaimStatus } from '@/types/insurance'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <RefreshCcw className="h-4 w-4 text-blue-500" />,
  SUBMITTED: <FileText className="h-4 w-4 text-purple-500" />,
  APPROVED: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  PAID: <CheckCircle className="h-4 w-4 text-green-600" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-500" />
}

export function ClaimsWorkbench() {
  const [filterStatus, setFilterStatus] = useState<string>('')
  const { hasPermission, isLoading: roleLoading } = useRole()
  // The /dashboard/billing route is shared by several roles; only fetch and offer
  // claim actions when the backend authorities allow them, so nobody gets 403 popups.
  const canReadClaims = !roleLoading && hasPermission('billing:claim:read')
  const canManageClaims = !roleLoading && hasPermission('billing:claim:create')
  const { data: claims = [], isLoading } = useClaims(filterStatus || undefined, { enabled: canReadClaims })
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateClaimStatus()
  
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null)
  const [isDenialModalOpen, setIsDenialModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleUpdateStatus = (claim: InsuranceClaim, newStatus: ClaimStatus) => {
    if (newStatus === 'REJECTED') {
      setSelectedClaim(claim)
      setRejectionReason('')
      setIsDenialModalOpen(true)
    } else {
      updateStatus({ claimId: claim.id, status: newStatus })
    }
  }

  const handleRejectSubmit = () => {
    if (selectedClaim && rejectionReason.trim()) {
      updateStatus({
        claimId: selectedClaim.id,
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim()
      }, {
        onSuccess: () => {
          setIsDenialModalOpen(false)
          setSelectedClaim(null)
        }
      })
    }
  }

  const pendingCount = claims.filter((c: InsuranceClaim) => c.status === 'PENDING').length
  const submittedCount = claims.filter((c: InsuranceClaim) => c.status === 'SUBMITTED').length
  const rejectedCount = claims.filter((c: InsuranceClaim) => c.status === 'REJECTED').length

  if (!roleLoading && !canReadClaims) {
    return (
      <>
        <PageHeader
          title="Claims Workbench"
          description="Manage insurance claims, track submissions, and handle denials."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Claims are handled by the billing office</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Your role does not include insurance claim processing. Please contact a billing
              officer for claim submissions and denials.
            </p>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Claims Workbench"
        description="Manage insurance claims, track submissions, and handle denials."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <RefreshCcw className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Submitted Claims</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rejected / Denied</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Claims Queue</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={filterStatus === '' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('')}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={filterStatus === 'PENDING' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('PENDING')}
              size="sm"
            >
              Pending
            </Button>
            <Button 
              variant={filterStatus === 'SUBMITTED' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('SUBMITTED')}
              size="sm"
            >
              Submitted
            </Button>
            <Button 
              variant={filterStatus === 'REJECTED' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('REJECTED')}
              size="sm"
            >
              Rejected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No claims found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insurance Co.</TableHead>
                    <TableHead>Policy #</TableHead>
                    <TableHead>Amount (RWF)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim: InsuranceClaim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.insuranceCompany}</TableCell>
                      <TableCell>{claim.policyNumber || 'N/A'}</TableCell>
                      <TableCell>{claim.claimAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {STATUS_ICONS[claim.status]}
                          <span className="text-sm font-medium">{claim.status}</span>
                        </div>
                        {claim.status === 'REJECTED' && claim.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={claim.rejectionReason}>
                            {claim.rejectionReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>Created: {new Date(claim.createdAt).toLocaleDateString()}</div>
                        {claim.submittedAt && <div>Submitted: {new Date(claim.submittedAt).toLocaleDateString()}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canManageClaims && claim.status === 'PENDING' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(claim, 'SUBMITTED')} disabled={isUpdating}>
                              Submit
                            </Button>
                          )}
                          {canManageClaims && claim.status === 'SUBMITTED' && (
                            <>
                              <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(claim, 'APPROVED')} disabled={isUpdating}>
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(claim, 'REJECTED')} disabled={isUpdating}>
                                Reject
                              </Button>
                            </>
                          )}
                          {canManageClaims && claim.status === 'APPROVED' && (
                            <Button size="sm" variant="default" onClick={() => handleUpdateStatus(claim, 'PAID')} disabled={isUpdating}>
                              Mark Paid
                            </Button>
                          )}
                          {canManageClaims && claim.status === 'REJECTED' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(claim, 'PENDING')} disabled={isUpdating}>
                              Requeue
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDenialModalOpen} onOpenChange={setIsDenialModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Claim Denial</DialogTitle>
            <DialogDescription>
              Please provide the rejection reason from the payer. This will be visible to the billing and clinical teams for correction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea 
                placeholder="e.g., Invalid diagnosis code, patient ineligible, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDenialModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={!rejectionReason.trim() || isUpdating}>
              Confirm Denial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
