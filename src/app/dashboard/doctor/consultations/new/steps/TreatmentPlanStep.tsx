'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pill } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { UseFormReturn } from 'react-hook-form'
import type { ConsultationInput } from '@/lib/validations/consultation'
import { StructuredMedicationEntry } from '@/components/clinical/StructuredMedicationEntry'
import { PrescriptionList, type PrescriptionListMedication } from '@/components/clinical/PrescriptionList'
import type { AddMedicationPayload } from '@/hooks/api/useConsultations'
import { LAB_TEST_OPTIONS } from './constants'
import type { StructuredMed } from './types'

interface TreatmentPlanStepProps {
  form: UseFormReturn<ConsultationInput>
  onAddMedication: (med: AddMedicationPayload & { drugName: string }) => void
  isAddingMedication: boolean
  structuredMeds: StructuredMed[]
  onRemoveMedication: (id: string) => void
  selectedLabTests: string[]
  onToggleLabTest: (testName: string) => void
}

export function TreatmentPlanStep({
  form,
  onAddMedication,
  isAddingMedication,
  structuredMeds,
  onRemoveMedication,
  selectedLabTests,
  onToggleLabTest,
}: TreatmentPlanStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Label className="text-base font-bold flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Structured Prescriptions (Item 1 & 2)
        </Label>

        <StructuredMedicationEntry
          onAdd={onAddMedication}
          isLoading={isAddingMedication}
        />

        <div className="space-y-2 mt-4">
          <Label className="text-sm font-medium">Added Medications</Label>
          <PrescriptionList
            medications={structuredMeds as PrescriptionListMedication[]}
            onRemove={onRemoveMedication}
          />
        </div>

        <FormField
          control={form.control}
          name="medications"
          render={({ field }) => (
            <FormItem className="mt-6 opacity-60">
              <FormLabel>Legacy Prescription Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any non-drug treatment notes or general advice..."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="labTests"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lab Tests Ordered</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any lab tests or imaging required..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <Label>Doctor Lab Request Selection</Label>
        <p className="text-sm text-muted-foreground">
          Selected tests will be submitted as a lab order when you finalize the consultation.
        </p>
        <div className="flex flex-wrap gap-2">
          {LAB_TEST_OPTIONS.map((testName) => {
            const isSelected = selectedLabTests.includes(testName)
            return (
              <Button
                key={testName}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToggleLabTest(testName)}
              >
                {isSelected ? '✓ ' : ''}
                {testName}
              </Button>
            )
          })}
        </div>
      </div>

      <FormField
        control={form.control}
        name="followUp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Follow-up Instructions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="When to return, what to watch for..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
