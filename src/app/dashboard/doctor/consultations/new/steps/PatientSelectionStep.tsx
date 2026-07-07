'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { UseFormReturn } from 'react-hook-form'
import type { ConsultationInput } from '@/lib/validations/consultation'
import type { Patient } from '@/hooks/api/usePatients'

interface PatientSelectionStepProps {
  form: UseFormReturn<ConsultationInput>
  patientSearch: string
  onPatientSearchChange: (value: string) => void
  editable: boolean
  lockedFromUrl: boolean
  isSearching: boolean
  patients: Patient[]
  isLoadingPatient: boolean
  selectedPatient: Patient | undefined
}

export function PatientSelectionStep({
  form,
  patientSearch,
  onPatientSearchChange,
  editable,
  lockedFromUrl,
  isSearching,
  patients,
  isLoadingPatient,
  selectedPatient,
}: PatientSelectionStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="patientId"
        render={({ field }) => (
          <FormItem className="space-y-4" id="patient-search-item">
            <FormLabel>Search Patient *</FormLabel>
            <div className="relative">
              <Input
                placeholder="Search by name, ID or phone..."
                value={patientSearch}
                onChange={(e) => onPatientSearchChange(e.target.value)}
                disabled={!editable || lockedFromUrl}
              />
              {patientSearch && !field.value && (
                <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-auto">
                  {isSearching ? (
                    <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                  ) : patients.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No patients found</div>
                  ) : (
                    patients.map((patient: Patient) => (
                      <div
                        key={patient.id}
                        className="p-2 hover:bg-accent cursor-pointer text-sm"
                        onClick={() => {
                          field.onChange(patient.id)
                          onPatientSearchChange(`${patient.firstName} ${patient.lastName}`)
                        }}
                      >
                        <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                        <div className="text-xs text-muted-foreground">
                          {patient.gender} • {patient.phone}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <FormMessage />

            {field.value && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  {isLoadingPatient ? (
                    <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
                      Loading patient details...
                    </div>
                  ) : selectedPatient ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Phone:</span>
                          <p className="font-medium">{selectedPatient.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gender:</span>
                          <p className="font-medium capitalize">{selectedPatient.gender?.toLowerCase() || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ID:</span>
                          <p className="font-medium text-xs font-mono">{selectedPatient.id}</p>
                        </div>
                      </div>
                      {!lockedFromUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-4 text-destructive hover:text-destructive"
                          onClick={() => {
                            field.onChange('')
                            onPatientSearchChange('')
                          }}
                          type="button"
                        >
                          Change Patient
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="p-4 text-center text-sm text-destructive">
                      Failed to load patient information. Please try re-selecting.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </FormItem>
        )}
      />
    </div>
  )
}
