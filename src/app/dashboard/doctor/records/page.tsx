'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, CalendarDays, Activity, Microscope } from 'lucide-react'
import { PatientSelector } from '@/components/shared/PatientSelector'
import {
  usePatientHistory,
  type PatientHistoryConsultation,
  type PatientHistoryAppointment,
  type PatientHistoryVital,
  type PatientLabResult,
} from '@/hooks/api/usePatients'
import { formatDateTime } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'

export default function RecordsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const { data: history, isLoading } = usePatientHistory(selectedPatientId)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Medical Records"
        description="View and manage patient medical records"
      />

      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
          <CardDescription>Choose a patient to load complete medical history.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientSelector
            selectedPatientId={selectedPatientId}
            onSelect={(patient) => setSelectedPatientId(patient.id)}
          />
        </CardContent>
      </Card>

      {!selectedPatientId ? (
        <div className="rounded-lg border bg-card p-8">
          <EmptyState
            icon={FileText}
            title="No records selected"
            description="Search for a patient to view their medical records."
          />
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
          Loading patient history...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Consultations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history?.consultations?.length ? history.consultations.map((consultation: PatientHistoryConsultation) => (
                <div key={consultation.id} className="rounded-md border p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Consultation #{String(consultation.id).slice(0, 8)}</p>
                    <Badge variant="secondary">{consultation.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(consultation.createdAt)}</p>
                  {consultation.diagnosis ? <p className="text-sm mt-2">Diagnosis: {consultation.diagnosis}</p> : null}
                </div>
              )) : <p className="text-sm text-muted-foreground">No consultations found.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history?.appointments?.length ? history.appointments.map((appointment: PatientHistoryAppointment) => (
                <div key={appointment.id} className="rounded-md border p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Appointment #{String(appointment.id).slice(0, 8)}</p>
                    <Badge variant="secondary">{appointment.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(appointment.scheduledAt)}</p>
                  {appointment.reason ? <p className="text-sm mt-2">Reason: {appointment.reason}</p> : null}
                </div>
              )) : <p className="text-sm text-muted-foreground">No appointments found.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" /> Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history?.vitals?.length ? history.vitals.map((vital: PatientHistoryVital) => (
                <div key={vital.id} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{formatDateTime(vital.recordedAt)}</p>
                  <div className="text-sm mt-2 space-y-1">
                    <p>BP: {vital.bloodPressure || '-'}</p>
                    <p>HR: {vital.heartRate || '-'} bpm</p>
                    <p>Temp: {vital.temperature || '-'} °C</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No vitals found.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5" /> Lab Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history?.labResults?.length ? history.labResults.map((lab: PatientLabResult) => (
                <div key={lab.orderId} className="rounded-md border p-3">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">Lab #{String(lab.orderId).slice(0, 8)}</p>
                    <Badge variant="secondary">{lab.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{lab.orderedAt ? formatDateTime(lab.orderedAt) : '-'}</p>
                  {lab.tests ? <p className="text-sm mt-2">Tests: {lab.tests}</p> : null}
                </div>
              )) : <p className="text-sm text-muted-foreground">No lab results found.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
