'use client'

import { useState } from 'react'
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import { InvoicesTable } from './InvoicesTable'
import { ReportCharts } from './ReportCharts'
import { InvoiceGenerator } from './InvoiceGenerator'
import { PaymentMethodsSelect } from './PaymentMethodsSelect'
import { AdminDischargeOverrideModal } from './AdminDischargeOverrideModal'
import { useInvoices } from '@/hooks/useInvoices'
import { useCreatePayment } from '@/hooks/usePayments'
import { useAdmissions, useDischargePatient } from '@/hooks/useAdmissions'
import { useRole } from '@/hooks/useRole'
import { DoctorSelector } from '@/components/shared/DoctorSelector'
import type { Invoice, PaymentMethod } from '@/types/billing'
import toast from 'react-hot-toast'

export function BillingDashboard() {
  const [doctorFilter, setDoctorFilter] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paidBy, setPaidBy] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isAdminOverrideModalOpen, setIsAdminOverrideModalOpen] = useState(false)
  const [overriddenInvoiceIds, setOverriddenInvoiceIds] = useState<Record<string, true>>({})

  const { pending, stats } = useInvoices({ doctorId: doctorFilter || undefined })
  const { createPayment, creating } = useCreatePayment()
  const { isRole } = useRole()
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
    setTransactionId('')
    setReceiptNumber('')
    setNotes('')
  }

  const closePaymentDialog = () => {
    setSelectedInvoice(null)
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

  const activeAdmission = patientAdmissions[0]
  const patientDue = selectedInvoice?.patientDue ?? 0
  const isAdmin = isRole('ADMIN')
  const hasOutstandingBalance = patientDue > 0
  const canDischargeWithoutOverride = !hasOutstandingBalance
  const canAdminOverrideDischarge = hasOutstandingBalance && isAdmin
  const shouldDisableDischarge = !activeAdmission || creating || dischargePatientMutation.isPending || (hasOutstandingBalance && !isAdmin)
  const dischargeButtonLabel = canAdminOverrideDischarge ? 'Override & Discharge' : 'Discharge Patient'
  const nonAdminOutstandingTooltip = `Outstanding balance: ${patientDue} RWF — contact billing`

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
            <div className="text-2xl font-bold">RWF {stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF {stats.pendingAmount.toLocaleString()}</div>
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

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && closePaymentDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Invoice Payment</DialogTitle>
            <DialogDescription>
              {selectedInvoice
                ? `Invoice #${selectedInvoice.id} · Patient due RWF ${selectedInvoice.patientDue.toLocaleString()}`
                : 'Process payment'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <PaymentMethodsSelect value={paymentMethod} onChange={setPaymentMethod} />
            </div>

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
          </div>

          <DialogFooter>
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
          <Button onClick={handleSubmitPayment} disabled={creating}>
              {creating ? 'Processing...' : 'Process Payment'}
            </Button>
          </DialogFooter>
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
