'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { UseFormReturn } from 'react-hook-form'
import type { ConsultationInput } from '@/lib/validations/consultation'
import type { LatestVitals } from './types'

interface VitalsExaminationStepProps {
  form: UseFormReturn<ConsultationInput>
  latestVitalsLoading: boolean
  latestVitals: LatestVitals | undefined
  bmi: string
}

export function VitalsExaminationStep({
  form,
  latestVitalsLoading,
  latestVitals,
  bmi,
}: VitalsExaminationStepProps) {
  return (
    <div className="space-y-4">
      {latestVitalsLoading ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Loading latest vitals...
        </div>
      ) : latestVitals ? (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Latest nurse-recorded vitals</h3>
            <Badge variant="secondary">Read only</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Vitals recorded at {new Date(latestVitals.recordedAt).toLocaleString()}
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <Label className="text-muted-foreground">Temperature</Label>
              <p className="font-medium">{latestVitals.temperature ?? '-'} °C</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Blood Pressure</Label>
              <p className="font-medium">{latestVitals.bloodPressure || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Heart Rate</Label>
              <p className="font-medium">{latestVitals.heartRate ?? '-'} bpm</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Respiratory Rate</Label>
              <p className="font-medium">{latestVitals.respiratoryRate ?? '-'} /min</p>
            </div>
            <div>
              <Label className="text-muted-foreground">SpO2</Label>
              <p className="font-medium">{latestVitals.oxygenSaturation ?? '-'} %</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Pain Score</Label>
              <p className="font-medium">{latestVitals.painScore ?? '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Weight</Label>
              <p className="font-medium">{latestVitals.weight ?? '-'} kg</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Height</Label>
              <p className="font-medium">{latestVitals.height ?? '-'} cm</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          No vitals recorded yet
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="vitals.temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature (°C)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="36.5" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vitals.bloodPressure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Pressure (mmHg)</FormLabel>
              <FormControl>
                <Input placeholder="120/80" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vitals.heartRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heart Rate (bpm)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="72" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vitals.weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="70.5" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vitals.height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height (cm)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="175" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>BMI</Label>
          <Input disabled value={bmi} />
        </div>
      </div>

      <FormField
        control={form.control}
        name="examination"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Physical Examination Findings</FormLabel>
            <FormControl>
              <Textarea
                placeholder="General appearance, systems review..."
                rows={5}
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
