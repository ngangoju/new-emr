'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, CreditCard, Trash2, Percent, Eye, EyeOff } from 'lucide-react'
import type { Invoice } from '@/types/billing'
import { format } from 'date-fns'
import { useRole } from '@/hooks/useRole'
import { useMyApprovals, usePendingApprovals, useRequestDiscountApproval, useRequestInvoiceVoid } from '@/hooks/useApprovals'
import toast from 'react-hot-toast'
import { maskIdentifier, type RevealedIdsMap } from '@/lib/utils/masking'
import { useMemo, useState } from 'react'
import { formatMoney } from '@/lib/format'

interface InvoicesTableProps {
  invoices: Invoice[]
  onProcessPayment?: (invoice: Invoice) => void
  onViewDetails?: (invoice: Invoice) => void
  onInvoiceVoidRequested?: () => void
}

const MIN_VOID_REASON_LENGTH = 10
const MIN_DISCOUNT_REASON_LENGTH = 8


export function InvoicesTable({
  invoices,
  onProcessPayment,
  onViewDetails,
  onInvoiceVoidRequested,
}: InvoicesTableProps) {
  const { hasPermission, isRole, isLoading: roleLoading } = useRole()
  const requestInvoiceVoidMutation = useRequestInvoiceVoid()
  const requestDiscountApprovalMutation = useRequestDiscountApproval()

  const [selectedInvoiceForVoid, setSelectedInvoiceForVoid] = useState<Invoice | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [selectedInvoiceForDiscount, setSelectedInvoiceForDiscount] = useState<Invoice | null>(null)
  const [discountAmount, setDiscountAmount] = useState('')
  const [discountReason, setDiscountReason] = useState('')
  const [revealedIds, setRevealedIds] = useState<RevealedIdsMap>({})

  const toggleIdReveal = (id: string) => {
    setRevealedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const canRequestInvoiceVoidApproval = hasPermission('CAN_APPROVE') || isRole(['ADMIN', 'MANAGER'])
  const canRequestDiscountApproval = isRole(['DOCTOR', 'CLINICAL_DIRECTOR', 'ADMIN'])
  const shouldFetchPendingDiscountApprovals = !roleLoading && canRequestInvoiceVoidApproval
  const { data: pendingDiscountApprovals = [] } = usePendingApprovals('discount', {
    enabled: shouldFetchPendingDiscountApprovals,
  })
  const { data: myDiscountApprovals = [] } = useMyApprovals({
    type: 'discount',
    enabled: !roleLoading && canRequestDiscountApproval,
  })

  const pendingDiscountInvoiceIds = useMemo(() => new Set(
    pendingDiscountApprovals
      .filter((request) => request.type === 'discount' && request.status === 'pending' && request.targetId)
      .map((request) => request.targetId as string)
  ), [pendingDiscountApprovals])

const latestMyDiscountRequestsByInvoiceId = useMemo(() => {
    // Sort by requestedAt descending to get the most recent request per invoice
    const sorted = [...myDiscountApprovals].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    )
    return sorted.reduce<Record<string, typeof myDiscountApprovals[number]>>((acc, request) => {
      if (!request.targetId) return acc
      if (!acc[request.targetId]) {
        acc[request.targetId] = request
      }
      return acc
    }, {})
  }, [myDiscountApprovals])

  const openVoidDialog = (invoice: Invoice) => {
    setSelectedInvoiceForVoid(invoice)
    setVoidReason('')
  }

  const closeVoidDialog = () => {
    if (requestInvoiceVoidMutation.isPending) return
    setSelectedInvoiceForVoid(null)
    setVoidReason('')
  }

  const handleSubmitVoidRequest = async () => {
    if (!selectedInvoiceForVoid) return

    const reason = voidReason.trim()
    if (reason.length < MIN_VOID_REASON_LENGTH) {
      toast.error(`Reason is required (minimum ${MIN_VOID_REASON_LENGTH} characters).`)
      return
    }

    try {
      await requestInvoiceVoidMutation.mutateAsync({
        invoiceId: selectedInvoiceForVoid.id,
        reason,
      })

      toast.success('Invoice flagged for deletion approval.')
      closeVoidDialog()
      onInvoiceVoidRequested?.()
    } catch {
      // handled by API interceptors/toast handlers
    }
  }

  const openDiscountDialog = (invoice: Invoice) => {
    setSelectedInvoiceForDiscount(invoice)
    setDiscountAmount('')
    setDiscountReason('')
  }

  const closeDiscountDialog = () => {
    if (requestDiscountApprovalMutation.isPending) return
    setSelectedInvoiceForDiscount(null)
    setDiscountAmount('')
    setDiscountReason('')
  }

  const handleSubmitDiscountApprovalRequest = async () => {
    if (!selectedInvoiceForDiscount) return

    const parsedAmount = Number(discountAmount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Discount amount must be greater than 0.')
      return
    }

    const reason = discountReason.trim()
    if (reason.length < MIN_DISCOUNT_REASON_LENGTH) {
      toast.error(`Reason is required (minimum ${MIN_DISCOUNT_REASON_LENGTH} characters).`)
      return
    }

    try {
      await requestDiscountApprovalMutation.mutateAsync({
        invoiceId: selectedInvoiceForDiscount.id,
        amount: parsedAmount,
        reason,
        patientId: selectedInvoiceForDiscount.patientId,
      })
      toast.success('Discount submitted for approval.')
      closeDiscountDialog()
    } catch {
      // handled globally
    }
  }

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Patient Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const statusValue = String(invoice.status).toUpperCase()
              const isVoidPending = statusValue === 'VOID_PENDING' || statusValue === 'PENDING_VOID'
              const latestDiscountRequest = latestMyDiscountRequestsByInvoiceId[invoice.id]
              const hasDiscountApplied = typeof invoice.discountAmount === 'number' && invoice.discountAmount > 0
              const isDiscountPending = !hasDiscountApplied && (
                latestDiscountRequest?.status === 'pending'
                || (!latestDiscountRequest && pendingDiscountInvoiceIds.has(invoice.id))
              )
              const isDiscountDenied = !isDiscountPending && !hasDiscountApplied && latestDiscountRequest?.status === 'denied'

              const patientFullName = invoice.patient?.fullName || 'Unknown'
              const patientInitials = patientFullName.trim() ? patientFullName.slice(0, 2).toUpperCase() : '??'
              const nationalId = invoice.patient?.nationalId
              const isRevealed = revealedIds[invoice.id] || false
              const displayNationalId = nationalId
                ? (isRevealed ? nationalId : (maskIdentifier(nationalId) || nationalId))
                : '—'

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : `#${invoice.id.slice(0, 8)}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-medium text-xs text-muted-foreground">
                        {patientInitials}
                      </div>
                      <div>
                        <p className="font-medium">{patientFullName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {displayNationalId}
                          {nationalId && (
                            <button
                              onClick={() => toggleIdReveal(invoice.id)}
                              className="ml-1 p-0.5 hover:bg-muted rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              title={isRevealed ? 'Hide ID' : 'Reveal full ID'}
                            >
                              {isRevealed ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.doctorName || (invoice.doctorId ? `Dr. ${invoice.doctorId.slice(0, 8)}` : '—')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatMoney(invoice.total)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">
                      {formatMoney(invoice.patientDue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {isVoidPending ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          VOID_PENDING
                        </Badge>
                      ) : (
                        <Badge variant={statusValue === 'PAID' || invoice.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                          {invoice.paymentStatus || statusValue}
                        </Badge>
                      )}
                      {isDiscountPending && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          DISCOUNT_PENDING_APPROVAL
                        </Badge>
                      )}
                      {isDiscountDenied && (
                        <Badge variant="secondary" className="bg-rose-100 text-rose-800">
                          DISCOUNT_DENIED
                        </Badge>
                      )}
                      {hasDiscountApplied && (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          DISCOUNT_APPLIED
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(invoice.createdAt, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      title="View Details"
                      onClick={() => onViewDetails?.(invoice)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    {statusValue !== 'PAID' && invoice.paymentStatus !== 'PAID'
                      && !roleLoading && hasPermission('billing:payment:create') && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onProcessPayment?.(invoice)}
                        title="Process Payment"
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    )}
                    {!roleLoading && canRequestInvoiceVoidApproval && !isVoidPending && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openVoidDialog(invoice)}
                        title="Flag for Deletion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!roleLoading && canRequestDiscountApproval && !isDiscountPending && !hasDiscountApplied && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDiscountDialog(invoice)}
                        title="Request Discount Approval"
                      >
                        <Percent className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {invoices.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No invoices matching filters.
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedInvoiceForVoid}
        onOpenChange={(open) => {
          if (!open) closeVoidDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Invoice for Deletion</DialogTitle>
            <DialogDescription>
              {selectedInvoiceForVoid
                ? `Invoice #${selectedInvoiceForVoid.id} will be submitted for approval before deletion.`
                : 'Submit invoice deletion request'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="invoice-void-reason">Reason</Label>
            <Textarea
              id="invoice-void-reason"
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              placeholder="Provide a clear justification for deletion"
              minLength={MIN_VOID_REASON_LENGTH}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum {MIN_VOID_REASON_LENGTH} characters required.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeVoidDialog}
              disabled={requestInvoiceVoidMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmitVoidRequest}
              disabled={requestInvoiceVoidMutation.isPending}
            >
              {requestInvoiceVoidMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedInvoiceForDiscount}
        onOpenChange={(open) => {
          if (!open) closeDiscountDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Discount Approval</DialogTitle>
            <DialogDescription>
              {selectedInvoiceForDiscount
                ? `Invoice #${selectedInvoiceForDiscount.id} will remain unchanged until approved by Clinical Director/Admin.`
                : 'Submit discount request'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="discount-amount">Discount Amount (RWF)</Label>
              <input
                id="discount-amount"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                type="number"
                min={1}
                step="0.01"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
                placeholder="Enter discount amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-reason">Reason</Label>
              <Textarea
                id="discount-reason"
                value={discountReason}
                onChange={(event) => setDiscountReason(event.target.value)}
                placeholder="Provide clinical/financial justification"
                minLength={MIN_DISCOUNT_REASON_LENGTH}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDiscountDialog}
              disabled={requestDiscountApprovalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitDiscountApprovalRequest}
              disabled={requestDiscountApprovalMutation.isPending}
            >
              {requestDiscountApprovalMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
