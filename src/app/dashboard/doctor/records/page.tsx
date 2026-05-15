'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { usePatientHistory } from '@/hooks/api/usePatients'
import { formatDateTime } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function RecordsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { data: history, isLoading, isError } = usePatientHistory(selectedPatientId, page, 20)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Medical Records"
        description="View patient medical history as a unified clinical timeline."
      />

      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
          <CardDescription>Choose a patient to load complete medical history.</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientSelector
            selectedPatientId={selectedPatientId}
            onSelect={(patient) => {
              setSelectedPatientId(patient.id)
              setPage(0)
              setExpandedId(null)
            }}
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
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
          Failed to load patient history.
        </div>
      ) : !history?.timeline?.length ? (
        <div className="rounded-lg border bg-card p-8">
          <EmptyState
            icon={FileText}
            title="No history available"
            description="This patient does not have any recorded clinical events yet."
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Patient Timeline</CardTitle>
            <CardDescription>Consultations, labs, vitals, prescriptions, and imaging ordered newest first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.timeline.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline">{entry.type}</Badge>
                    <p className="mt-2 font-medium">{entry.summary}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId((current) => current === entry.id ? null : entry.id)}
                  >
                    View
                  </Button>
                </div>
                {expandedId === entry.id && (
                  <pre className="mt-3 rounded-md bg-muted p-3 text-xs whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setPage((current) => Math.max(current - 1, 0))} disabled={!history.meta?.hasPrevious}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {(history.meta?.page ?? 0) + 1} of {history.meta?.totalPages || 1}
              </p>
              <Button variant="outline" onClick={() => setPage((current) => current + 1)} disabled={!history.meta?.hasNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
