'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardPlus, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

import { DoctorSelector } from '@/components/shared/DoctorSelector'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateConsultation } from '@/hooks/api/useConsultations'
import { usePatient, usePatientVitals } from '@/hooks/api/usePatients'

import type { Patient } from '@/hooks/api/usePatients'

const defaultPatient: Patient = {
  id: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
}

type LatestVitalsSnapshot = {
  recordedAt?: string
  bloodPressure?: string
  heartRate?: number | string
  temperature?: number | string
  respiratoryRate?: number | string
  oxygenSaturation?: number | string
  painScore?: number | string
  triageDisposition?: string
  triageNote?: string
}

interface NurseConsultationAssignmentFormProps {
  initialPatientId?: string
}

function formatLatestVitalsSummary(vitals: LatestVitalsSnapshot | null) {
  if (!vitals) return null

  const entries = [
    vitals.temperature ? `Temp ${vitals.temperature} C` : null,
    vitals.bloodPressure ? `BP ${vitals.bloodPressure}` : null,
    vitals.heartRate ? `HR ${vitals.heartRate}` : null,
    vitals.respiratoryRate ? `RR ${vitals.respiratoryRate}` : null,
    vitals.oxygenSaturation ? `SpO2 ${vitals.oxygenSaturation}%` : null,
    vitals.painScore ? `Pain ${vitals.painScore}/10` : null,
    vitals.triageDisposition ? `Disposition ${vitals.triageDisposition}` : null,
  ].filter(Boolean)

  return entries.length > 0 ? entries.join(' | ') : null
}

export function NurseConsultationAssignmentForm({
  initialPatientId = '',
}: NurseConsultationAssignmentFormProps) {
  const [patient, setPatient] = useState<Patient>(defaultPatient)
  const [doctorId, setDoctorId] = useState('')
  const [handoffSummary, setHandoffSummary] = useState('')
  const [nurseNote, setNurseNote] = useState('')

  const { mutateAsync: createConsultation, isPending } = useCreateConsultation()
  const { data: initialPatient } = usePatient(initialPatientId)
  const vitalsPatientId = patient.id || initialPatientId
  const { data: vitalsData } = usePatientVitals(vitalsPatientId)

  useEffect(() => {
    if (initialPatient?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatient(initialPatient)
    }
  }, [initialPatient])

  const latestVitals = useMemo<LatestVitalsSnapshot | null>(() => {
    if (!Array.isArray(vitalsData) || vitalsData.length === 0) {
      return null
    }

    const [latest] = vitalsData
    if (!latest || typeof latest !== 'object') {
      return null
    }

    return latest as LatestVitalsSnapshot
  }, [vitalsData])

  const latestVitalsSummary = useMemo(
    () => formatLatestVitalsSummary(latestVitals),
    [latestVitals],
  )

  const latestVitalsRecordedAt = latestVitals?.recordedAt
    ? new Date(latestVitals.recordedAt).toLocaleString()
    : null

  const handleSubmit = async () => {
    if (!patient.id) {
      toast.error('Please select a patient before assigning a consultation.')
      return
    }

    if (!doctorId) {
      toast.error('Please select a doctor for the handoff.')
      return
    }

    const summary = handoffSummary.trim()
    if (!summary) {
      toast.error('Please add a triage summary for the doctor.')
      return
    }

    const notes = [
      'Nurse handoff created from dashboard.',
      `Triage summary: ${summary}`,
      nurseNote.trim() ? `Nurse note: ${nurseNote.trim()}` : null,
      latestVitalsSummary ? `Latest vitals: ${latestVitalsSummary}` : null,
      latestVitals?.triageNote ? `Latest triage note: ${latestVitals.triageNote}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await createConsultation({
        patientId: patient.id,
        doctorId,
        findings: summary,
        notes,
      })

      toast.success('Consultation handoff sent to doctor.')
      setDoctorId('')
      setHandoffSummary('')
      setNurseNote('')
    } catch (error) {
      console.error('Failed to assign consultation', error)
      toast.error('Failed to send consultation handoff.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardPlus className="h-5 w-5" />
          Consultation Handoff
        </CardTitle>
        <CardDescription>
          Open a draft consultation and assign the patient to the next doctor with triage context.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Patient</Label>
            <PatientSelector
              selectedPatientId={patient.id}
              selectedPatient={patient.id ? patient : null}
              onSelect={(selectedPatient) => setPatient(selectedPatient)}
            />
          </div>
          <div className="space-y-2">
            <Label>Assign Doctor</Label>
            <DoctorSelector
              value={doctorId}
              onValueChange={setDoctorId}
              placeholder="Select doctor for consultation"
            />
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Latest vitals snapshot</p>
              <p>{latestVitalsSummary || 'No recent vitals found for this patient yet.'}</p>
              {latestVitalsRecordedAt && (
                <p className="text-xs">Recorded {latestVitalsRecordedAt}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="handoff-summary">Triage Summary</Label>
          <Textarea
            id="handoff-summary"
            value={handoffSummary}
            onChange={(event) => setHandoffSummary(event.target.value)}
            placeholder="Summarize the presenting issue, urgency, and what the doctor should review first."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nurse-note">Additional Nurse Note</Label>
          <Textarea
            id="nurse-note"
            value={nurseNote}
            onChange={(event) => setNurseNote(event.target.value)}
            placeholder="Optional handoff detail, follow-up instruction, or concern."
          />
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Sending...' : 'Assign Consultation'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
