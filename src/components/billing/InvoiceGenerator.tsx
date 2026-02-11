'use client'

import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Save, CreditCard } from 'lucide-react'
import { PaymentMethodsSelect } from './PaymentMethodsSelect'
import { TariffSearchCombobox } from './TariffSearchCombobox'
import { mockTariffs } from '@/lib/mock/tariffs'
import type { Tariff } from '@/types/billing'
import type { PaymentMethod } from '@/types/billing'
import { useCreatePayment } from '@/hooks/usePayments'

interface InvoiceItem {
  tariffId: string
  tariff: Tariff
  quantity: number
  unitPrice: number
  total: number
}

// TODO: Replace with actual patient data from API
const defaultPatient = {
  id: 'temp',
  fullName: 'Select Patient',
  insurance: {
    copayPercentage: 20
  }
}

export function InvoiceGenerator({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'patient' | 'services' | 'summary' | 'payment'>('services')
  const [patient] = useState(defaultPatient)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const { createPayment } = useCreatePayment()

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const copayPercentage = patient.insurance.copayPercentage
  const insuranceDue = subtotal * (copayPercentage / 100)
  const patientDue = subtotal - insuranceDue - discount
  const total = subtotal - discount

  const addItem = () => {
    // Stub: add selected tariff
    const newItem: InvoiceItem = {
      tariffId: '',
      tariff: mockTariffs[0],
      quantity: 1,
      unitPrice: mockTariffs[0].price,
      total: mockTariffs[0].price,
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

  const handleSubmit = () => {
    // Mock generate invoice
    alert('Invoice generated! (mock)\nPatient Due: RWF ' + patientDue.toLocaleString())
    setOpen(false)
    // Reset form
  }

  const handlePay = () => {
    createPayment({
      invoiceId: 'NEW-INV',
      method: paymentMethod,
      amount: paymentAmount,
    })
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
        <Tabs defaultValue="services" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patient">Patient</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          <TabsContent value="patient" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient</Label>
                <p className="text-sm text-muted-foreground mt-2">
                  TODO: Integrate with patient search API
                </p>
              </div>
              <div>
                <Label>Insurance Copay</Label>
                <Input value={`${patient.insurance.copayPercentage}%`} readOnly />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="services" className="space-y-4">
            <div className="flex gap-2">
              <TariffSearchCombobox 
                value=""
                onSelect={(id) => addItem()} 
              />
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />
              </Button>
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
                    <TableCell>{item.tariff.name}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>RWF {item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>RWF {item.total.toLocaleString()}</TableCell>
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
                  <span>RWF {subtotal.toLocaleString()}</span>
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
                <div className="flex justify-between text-warning">
                  <span>Insurance ({copayPercentage}%):</span>
                  <span>RWF {insuranceDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-3 font-bold">
                  <span>Patient Due:</span>
                  <span>RWF {patientDue.toLocaleString()}</span>
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
            <div>
              <Label>Amount (RWF)</Label>
              <Input 
                type="number" 
                value={paymentAmount} 
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
              <Button onClick={handlePay}>
                <CreditCard className="h-4 w-4 mr-2" />
                Process Payment
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