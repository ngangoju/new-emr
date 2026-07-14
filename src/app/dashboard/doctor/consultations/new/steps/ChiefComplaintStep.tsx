'use client'

import { Textarea } from '@/components/ui/textarea'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { UseFormReturn } from 'react-hook-form'
import type { ConsultationInput } from '@/lib/validations/consultation'

interface ChiefComplaintStepProps {
  form: UseFormReturn<ConsultationInput>
}

export function ChiefComplaintStep({ form }: ChiefComplaintStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="chiefComplaint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Chief Complaint *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What brings the patient in today?"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="history"
        render={({ field }) => (
          <FormItem>
            <FormLabel>History of Present Illness</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Detailed history, onset, duration, severity..."
                rows={6}
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
