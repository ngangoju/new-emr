'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Receipt, User, DollarSign, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { PatientSearchCombobox } from '@/components/billing/PatientSearchCombobox'
import { TariffSearchCombobox } from '@/components/billing/TariffSearchCombobox'
import { DoctorSelector } from '@/components/shared/DoctorSelector'
import { useCreateInvoice } from '@/hooks/useInvoices'
import { useRole } from '@/hooks/useRole'
import { maskIdentifier, maskPhoneNumber } from '@/lib/utils/masking'

import type { Patient } from '@/types/patient'
import type { Tariff } from '@/types/billing'

interface BillingItem {
  id: string
  tariff: Tariff
  quantity: number
  unitPrice: number
  total: number
}

const defaultPatient: Patient = {
  id: '',
  fullName: '',
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

/**
 * NurseBilling - A simplified billing interface for nurses to generate patient bills
 * 
 * Features:
 * - Patient selection via search combobox
 * - Multi-tariff selection with quantity editing
 * - Running total calculation
 * - Draft invoice creation (no payment processing - nurses only create bills)
 * - Permission check for CAN_BILL role
 * 
 * Integration: Add to nurse dashboard at /dashboard/doctor/patients or create a new route
 */
export function NurseBilling() {
  const { hasPermission, isLoading: roleLoading } = useRole()
  const { mutateAsync: createInvoice, isPending: creatingInvoice } = useCreateInvoice()

  const [patient, setPatient] = useState<Patient>(defaultPatient)
  const [doctorId, setDoctorId] = useState('')
  const [items, setItems] = useState<BillingItem[]>([])
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check permission
  const canBill = useMemo(() => {
    if (roleLoading) return false
    return hasPermission('CAN_BILL')
  }, [hasPermission, roleLoading])

  // Calculate totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }, [items])

  // Add a tariff item
  const addItem = (tariff: Tariff) => {
    // Check if already added
    const existingIndex = items.findIndex(item => item.tariff.id === tariff.id)
    if (existingIndex >= 0) {
      // Increment quantity if already exists
      const updated = [...items]
      updated[existingIndex].quantity += 1
      updated[existingIndex].total = updated[existingIndex].unitPrice * updated[existingIndex].quantity
      setItems(updated)
      toast.success(`Updated quantity for ${tariff.serviceName}`)
      return
    }

    const newItem: BillingItem = {
      id: `${tariff.id}-${Date.now()}`,
      tariff,
      quantity: 1,
      unitPrice: tariff.basePrice,
      total: tariff.basePrice,
    }
    setItems([...items, newItem])
    toast.success(`Added ${tariff.serviceName}`)
  }

  // Update item quantity
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    const updated = [...items]
    updated[index].quantity = quantity
    updated[index].total = updated[index].unitPrice * quantity
    setItems(updated)
  }

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Clear all items
  const clearItems = () => {
    setItems([])
  }

  // Reset form
  const resetForm = () => {
    setPatient(defaultPatient)
    setDoctorId('')
    setItems([])
    setCreatedInvoiceId(null)
    setSuccessMessage(null)
  }

  // Create draft invoice
  const handleCreateInvoice = async () => {
    if (!patient.id) {
      toast.error('Please select a patient first')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one service/tariff')
      return
    }

    if (!doctorId) {
      toast.error('Please select a doctor for this invoice')
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
          tariffId: item.tariff.id,
        })),
        discount: 0, // Nurses don't handle discounts
      })

      setCreatedInvoiceId(result.id)
      setSuccessMessage(`Invoice #${result.id} created successfully!`)
      toast.success('Draft invoice created successfully')
    } catch (error) {
      console.error('Failed to create invoice:', error)
      toast.error('Failed to create invoice. Please try again.')
    }
  }

  // Show access denied if no permission
  if (!roleLoading && !canBill) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You do not have permission to create bills. 
              Contact your administrator if you need billing access.
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
            <Receipt className="h-6 w-6" />
            Nurse Billing
          </h2>
          <p className="text-muted-foreground">
            Create bills for patients using tariff items
          </p>
        </div>
        {(patient.id || items.length > 0) && (
          <Button variant="outline" onClick={resetForm}>
            Clear Form
          </Button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{successMessage}</p>
                <p className="text-sm text-green-600">
                  The invoice has been created as a draft. Patients can proceed to billing/cashier for payment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <PatientSearchCombobox
                value={patient.id}
                onSelect={(p) => setPatient(p)}
                admittedOnly
              />
            </div>
            <div className="space-y-2">
              <Label>Select Doctor *</Label>
              <DoctorSelector
                value={doctorId}
                onValueChange={setDoctorId}
                placeholder="Select billing doctor"
              />
            </div>
            {patient.id && (
              <div className="space-y-2">
                <Label>Patient Details</Label>
                <div className="p-3 bg-muted rounded-md space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{patient.fullName}</span>
                    <Badge variant="outline">{patient.insurance?.provider || 'CASH'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ID: {maskIdentifier(patient.nationalId) || patient.nationalId || 'N/A'} | Phone: {maskPhoneNumber(patient.phone) || patient.phone || 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tariff Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Services / Tariffs
            </span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearItems}>
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tariff Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <TariffSearchCombobox
              value=""
              onSelect={addItem}
              excludeCategories={['LAB', 'LABORATORY']}
            />
            <p className="text-xs text-muted-foreground self-center">
              Search and add services. Quantity can be adjusted in the table below.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <Badge key={item.id} variant="secondary" className="gap-2 px-3 py-1">
                  {item.tariff.serviceName} x{item.quantity}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(index)}
                    aria-label={`Remove ${item.tariff.serviceName}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No services added yet.</p>
              <p className="text-sm">Use the search above to add tariff items.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.tariff.serviceName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.tariff.category}
                      </Badge>
                    </TableCell>
                    <TableCell>RWF {item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      RWF {item.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Running Total */}
          {items.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-bold">RWF {subtotal.toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Button */}
      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          onClick={handleCreateInvoice}
          disabled={!patient.id || items.length === 0 || creatingInvoice || !!createdInvoiceId}
          className="min-w-[200px]"
        >
          {creatingInvoice ? (
            <>Creating Invoice...</>
          ) : createdInvoiceId ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Invoice Created
            </>
          ) : (
            <>
              <Receipt className="h-4 w-4 mr-2" />
              Create Draft Invoice
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      {!patient.id && items.length === 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">How to create a bill:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Search and select a patient using the patient search box</li>
              <li>Search and add tariff items/services from the service search</li>
              <li>Adjust quantities as needed for each service</li>
              <li>Click &quot;Create Draft Invoice&quot; to generate the invoice</li>
              <li>The patient can then proceed to the cashier for payment</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NurseBilling
