'use client'

import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Patient } from '@/hooks/api/usePatients'

interface ReviewStepProps {
  selectedPatient: Patient | undefined
  chiefComplaint?: string
  diagnosis?: string
  medications?: string
  temperature: string | number
  bloodPressure: string | number
  heartRate: string | number
  createdConsultation: { id: string; status: string } | null
}

export function ReviewStep({
  selectedPatient,
  chiefComplaint,
  diagnosis,
  medications,
  temperature,
  bloodPressure,
  heartRate,
  createdConsultation,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
        <h3 className="font-semibold text-lg">Consultation Summary</h3>

        <div className="grid gap-4">
          <div>
            <Label className="text-muted-foreground">Patient:</Label>
            <p className="font-medium">
              {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Not selected'}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Chief Complaint:</Label>
            <p>{chiefComplaint || 'Not recorded'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Vitals:</Label>
            <p>
              Temp: {temperature}°C,
              BP: {bloodPressure},
              HR: {heartRate} bpm
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Diagnosis:</Label>
            <p>{diagnosis || 'Not recorded'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Treatment:</Label>
            <p>{medications || 'No medications prescribed'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-warning/50 bg-warning/5 p-4">
        <p className="text-sm text-foreground">
          ⚠️ Please review all information carefully before submitting. This consultation will be permanently recorded in the patient&apos;s medical history.
        </p>
      </div>

      {createdConsultation && (
        <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Consultation Status</p>
            <Badge variant={createdConsultation.status === 'SIGNED' ? 'default' : 'secondary'}>
              {createdConsultation.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">ID: {createdConsultation.id}</p>
          {createdConsultation.status === 'SIGNED' ? (
            <p className="text-sm text-success">Consultation is finalized and signed.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Consultation created in pending state. Finalize and sign to complete workflow.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
