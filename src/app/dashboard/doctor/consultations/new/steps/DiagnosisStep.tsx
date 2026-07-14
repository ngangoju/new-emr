'use client'

import { Textarea } from '@/components/ui/textarea'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { UseFormReturn } from 'react-hook-form'
import type { ConsultationInput } from '@/lib/validations/consultation'

interface DiagnosisStepProps {
  form: UseFormReturn<ConsultationInput>
}

export function DiagnosisStep({ form }: DiagnosisStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="diagnosis"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Diagnosis (ICD-10) *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter diagnosis codes and descriptions..."
                rows={4}
                {...field}
              />
            </FormControl>
            <p className="text-sm text-muted-foreground">
              Pro tip: Use ICD-10 codes for accurate diagnosis recording
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
