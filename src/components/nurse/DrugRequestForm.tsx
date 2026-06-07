'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, Pill, User, FileText, CheckCircle, XCircle } from 'lucide-react'
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

import { PatientSearchCombobox } from '@/components/billing/PatientSearchCombobox'
import { MedicationSearchCombobox } from '@/components/pharmacy/MedicationSearchCombobox'
import { useCreateDrugRequest } from '@/hooks/useDrugRequests'
import { useRole } from '@/hooks/useRole'
import { maskIdentifier, maskPhoneNumber } from '@/lib/utils/masking'

import type { Patient } from '@/types/patient'
import type { Medication, DrugRequestItem } from '@/types/pharmacy'

interface RequestItem {
  id: string
  medication: Medication
  quantity: number
  notes: string
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
 * DrugRequestForm - A form for nurses to submit drug requests to pharmacy
 *
 * Features:
 * - Patient selection via search combobox
 * - Medication selection with quantity and notes
 * - Permission check for CAN_REQUEST_DRUGS
 *
 * Integration: Add to nurse dashboard or patient detail page
 */
export function DrugRequestForm() {
  const { hasPermission, isLoading: roleLoading } = useRole()
  const { mutateAsync: createDrugRequest, isPending: creatingRequest } = useCreateDrugRequest()

  const [patient, setPatient] = useState<Patient>(defaultPatient)
  const [items, setItems] = useState<RequestItem[]>([])
  const [notes, setNotes] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const getPatientDisplayName = (p: Patient) => {
    const fullName = p.fullName?.trim()
    const firstName = (p as unknown as { firstName?: string }).firstName?.trim()
    const lastName = (p as unknown as { lastName?: string }).lastName?.trim()

    if (fullName) return fullName
    if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ')
    return 'Unknown patient'
  }

  const getPatientInsuranceProvider = (p: Patient) => {
    const insurance = p.insurance as unknown

    if (insurance && typeof insurance === 'object' && 'provider' in (insurance as Record<string, unknown>)) {
      const provider = (insurance as { provider?: string }).provider
      if (typeof provider === 'string' && provider.trim()) {
        return provider
      }
    }

    return 'CASH'
  }

  const getPatientAllergies = (p: Patient): string[] => {
    const allergies = (p as unknown as { allergies?: unknown }).allergies

    if (Array.isArray(allergies)) {
      return allergies.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }

    if (typeof allergies === 'string' && allergies.trim()) {
      return allergies
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return []
  }

  // Check permission
  const canRequestDrugs = useMemo(() => {
    if (roleLoading) return false
    return hasPermission('CAN_REQUEST_DRUGS') || hasPermission('drug_request:create')
  }, [hasPermission, roleLoading])

  // Add a medication item
  const addItem = (medication: Medication) => {
    // Check if already added
    const existingIndex = items.findIndex((item) => item.medication.id === medication.id)
    if (existingIndex >= 0) {
      // Increment quantity if already exists
      const updated = [...items]
      updated[existingIndex].quantity += 1
      setItems(updated)
      toast.success(`Updated quantity for ${medication.brandName}`)
      return
    }

    const newItem: RequestItem = {
      id: `${medication.id}-${Date.now()}`,
      medication,
      quantity: 1,
      notes: '',
    }
    setItems([...items, newItem])
    toast.success(`Added ${medication.brandName}`)
  }

  // Update item quantity
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    const updated = [...items]
    updated[index].quantity = quantity
    setItems(updated)
  }

  // Update item notes
  const updateNotes = (index: number, notes: string) => {
    const updated = [...items]
    updated[index].notes = notes
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
    setItems([])
    setNotes('')
    setSuccessMessage(null)
  }

  // Submit the drug request
  const handleSubmit = async () => {
    if (!patient.id) {
      toast.error('Please select a patient first')
      return
    }

    if (items.length === 0) {
      toast.error('Please add at least one medication')
      return
    }

    try {
      const requestItems: DrugRequestItem[] = items.map((item) => ({
        drugId: item.medication.id,
        drugName: item.medication.brandName,
        quantity: item.quantity,
        notes: item.notes || undefined,
      }))

      const patientDisplayName = getPatientDisplayName(patient)

      await createDrugRequest({
        patientId: patient.id,
        patientName: patientDisplayName,
        items: requestItems,
        notes: notes || undefined,
      })

      setSuccessMessage(`Drug request submitted successfully for ${patientDisplayName}!`)
      toast.success('Drug request submitted to pharmacy')
      resetForm()
    } catch (error) {
      console.error('Failed to submit drug request:', error)
      toast.error('Failed to submit drug request. Please try again.')
    }
  }

  if (!roleLoading && !canRequestDrugs) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drug requests unavailable</h3>
            <p className="text-muted-foreground">
              This workspace does not include medication request creation for your current role.
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
            <Pill className="h-6 w-6" />
            Drug Request
          </h2>
          <p className="text-muted-foreground">
            Submit drug requests to pharmacy for patients
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
                  The pharmacy team will review and fulfill this request.
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
            {patient.id && (
              <div className="space-y-2">
                <Label>Patient Details</Label>
                <div className="p-3 bg-muted rounded-md space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getPatientDisplayName(patient)}</span>
                    <Badge variant="outline">{getPatientInsuranceProvider(patient)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ID: {maskIdentifier(patient.nationalId) || patient.nationalId || 'N/A'} | Phone: {maskPhoneNumber(patient.phone) || patient.phone || (patient as unknown as { phoneNumber?: string }).phoneNumber || 'N/A'}
                  </p>
                  {getPatientAllergies(patient).length > 0 && (
                    <p className="text-sm text-amber-600 font-medium">
                      ⚠️ Allergies: {getPatientAllergies(patient).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medication Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medications
            </span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearItems}>
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Medication Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <MedicationSearchCombobox
              value=""
              onSelect={addItem}
              placeholder="Search medication to add..."
            />
            <p className="text-xs text-muted-foreground self-center">
              Search and add medications. Quantity can be adjusted in the table below.
            </p>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No medications added yet.</p>
              <p className="text-sm">Use the search above to add medications.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Strength/Form</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.medication.brandName}
                      <div className="text-xs text-muted-foreground">
                        {item.medication.genericName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.medication.strength} | {item.medication.form}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional notes..."
                        value={item.notes}
                        onChange={(e) => updateNotes(index, e.target.value)}
                        className="w-full"
                      />
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
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Notes (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional instructions or notes for the pharmacy..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!patient.id || items.length === 0 || creatingRequest || !!successMessage}
          className="min-w-[200px]"
        >
          {creatingRequest ? (
            <>Submitting Request...</>
          ) : successMessage ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Request Submitted
            </>
          ) : (
            <>
              <Pill className="h-4 w-4 mr-2" />
              Submit Drug Request
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      {!patient.id && items.length === 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">How to submit a drug request:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Search and select a patient using the patient search box</li>
              <li>Search and add medications from the pharmacy inventory</li>
              <li>Adjust quantities as needed for each medication</li>
              <li>Add optional notes for specific instructions</li>
              <li>Click Submit Drug Request to send to pharmacy</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DrugRequestForm
