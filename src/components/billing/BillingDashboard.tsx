'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { DollarSign, Clock, TrendingUp, FileText, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  CompactModalShell,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import { InvoicesTable } from './InvoicesTable'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ReportCharts } from './ReportCharts'
import { InvoiceGenerator } from './InvoiceGenerator'
import { PaymentMethodsSelect } from './PaymentMethodsSelect'
import { AdminDischargeOverrideModal } from './AdminDischargeOverrideModal'
import { useInvoices } from '@/hooks/useInvoices'
import { useCreateMobileMoneyPayment, useCreatePayment, useMobileMoneyTransaction, usePayments } from '@/hooks/usePayments'
import { useAdmissions, useDischargePatient } from '@/hooks/useAdmissions'
import { useDischargeReadiness } from '@/hooks/useWorkflow'
import { useRole } from '@/hooks/useRole'
import { DoctorSelector } from '@/components/shared/DoctorSelector'
import type { Invoice, PaymentMethod } from '@/types/billing'
import toast from 'react-hot-toast'
import { formatMoney } from '@/lib/format'

function toMoney(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function BillingDashboard() {
  const [doctorFilter, setDoctorFilter] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [detailsInvoice, setDetailsInvoice] = useState<Invoice | null>(null)
  const [momoPhoneNumber, setMomoPhoneNumber] = useState('')
  const [activeMomoTransactionId, setActiveMomoTransactionId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paidBy, setPaidBy] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isAdminOverrideModalOpen, setIsAdminOverrideModalOpen] = useState(false)
  const [overriddenInvoiceIds, setOverriddenInvoiceIds] = useState<Record<string, true>>({})
  const lastMomoStatusRef = useRef<string | null>(null)

  const { pending, stats } = useInvoices({ doctorId: doctorFilter || undefined })
  const { createPayment, creating } = useCreatePayment()
  const { createMobileMoneyPayment, creatingMobileMoneyPayment } = useCreateMobileMoneyPayment()
  const { data: detailsPayments = [] } = usePayments(detailsInvoice?.id)
  const { data: momoTransaction } = useMobileMoneyTransaction(activeMomoTransactionId || undefined, !!activeMomoTransactionId)
  const { isRole, hasPermission, isLoading: roleLoading } = useRole()
  // Hide write controls the backend would 403 for this role (popup-free billing page).
  const canCreateInvoice = !roleLoading && hasPermission('billing:invoice:create')
  const { data: patientAdmissions = [] } = useAdmissions(
    selectedInvoice
      ? {
          patientId: selectedInvoice.patientId,
          status: 'admitted',
        }
      : undefined,
    { enabled: !!selectedInvoice }
  )
  const dischargePatientMutation = useDischargePatient()

  const handleProcessPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentMethod('CASH')
    setPaymentAmount(invoice.patientDue)
    setPaidBy('')
    setMomoPhoneNumber(invoice.patient?.phone || '')
    setTransactionId('')
    setReceiptNumber('')
    setNotes('')
    setActiveMomoTransactionId(null)
    lastMomoStatusRef.current = null
  }

  const handleViewDetails = (invoice: Invoice) => {
    setDetailsInvoice(invoice)
  }

  const closePaymentDialog = () => {
    setSelectedInvoice(null)
    setMomoPhoneNumber('')
    setActiveMomoTransactionId(null)
    lastMomoStatusRef.current = null
  }

  const closeDetailsDialog = () => {
    setDetailsInvoice(null)
  }

  const handleSubmitPayment = async () => {
    if (!selectedInvoice) return

    if (paymentAmount <= 0) {
      toast.error('Amount must be greater than 0.')
      return
    }

    if (paymentAmount > selectedInvoice.patientDue) {
      toast.error('Payment amount cannot exceed patient due amount.')
      return
    }

    if (!paidBy.trim()) {
      toast.error('Paid by is required.')
      return
    }

    try {
      if (paymentMethod === 'MOBILE_MONEY') {
        if (!momoPhoneNumber.trim()) {
          toast.error('Mobile Money phone number is required.')
          return
        }

        const transaction = await createMobileMoneyPayment({
          invoiceId: selectedInvoice.id,
          amount: paymentAmount,
          phoneNumber: momoPhoneNumber.trim(),
          paidBy: paidBy.trim(),
          notes: notes.trim() || undefined,
        })

        setActiveMomoTransactionId(transaction.id)
        lastMomoStatusRef.current = transaction.status
        return
      }

      await createPayment({
        invoiceId: selectedInvoice.id,
        amount: paymentAmount,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paidBy: paidBy.trim(),
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      closePaymentDialog()
    } catch {
      // handled by mutation + global interceptors
    }
  }

  useEffect(() => {
    if (!momoTransaction || !selectedInvoice) return
    if (lastMomoStatusRef.current === momoTransaction.status) return

    lastMomoStatusRef.current = momoTransaction.status

    if (momoTransaction.status === 'SUCCESSFUL' && momoTransaction.paymentId) {
      toast.success('Mobile Money payment approved and recorded.')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      closePaymentDialog()
      return
    }

    if (momoTransaction.status === 'FAILED' || momoTransaction.status === 'EXPIRED') {
      toast.error(momoTransaction.failureReason || 'Mobile Money payment was not completed.')
    }
  }, [momoTransaction, selectedInvoice])

  const activeAdmission = patientAdmissions[0]
  const { data: dischargeReadiness } = useDischargeReadiness(activeAdmission?.id || '')
  const patientDue = selectedInvoice?.patientDue ?? 0
  const isAdmin = isRole('ADMIN')
  const hasOutstandingBalance = patientDue > 0
  const canDischargeWithoutOverride = !hasOutstandingBalance
  const canAdminOverrideDischarge = hasOutstandingBalance && isAdmin
  const hasWorkflowBlockers = !!dischargeReadiness && dischargeReadiness.blockers.some(
    (blocker) => blocker !== 'Outstanding billing balance remains',
  )
  const shouldDisableDischarge = !activeAdmission
    || creating
    || dischargePatientMutation.isPending
    || hasWorkflowBlockers
    || (hasOutstandingBalance && !isAdmin)
  const dischargeButtonLabel = canAdminOverrideDischarge ? 'Override & Discharge' : 'Discharge Patient'
  const nonAdminOutstandingTooltip = `Outstanding balance: ${formatMoney(patientDue)} — contact billing`

  const handleDischargePatient = async () => {
    if (!selectedInvoice) {
      toast.error('Select an invoice first.')
      return
    }

    if (!activeAdmission) {
      toast.error('No active admission found for this patient.')
      return
    }

    if (!canDischargeWithoutOverride) {
      return
    }

    try {
      await dischargePatientMutation.mutateAsync({
        id: activeAdmission.id,
      })
      closePaymentDialog()
    } catch {
      // handled by mutation + global interceptors
    }
  }

  const handleAdminDischargeClick = () => {
    if (!selectedInvoice || !activeAdmission || !canAdminOverrideDischarge) return
    setIsAdminOverrideModalOpen(true)
  }

  const handleOverrideSubmitted = () => {
    if (!selectedInvoice) return
    setOverriddenInvoiceIds((current) => ({
      ...current,
      [selectedInvoice.id]: true,
    }))
    closePaymentDialog()
  }

  const detailsItemsSubtotal = detailsInvoice
    ? detailsInvoice.items.reduce((sum, item) => sum + toMoney(item.total), 0)
    : 0
  const detailsSubtotal = detailsInvoice
    ? toMoney(detailsInvoice.subtotal) || detailsItemsSubtotal || toMoney(detailsInvoice.total)
    : 0
  const detailsDiscount = detailsInvoice
    ? toMoney(detailsInvoice.discountAmount || detailsInvoice.discount)
    : 0
  const detailsInsuranceDue = detailsInvoice ? toMoney(detailsInvoice.insuranceDue) : 0
  const detailsPatientDue = detailsInvoice ? toMoney(detailsInvoice.patientDue) : 0
  const detailsTotal = detailsInvoice ? toMoney(detailsInvoice.total) : 0
  const isMomoPending = momoTransaction?.status === 'PENDING'

  return (
    <>
      <PageHeader
        title="Billing Dashboard"
        description="Pending invoices, revenue stats, invoice generation, payment processing, financial reports."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats.pendingAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Invoices Today</CardTitle>
            <FileText className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-sm">
            <Label>Filter by Doctor</Label>
            <DoctorSelector
              value={doctorFilter}
              onValueChange={setDoctorFilter}
              placeholder="All doctors"
            />
          </div>
          <InvoicesTable
            invoices={pending}
            onViewDetails={handleViewDetails}
            onProcessPayment={handleProcessPayment}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportCharts />
        </CardContent>
      </Card>

      {canCreateInvoice && (
        <InvoiceGenerator
          trigger={
            <Button
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-50"
              size="lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          }
        />
      )}

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && closePaymentDialog()}>
        <CompactModalShell className="sm:!max-w-[600px]">
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Process Invoice Payment</DialogTitle>
              <DialogDescription>
                {selectedInvoice
                  ? `Invoice #${selectedInvoice.id} · Patient due ${formatMoney(selectedInvoice.patientDue)}`
                  : 'Process payment'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {dischargeReadiness && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-900">Discharge readiness</p>
                  {dischargeReadiness.responsibleRole ? (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      dischargeReadiness.responsibleRole === 'CASHIER'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-muted text-foreground'
                    }`}>
                      {dischargeReadiness.responsibleRole === 'CASHIER'
                        ? 'Billing is the active owner'
                        : `Waiting on: ${(dischargeReadiness.responsibleRole || dischargeReadiness.ownerRole).replaceAll('_', ' ')}`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted text-foreground px-2.5 py-0.5 text-[11px] font-semibold">
                      Owner: {dischargeReadiness.ownerRole.replaceAll('_', ' ')}
                    </span>
                  )}
                </div>
                {dischargeReadiness.packetStatus ? (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    dischargeReadiness.packetStatus === 'REISSUE_REQUIRED'
                      ? 'bg-amber-100 text-amber-800'
                      : dischargeReadiness.packetStatus === 'MATCHES_LAST_EXPORT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-muted text-foreground'
                  }`}>
                    Packet: {dischargeReadiness.packetStatus.replaceAll('_', ' ').toLowerCase()}
                  </span>
                ) : null}
                {dischargeReadiness.blockers.length ? dischargeReadiness.blockers.map((blocker) => (
                  <p key={blocker} className="text-sm text-amber-800">• {blocker}</p>
                )) : (
                  <p className="text-sm text-emerald-700">No workflow blockers.</p>
                )}
              </div>
            )}

            <div>
              <Label>Payment Method</Label>
              <PaymentMethodsSelect value={paymentMethod} onChange={setPaymentMethod} />
            </div>

            {paymentMethod === 'MOBILE_MONEY' ? (
              <div>
                <Label>Mobile Money Number</Label>
                <Input
                  value={momoPhoneNumber}
                  onChange={(e) => setMomoPhoneNumber(e.target.value)}
                  placeholder="e.g. 2507XXXXXXXX"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Sandbox tip: use the registered test MSISDN for the MoMo account you want to prompt.
                </p>
              </div>
            ) : null}

            <div>
              <Label>Amount (RWF)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Paid By</Label>
              <Input value={paidBy} onChange={(e) => setPaidBy(e.target.value)} placeholder="Payer full name" />
            </div>

            <div>
              <Label>Transaction ID (Optional)</Label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g., MM-TRX-2026-0001"
              />
            </div>

            <div>
              <Label>Receipt Number (Optional)</Label>
              <Input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g., RCPT-101"
              />
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
            </div>

            {paymentMethod === 'MOBILE_MONEY' && momoTransaction ? (
              <div className={`rounded-lg border p-4 ${
                momoTransaction.status === 'SUCCESSFUL'
                  ? 'border-emerald-200 bg-emerald-50'
                  : momoTransaction.status === 'FAILED' || momoTransaction.status === 'EXPIRED'
                    ? 'border-critical/30 bg-critical-muted'
                    : 'border-blue-200 bg-blue-50'
              }`}>
                <p className="text-sm font-semibold">
                  MoMo status: {momoTransaction.status.replaceAll('_', ' ')}
                </p>
                <p className="mt-1 text-sm">
                  Number: {momoTransaction.phoneNumber} · Ref: {momoTransaction.referenceId}
                </p>
                {momoTransaction.externalStatus ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gateway status: {momoTransaction.externalStatus}
                  </p>
                ) : null}
                {momoTransaction.failureReason ? (
                  <p className="mt-2 text-xs text-critical">{momoTransaction.failureReason}</p>
                ) : momoTransaction.status === 'PENDING' ? (
                  <p className="mt-2 text-xs text-blue-700">
                    Waiting for the patient to approve the Mobile Money prompt on their phone.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter className="px-6 py-4 bg-muted border-t shrink-0">
            <Button variant="outline" onClick={closePaymentDialog}>Cancel</Button>
            {hasOutstandingBalance && !isAdmin ? (
              <Button
                variant="outline"
                onClick={handleDischargePatient}
                disabled={shouldDisableDischarge}
                title={nonAdminOutstandingTooltip}
              >
                {dischargePatientMutation.isPending ? 'Discharging...' : dischargeButtonLabel}
              </Button>
            ) : (
              <Button
                variant="outline"
                className={canAdminOverrideDischarge ? 'border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800' : undefined}
                onClick={canAdminOverrideDischarge ? handleAdminDischargeClick : handleDischargePatient}
                disabled={shouldDisableDischarge}
              >
                {dischargePatientMutation.isPending ? 'Discharging...' : dischargeButtonLabel}
              </Button>
            )}
          <Button onClick={handleSubmitPayment} disabled={creating || creatingMobileMoneyPayment || isMomoPending}>
              {creating
                ? 'Processing...'
                : creatingMobileMoneyPayment
                  ? 'Sending MoMo Request...'
                  : paymentMethod === 'MOBILE_MONEY'
                    ? (isMomoPending ? 'Waiting for Approval...' : 'Send MoMo Prompt')
                    : 'Process Payment'}
            </Button>
          </DialogFooter>
        </CompactModalShell>
      </Dialog>

      <Dialog open={!!detailsInvoice} onOpenChange={(open) => !open && closeDetailsDialog()}>
        <DialogContent className="w-[95vw] sm:max-w-[900px] lg:max-w-[1100px] p-0 flex flex-col overflow-hidden bg-muted/95 backdrop-blur-3xl border-border/60 shadow-2xl rounded-3xl !max-h-[95vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Read-only invoice format for billing review.
            </DialogDescription>
          </DialogHeader>

          {detailsInvoice ? (
            <div className="flex-1 overflow-y-auto flex flex-col w-full h-full custom-scrollbar">
              {/* Premium Header */}
              <div className="relative bg-card px-8 md:px-12 py-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-b border-slate-100/80 z-20 shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-info-muted/40 via-card to-card pointer-events-none" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-info animate-pulse" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-info/80">Invoice Format</p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <h3 className="font-mono text-4xl font-semibold tracking-tight text-foreground">
                        INV-{detailsInvoice.invoiceNumber || detailsInvoice.id.slice(0, 8)}
                      </h3>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-info/20 bg-info-muted/50 text-info uppercase tracking-widest text-[10px] shadow-sm px-3 py-1 rounded-full">
                          {detailsInvoice.paymentStatus || detailsInvoice.status}
                        </Badge>
                        {typeof detailsInvoice.discountAmount === 'number' && detailsInvoice.discountAmount > 0 ? (
                          <Badge className="border-none bg-emerald-50 text-emerald-600 uppercase tracking-widest text-[10px] shadow-sm px-3 py-1 rounded-full">Discounted</Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      Issued on {format(new Date(detailsInvoice.createdAt), 'MMMM do, yyyy')} at {format(new Date(detailsInvoice.createdAt), 'h:mm a')}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                     <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Summary Amount</p>
                     <p className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
                       <span className="text-2xl text-slate-300 font-medium mr-2 align-top">RWF</span>
                       {detailsTotal.toLocaleString()}
                     </p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="flex-1 p-8 md:px-12 md:py-10 bg-muted/30">
                {/* Context Cards */}
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  {/* Patient Info Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 md:p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/60 ring-1 ring-foreground/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Billed To</p>
                        </div>
                      </div>
                      <p className="text-2xl font-semibold text-foreground tracking-tight">{detailsInvoice.patient?.fullName || 'Unknown Patient'}</p>
                      
                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">National ID</span> 
                          <p className="text-sm font-medium text-foreground">{detailsInvoice.patient?.nationalId || 'Not recorded'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</span> 
                          <p className="text-sm font-medium text-foreground">{detailsInvoice.patient?.phone || 'Not recorded'}</p>
                        </div>
                        <div className="space-y-1 col-span-2 pt-2 border-t border-slate-50">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Coverage</span> 
                          <div><span className="inline-flex items-center mt-1 rounded-md bg-muted/80 px-2.5 py-1 text-xs font-semibold text-foreground border border-border/50">{detailsInvoice.patient?.insurance?.provider || 'Self pay standard'}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Encounter Info Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 md:p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/60 ring-1 ring-foreground/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-info-muted/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-muted text-info border border-info/50 shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Encounter Info</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1 pb-4 border-b border-slate-50">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attending Practitioner</span>
                           <p className="text-lg font-semibold text-foreground">{detailsInvoice.doctorName || (detailsInvoice.doctorId ? `Doc. ${detailsInvoice.doctorId.slice(0, 8)}` : 'N/A')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Consultation</span>
                            <p className="text-xs font-mono font-medium text-muted-foreground truncate">{detailsInvoice.consultationId?.slice(0, 18) || '—'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lab Order</span>
                            <p className="text-xs font-mono font-medium text-muted-foreground truncate">{detailsInvoice.labOrderId?.slice(0, 18) || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Revised</span>
                            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">{format(new Date(detailsInvoice.updatedAt), 'MMM d, yy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
                  <div className="border-b border-slate-100 bg-muted/50 px-6 md:px-8 py-5 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Itemized Services</p>
                    <Badge variant="secondary" className="bg-card text-muted-foreground text-[10px] uppercase font-bold tracking-widest border border-border shadow-sm px-2.5 py-0.5 rounded-full">
                      {detailsInvoice.items.length} {detailsInvoice.items.length === 1 ? 'Entry' : 'Entries'}
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="min-w-full text-sm w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-6 md:px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">Service Description</TableHead>
                          <TableHead className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border w-24">Qty</TableHead>
                          <TableHead className="px-4 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border w-32">Unit Price</TableHead>
                          <TableHead className="px-6 md:px-8 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border w-40">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-border bg-card">
                         {detailsInvoice.items.length ? detailsInvoice.items.map((item, index) => (
                          <TableRow key={item.id || `${item.tariffId}-${index}`} className="group transition-colors hover:bg-info-muted/30">
                            <TableCell className="px-6 md:px-8 py-4.5">
                              <p className="font-semibold text-foreground">{item.tariff?.serviceName || item.tariff?.billingCode || 'Unnamed service'}</p>
                              {item.tariff?.billingCode && <p className="text-[11px] text-muted-foreground font-mono mt-1 w-fit bg-muted px-1.5 rounded">{item.tariff.billingCode}</p>}
                            </TableCell>
                            <TableCell className="px-4 py-4.5 text-center">
                              <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-lg bg-muted px-2 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border/50">
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-4.5 text-right font-medium text-muted-foreground tabular-nums">
                               {formatMoney(item.unitPrice)}
                            </TableCell>
                            <TableCell className="px-6 md:px-8 py-4.5 text-right tabular-nums">
                              <span className="font-semibold text-foreground">{formatMoney(item.total)}</span>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={4} className="px-6 py-16 text-center bg-muted/30">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border text-muted-foreground">
                                   <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M20 16H4M20 8H4" /></svg>
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">No invoice items recorded.</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Bottom Section: Payments & Totals */}
                <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                  {/* Payments */}
                  <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-7 shadow-sm ring-1 ring-foreground/5 flex flex-col">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                       <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Payment Clearances
                    </p>
                    <div className="flex-1 space-y-3">
                      {detailsPayments.length ? detailsPayments.map((payment) => (
                        <div key={payment.id} className="relative flex items-center gap-4 rounded-xl border border-slate-100 bg-emerald-50/30 p-4 transition-all hover:bg-emerald-50/50 hover:border-emerald-200/50">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-foreground tabular-nums">
                                {formatMoney(payment.amount)} 
                                </p>
                                <span className="inline-flex items-center rounded-md bg-card px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm border border-border/80">
                                    {payment.paymentMethod.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between">
                                <p className="text-[11px] font-medium text-muted-foreground">
                                {format(new Date(payment.paidAt), 'MMM d, h:mm a')}
                                </p>
                                <div className="flex gap-2">
                                  {payment.receiptNumber && (
                                    <p className="text-[10px] text-muted-foreground">RCPT: <span className="text-muted-foreground font-medium font-mono">{payment.receiptNumber}</span></p>
                                  )}
                                </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-6 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-slate-100 mb-4">
                             <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          </div>
                          <p className="text-sm font-semibold text-muted-foreground">Awaiting Payments</p>
                          <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px] leading-relaxed">Transactions directed to this invoice will be historically logged here.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Premium Totals Summary */}
                  <div className="rounded-2xl bg-foreground border border-slate-800 p-6 md:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden text-slate-100">
                    {/* Background accent */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-info/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-6">Financial Summary</p>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                              <span className="text-sm font-medium text-slate-300">Subtotal Amount</span>
                              <span className="text-sm font-medium text-white tabular-nums">{formatMoney(detailsSubtotal)}</span>
                          </div>
                          {detailsDiscount > 0 && (
                              <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                                  <span className="text-sm font-medium text-slate-300">Adjustment / Discount</span>
                                  <span className="text-sm font-medium text-emerald-400 tabular-nums">- {formatMoney(detailsDiscount)}</span>
                              </div>
                          )}
                          <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                              <span className="text-sm font-medium text-slate-300">Covered by Insurance</span>
                              <span className="text-sm font-medium text-info tabular-nums">{formatMoney(detailsInsuranceDue)}</span>
                          </div>
                        </div>

                        {detailsInvoice.discountReason && (
                        <div className="mt-5 rounded-xl bg-foreground/80 border border-slate-700 p-4 backdrop-blur-sm">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2 flex items-center gap-1.5">
                               <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                               Discount Note
                            </p>
                            <p className="text-xs font-medium text-slate-300 leading-relaxed">{detailsInvoice.discountReason}</p>
                        </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-700 relative z-10">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Total Patient Due</span>
                                {detailsPatientDue > 0 ? (
                                    <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">Outstanding</span>
                                ) : (
                                    <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">Cleared</span>
                                )}
                            </div>
                            <span className="text-4xl lg:text-5xl font-bold tracking-tighter text-white tabular-nums drop-shadow-sm text-right">
                              {formatMoney(detailsPatientDue)}
                            </span>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-20 flex shrink-0 items-center justify-end gap-4 border-t border-border/60 bg-card/80 px-8 py-5 backdrop-blur-xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                <Button variant="outline" className="font-semibold px-6 border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-11 rounded-xl" onClick={closeDetailsDialog}>Close Preview</Button>
                {detailsPatientDue > 0 && (
                  <Button className="font-semibold px-8 h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all rounded-xl" onClick={() => {
                    closeDetailsDialog()
                    handleProcessPayment(detailsInvoice)
                  }}>
                    Process Payment
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {Object.keys(overriddenInvoiceIds).length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border border-amber-300">
            Admin Discharge — Unpaid Balance
          </Badge>
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            Pending Collection
          </Badge>
        </div>
      )}

      {selectedInvoice && activeAdmission && (
        <AdminDischargeOverrideModal
          open={isAdminOverrideModalOpen}
          onOpenChange={setIsAdminOverrideModalOpen}
          admissionId={activeAdmission.id}
          outstandingAmount={selectedInvoice.patientDue}
          onSubmitted={handleOverrideSubmitted}
        />
      )}
    </>
  )
}
