'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Save, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { PaymentMethodsSelect } from './PaymentMethodsSelect'
import { useCreateMobileMoneyPayment, useCreatePayment, useMobileMoneyTransaction } from '@/hooks/usePayments'
import { useCreateInvoice, useInvoicePreview } from '@/hooks/useInvoices'
import { PatientSearchCombobox } from './PatientSearchCombobox'
import { TariffSearchCombobox } from './TariffSearchCombobox'
import { DoctorSelector } from '@/components/shared/DoctorSelector'
import type { Patient } from '@/types/patient'
import type { Tariff, PaymentMethod } from '@/types/billing'
import { formatMoney } from '@/lib/format'

interface InvoiceItem {
  tariffId: string
  tariff: Tariff
  quantity: number
  unitPrice: number
  total: number
}

const defaultPatient: Patient = {
  id: '',
  fullName: 'Guest Patient',
  nationalId: '',
  phone: '',
  dateOfBirth: new Date(),
  gender: 'male',
  address: { province: '', district: '', sector: '', cell: '', village: '' },
  insurance: { provider: 'CASH', cardNumber: '', copayPercentage: 100 },
  emergencyContact: { name: '', phone: '', relationship: '' },
  allergies: [],
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
}

function getEffectivePrice(tariff: Tariff, patient: Patient) {
  const insuranceInfo = patient.insuranceInfo;
  let payer = patient.insurance?.provider?.toUpperCase() || 'CASH';

  // If insuranceInfo (JSON) exists, extract provider
  if (insuranceInfo) {
    try {
      const parsed = JSON.parse(insuranceInfo);
      payer = (parsed.insurance || parsed.provider || payer).toUpperCase();
    } catch (error) {
       console.warn('Failed to parse patient insurance information for invoice pricing.', error)
    }
  }

  if (payer.includes('MUTUELLE') || payer.includes('CBHI')) {
    if (tariff.insurancePrices) {
      try {
        const prices = JSON.parse(tariff.insurancePrices);
        if (prices.mutuelle) return prices.mutuelle;
      } catch (error) {
        console.warn('Failed to parse tariff insurance prices for invoice pricing.', error)
      }
    }
    return tariff.rssbMmiPrice || tariff.basePrice;
  }

  if (payer.includes('RSSB') || payer.includes('MMI') || payer.includes('RAMA')) {
    return tariff.rssbMmiPrice || tariff.basePrice;
  }

  if (payer.includes('PRIVATE') || payer.includes('CASH')) {
    return tariff.privatePrice || tariff.basePrice;
  }

  return tariff.basePrice;
}

function getPatientShare(total: number, patient: Patient) {
    const insuranceInfo = patient.insuranceInfo;
    let payer = patient.insurance?.provider?.toUpperCase() || 'CASH';
  
    if (insuranceInfo) {
      try {
        const parsed = JSON.parse(insuranceInfo);
        payer = (parsed.insurance || parsed.provider || payer).toUpperCase();
      } catch (error) {
        console.warn('Failed to parse patient insurance information for payment split.', error)
      }
    }
  
    if (payer.includes('MUTUELLE') || payer.includes('CBHI')) return total * 0.10;
    if (payer.includes('MMI') || payer.includes('RAMA') || payer.includes('RADIANT') || payer.includes('RSSB')) return total * 0.15;
    if (payer.includes('AEQUI')) return total * 0.20;
    
    return total;
}

export function InvoiceGenerator({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'patient' | 'services' | 'summary' | 'payment'>('services')
  const [patient, setPatient] = useState<Patient>(defaultPatient)
  const [doctorId, setDoctorId] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [momoPhoneNumber, setMomoPhoneNumber] = useState('')
  const [activeMomoTransactionId, setActiveMomoTransactionId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [transactionId, setTransactionId] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const { createPayment, creating: paymentProcessing } = useCreatePayment()
  const { createMobileMoneyPayment, creatingMobileMoneyPayment } = useCreateMobileMoneyPayment()
  const { data: momoTransaction } = useMobileMoneyTransaction(activeMomoTransactionId || undefined, !!activeMomoTransactionId)
  const lastMomoStatusRef = useRef<string | null>(null)
  const { mutateAsync: createInvoice, isPending: creatingInvoice } = useCreateInvoice()

  const previewPayload = patient.id ? {
    patientId: patient.id,
    doctorId: doctorId || undefined,
    items: items.map(item => ({
      billing_code: item.tariff.billingCode,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      description: item.tariff.serviceName,
      tariffId: item.tariffId
    })),
    discount
  } : null;

  const { data: preview, isLoading: loadingPreview } = useInvoicePreview(previewPayload)

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const patientDue = preview ? preview.patientDue : (getPatientShare(subtotal, patient) - discount)
  const insuranceDue = preview ? preview.insuranceDue : (subtotal - patientDue - discount)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMomoPhoneNumber(patient.phone || '')
  }, [patient.id, patient.phone])

  useEffect(() => {
    if (!momoTransaction) return
    if (lastMomoStatusRef.current === momoTransaction.status) return

    lastMomoStatusRef.current = momoTransaction.status

    if (momoTransaction.status === 'SUCCESSFUL' && momoTransaction.paymentId) {
      toast.success('Mobile Money payment approved and recorded.')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false)
      setPaymentAmount(0)
      setTransactionId('')
      setPaidBy('')
      setReceiptNumber('')
      setNotes('')
      setActiveMomoTransactionId(null)
      return
    }

    if (momoTransaction.status === 'FAILED' || momoTransaction.status === 'EXPIRED') {
      toast.error(momoTransaction.failureReason || 'Mobile Money payment was not completed.')
    }
  }, [momoTransaction])

  const addItem = (tariff: Tariff) => {
    const unitPrice = getEffectivePrice(tariff, patient)
    const newItem: InvoiceItem = {
      tariffId: tariff.id,
      tariff: tariff,
      quantity: 1,
      unitPrice: unitPrice,
      total: unitPrice,
    }
    setItems([...items, newItem])
  }

  const updateItemQuantity = (index: number, qty: number) => {
    const updated = [...items]
    updated[index].quantity = qty
    updated[index].total = updated[index].unitPrice * qty
    setItems(updated)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleCreateDraft = async () => {
    if (!patient.id) {
       toast.error('Please select a patient first.')
       setActiveTab('patient')
       return
    }

    if (items.length === 0) {
       toast.error('Please add at least one service.')
       return
    }

    if (!doctorId) {
       toast.error('Please select a doctor for this invoice.')
       setActiveTab('patient')
       return
    }

    try {
      const result = await createInvoice({
        patientId: patient.id,
        doctorId,
        items: items.map(item => ({
          billing_code: item.tariff.billingCode,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          description: item.tariff.serviceName,
          tariffId: item.tariffId
        })),
        discount
      })
      
      setCreatedInvoiceId(result.id)
      setPaymentAmount(result.patientDue) // Default to full patient share
      setActiveMomoTransactionId(null)
      lastMomoStatusRef.current = null
      toast.success('Invoice draft generated.')
      setActiveTab('payment')
    } catch {
      toast.error('Failed to create invoice.')
    }
  }

  const handlePay = async () => {
    if (!createdInvoiceId) {
      toast.error('Invoice not created yet.')
      return
    }
    if (paymentAmount <= 0) {
      toast.error('Amount must be greater than 0.')
      return
    }

    if (paymentAmount > patientDue) {
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
          invoiceId: createdInvoiceId,
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
        invoiceId: createdInvoiceId,
        amount: paymentAmount,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        paidBy: paidBy.trim(),
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      setOpen(false)
      setPaymentAmount(0)
      setTransactionId('')
      setPaidBy('')
      setReceiptNumber('')
      setNotes('')
    } catch {
      // handled via global api + hook error handling
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Invoice</DialogTitle>
          <DialogDescription>
            Generate invoice for patient, add services, calculate totals, process payment.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          <TabsContent value="patient" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <PatientSearchCombobox 
                    value={patient.id}
                    onSelect={(p) => setPatient(p)}
                />
              </div>
              <div className="space-y-2">
                <Label>Insurance Plan</Label>
                <Input value={patient.insurance?.provider || 'CASH'} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Doctor *</Label>
                <DoctorSelector
                  value={doctorId}
                  onValueChange={setDoctorId}
                  placeholder="Select billing doctor"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="services" className="space-y-4">
            <div className="flex gap-2">
              <TariffSearchCombobox 
                value=""
                onSelect={(tariff) => addItem(tariff)} 
              />
              <p className="text-xs text-muted-foreground self-center">
                Search and select a service to add to the invoice.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.tariff.serviceName}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>{formatMoney(item.unitPrice)}</TableCell>
                    <TableCell>{formatMoney(item.total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <Label>Discount:</Label>
                  <Input 
                    type="number" 
                    value={discount} 
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Insurance Share:</span>
                  <span>{loadingPreview ? 'Calculating...' : `${formatMoney(insuranceDue)}`}</span>
                </div>
                <div className="flex justify-between border-t pt-3 font-bold text-lg text-primary">
                  <span>Patient Due:</span>
                  <span>{loadingPreview ? 'Calculating...' : `${formatMoney(patientDue)}`}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payment" className="space-y-4">
            <div>
              <Label>Payment Method</Label>
              <PaymentMethodsSelect 
                value={paymentMethod} 
                onChange={setPaymentMethod}
              />
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
                placeholder="0"
              />
            </div>
            <div>
              <Label>Paid By</Label>
              <Input
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="Payer full name"
              />
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
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional payment notes"
              />
            </div>
            {paymentMethod === 'MOBILE_MONEY' && momoTransaction ? (
              <div className={`rounded-lg border p-4 ${
                momoTransaction.status === 'SUCCESSFUL'
                  ? 'border-emerald-200 bg-emerald-50'
                  : momoTransaction.status === 'FAILED' || momoTransaction.status === 'EXPIRED'
                    ? 'border-rose-200 bg-rose-50'
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
                  <p className="mt-2 text-xs text-rose-700">{momoTransaction.failureReason}</p>
                ) : momoTransaction.status === 'PENDING' ? (
                  <p className="mt-2 text-xs text-blue-700">
                    Waiting for the patient to approve the Mobile Money prompt on their phone.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCreateDraft} 
                disabled={creatingInvoice || !!createdInvoiceId}
              >
                <Save className="h-4 w-4 mr-2" />
                {creatingInvoice ? 'Creating...' : createdInvoiceId ? 'Invoice Created' : 'Generate Invoice'}
              </Button>
              <Button
                onClick={handlePay}
                disabled={paymentProcessing || creatingMobileMoneyPayment || momoTransaction?.status === 'PENDING' || !createdInvoiceId}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {paymentProcessing
                  ? 'Processing...'
                  : creatingMobileMoneyPayment
                    ? 'Sending MoMo Request...'
                    : paymentMethod === 'MOBILE_MONEY'
                      ? (momoTransaction?.status === 'PENDING' ? 'Waiting for Approval...' : 'Send MoMo Prompt')
                      : 'Process Payment'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
