'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ClipboardCheck, Download, FilePlus2, Printer, UserRoundSearch } from 'lucide-react'

import { PatientSelector } from '@/components/shared/PatientSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { WorkflowStatusCard } from '@/components/workflow/WorkflowStatusCard'
import {
  useGeneratedAfterVisitSummary,
  usePatientIntake,
  usePrintableAfterVisitDocument,
  useUpsertPatientIntake,
  useWorkflowStatus,
} from '@/hooks/useWorkflow'
import type { AfterVisitMedicationItem, IntakeDocumentMetadata } from '@/types/workflow'

const EMPTY_DOCUMENT: IntakeDocumentMetadata = { type: '', name: '', notes: '' }

export function ReceptionIntakeWorkspace() {
  const [patientId, setPatientId] = useState('')
  const { data: intake } = usePatientIntake(patientId)
  const { data: workflowStatus } = useWorkflowStatus(patientId)
  const upsertIntake = useUpsertPatientIntake(patientId)
  const activeAdmissionId = workflowStatus?.activeAdmissionId || ''
  const { data: generatedPacket, isLoading: generatedPacketLoading } = useGeneratedAfterVisitSummary(activeAdmissionId)
  const { data: receptionPacketDocument } = usePrintableAfterVisitDocument(activeAdmissionId)

  const [eligibilityStatus, setEligibilityStatus] = useState('PENDING')
  const [eligibilityNotes, setEligibilityNotes] = useState('')
  const [notes, setNotes] = useState('')
  const [summary, setSummary] = useState('')
  const [instructions, setInstructions] = useState('')
  const [followUpPlan, setFollowUpPlan] = useState('')
  const [followUpAppointmentId, setFollowUpAppointmentId] = useState('')
  const [packetGeneratedAt, setPacketGeneratedAt] = useState('')
  const [packetSourceAdmissionId, setPacketSourceAdmissionId] = useState('')
  const [packetHandoffSummary, setPacketHandoffSummary] = useState('')
  const [medicationsToContinue, setMedicationsToContinue] = useState<AfterVisitMedicationItem[]>([])
  const [medicationsToStop, setMedicationsToStop] = useState<AfterVisitMedicationItem[]>([])
  const [documents, setDocuments] = useState<IntakeDocumentMetadata[]>([{ ...EMPTY_DOCUMENT }])
  const printableAdmissionId = packetSourceAdmissionId || activeAdmissionId

  useEffect(() => {
    if (patientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEligibilityStatus('PENDING')
      setEligibilityNotes('')
      setNotes('')
      setSummary('')
      setInstructions('')
      setFollowUpPlan('')
      setFollowUpAppointmentId('')
      setPacketGeneratedAt('')
      setPacketSourceAdmissionId('')
      setPacketHandoffSummary('')
      setMedicationsToContinue([])
      setMedicationsToStop([])
      setDocuments([{ ...EMPTY_DOCUMENT }])
      return
    }

    setEligibilityStatus('PENDING')
    setEligibilityNotes('')
    setNotes('')
    setSummary('')
    setInstructions('')
    setFollowUpPlan('')
    setFollowUpAppointmentId('')
    setPacketGeneratedAt('')
    setPacketSourceAdmissionId('')
    setPacketHandoffSummary('')
    setMedicationsToContinue([])
    setMedicationsToStop([])
    setDocuments([{ ...EMPTY_DOCUMENT }])
  }, [patientId])

  useEffect(() => {
    if (!intake) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEligibilityStatus(intake.eligibilityStatus || 'PENDING')
    setEligibilityNotes(intake.eligibilityNotes || '')
    setNotes(intake.notes || '')
    setSummary(intake.afterVisitSummary?.summary || '')
    setInstructions(intake.afterVisitSummary?.instructions || '')
    setFollowUpPlan(intake.afterVisitSummary?.followUpPlan || '')
    setFollowUpAppointmentId(intake.followUpAppointmentId || '')
    setPacketGeneratedAt(intake.afterVisitSummary?.generatedAt || '')
    setPacketSourceAdmissionId(intake.afterVisitSummary?.sourceAdmissionId || '')
    setPacketHandoffSummary(intake.afterVisitSummary?.handoffSummary || '')
    setMedicationsToContinue(intake.afterVisitSummary?.medicationsToContinue || [])
    setMedicationsToStop(intake.afterVisitSummary?.medicationsToStop || [])
    setDocuments(intake.intakeDocuments?.length ? intake.intakeDocuments : [{ ...EMPTY_DOCUMENT }])
  }, [intake])

  const importGeneratedPacket = () => {
    if (!generatedPacket) {
      toast.error('No clinical discharge packet is ready yet.')
      return
    }

    setSummary(generatedPacket.summary || '')
    setInstructions(generatedPacket.instructions || '')
    setFollowUpPlan(generatedPacket.followUpPlan || '')
    setFollowUpAppointmentId(generatedPacket.followUpAppointmentId || '')
    setPacketGeneratedAt(generatedPacket.generatedAt || '')
    setPacketSourceAdmissionId(generatedPacket.admissionId || '')
    setPacketHandoffSummary(generatedPacket.handoffSummary || '')
    setMedicationsToContinue(generatedPacket.medicationsToContinue || [])
    setMedicationsToStop(generatedPacket.medicationsToStop || [])
    toast.success('Clinical discharge packet imported into checkout AVS.')
  }

  const updateDocument = (index: number, patch: Partial<IntakeDocumentMetadata>) => {
    setDocuments((current) => current.map((document, currentIndex) =>
      currentIndex === index ? { ...document, ...patch } : document,
    ))
  }

  const addDocument = () => setDocuments((current) => [...current, { ...EMPTY_DOCUMENT }])

  const saveIntake = async (mode: 'save' | 'check-in' | 'check-out') => {
    if (!patientId) {
      toast.error('Select a patient first.')
      return
    }

    const cleanedDocuments = documents
      .map((document) => ({
        type: document.type.trim(),
        name: document.name.trim(),
        notes: document.notes?.trim() || '',
      }))
      .filter((document) => document.type || document.name || document.notes)

    try {
      await upsertIntake.mutateAsync({
        intakeStatus: mode === 'check-out' ? 'CHECKED_OUT' : mode === 'check-in' ? 'CHECKED_IN' : intake?.intakeStatus || 'CHECKED_IN',
        eligibilityStatus,
        eligibilityNotes,
        intakeDocuments: cleanedDocuments,
        checkedInAt: mode === 'check-in' ? new Date().toISOString() : intake?.checkedInAt || undefined,
        checkedOutAt: mode === 'check-out' ? new Date().toISOString() : undefined,
        followUpAppointmentId: followUpAppointmentId || undefined,
        afterVisitSummary: {
          summary,
          instructions,
          followUpPlan,
          handoffSummary: packetHandoffSummary || undefined,
          sourceAdmissionId: packetSourceAdmissionId || undefined,
          generatedAt: packetGeneratedAt || undefined,
          medicationsToContinue,
          medicationsToStop,
        },
        notes,
      })
      toast.success(mode === 'check-out' ? 'Checkout and AVS recorded.' : mode === 'check-in' ? 'Patient checked in.' : 'Intake saved.')
    } catch {
      toast.error('Failed to save intake workflow.')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Intake Workspace
          </CardTitle>
          <CardDescription>
            Capture registration, eligibility, intake documents, and checkout/AVS details from one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Patient</Label>
            <PatientSelector
              selectedPatientId={patientId}
              onSelect={(patient) => setPatientId(patient.id)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Eligibility Status</Label>
              <Select value={eligibilityStatus} onValueChange={setEligibilityStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select eligibility status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                  <SelectItem value="SELF_PAY">Self Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Eligibility Notes</Label>
              <Input
                value={eligibilityNotes}
                onChange={(event) => setEligibilityNotes(event.target.value)}
                placeholder="Coverage notes, payer response, exceptions..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Intake Document Metadata</Label>
              <Button type="button" size="sm" variant="outline" onClick={addDocument}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </div>
            <div className="space-y-3">
              {documents.map((document, index) => (
                <div key={`${index}-${document.type}-${document.name}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-3">
                  <Input
                    value={document.type}
                    onChange={(event) => updateDocument(index, { type: event.target.value })}
                    placeholder="Document type"
                  />
                  <Input
                    value={document.name}
                    onChange={(event) => updateDocument(index, { name: event.target.value })}
                    placeholder="Document name"
                  />
                  <Input
                    value={document.notes || ''}
                    onChange={(event) => updateDocument(index, { notes: event.target.value })}
                    placeholder="Notes"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>After-Visit Summary</Label>
              <Textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Short summary to print or hand off at checkout"
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions</Label>
              <Textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Patient-facing instructions and reminders"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Follow-up Plan</Label>
              <Input
                value={followUpPlan}
                onChange={(event) => setFollowUpPlan(event.target.value)}
                placeholder="e.g. Follow up in 2 weeks with internal medicine"
              />
            </div>
            <div className="space-y-2">
              <Label>Front Desk Notes</Label>
              <Input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Appointment prep, special instructions, transport notes..."
              />
            </div>
          </div>

          {activeAdmissionId ? (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Clinical Discharge Packet</p>
                  <p className="text-sm text-slate-600">
                    Pull the doctor and nursing discharge content into checkout so the printed AVS matches the structured chart.
                  </p>
                  {packetGeneratedAt ? (
                    <p className="text-xs text-slate-500">
                      Current AVS source updated {new Date(packetGeneratedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={importGeneratedPacket}
                  disabled={!generatedPacket || generatedPacketLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {packetSourceAdmissionId === activeAdmissionId ? 'Refresh From Clinical Packet' : 'Import Clinical Packet'}
                </Button>
              </div>

              {receptionPacketDocument ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Packet Status</span>
                  {receptionPacketDocument.lastExportedVersion ? (
                    receptionPacketDocument.reissueRequired ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-semibold">
                        Reissue pending — changed since v{receptionPacketDocument.lastExportedVersion}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold">
                        Export v{receptionPacketDocument.lastExportedVersion} is current
                      </span>
                    )
                  ) : receptionPacketDocument.documentVersion ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[11px] font-semibold">
                      Draft ready — no export yet
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-semibold">
                      No packet generated
                    </span>
                  )}
                  {intake?.intakeStatus === 'CHECKED_OUT' ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold">
                      Checkout complete
                    </span>
                  ) : intake?.checkedInAt ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-semibold">
                      Checkout pending
                    </span>
                  ) : null}
                </div>
              ) : null}

              {generatedPacket ? (
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-3">
                    <div className="rounded-md border bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Generated Summary</p>
                      <p className="mt-2 text-sm text-slate-700">{generatedPacket.summary}</p>
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Clinical Instructions</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{generatedPacket.instructions}</p>
                    </div>
                    {generatedPacket.handoffSummary ? (
                      <div className="rounded-md border bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Medication Handoff</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{generatedPacket.handoffSummary}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-md border bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Continue At Home</p>
                      <div className="mt-2 space-y-2">
                        {generatedPacket.medicationsToContinue.length ? generatedPacket.medicationsToContinue.map((item) => (
                          <div key={`${item.drugRequestId}-${item.drugRequestItemIndex}`} className="rounded border border-emerald-100 bg-emerald-50 p-2">
                            <p className="text-sm font-medium text-emerald-900">{item.drugName}</p>
                            <p className="text-xs text-emerald-800">
                              {[item.dose, item.route, item.frequency].filter(Boolean).join(' • ') || 'No dose details recorded'}
                            </p>
                          </div>
                        )) : <p className="text-sm text-slate-500">No home medications listed.</p>}
                      </div>
                    </div>

                    <div className="rounded-md border bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stop After Discharge</p>
                      <div className="mt-2 space-y-2">
                        {generatedPacket.medicationsToStop.length ? generatedPacket.medicationsToStop.map((item) => (
                          <div key={`${item.drugRequestId}-${item.drugRequestItemIndex}`} className="rounded border border-rose-100 bg-rose-50 p-2">
                            <p className="text-sm font-medium text-rose-900">{item.drugName}</p>
                            <p className="text-xs text-rose-800">
                              {[item.dose, item.route, item.frequency].filter(Boolean).join(' • ') || 'No dose details recorded'}
                            </p>
                          </div>
                        )) : <p className="text-sm text-slate-500">No stop medications listed.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  The discharge packet will appear here once the admission has structured reconciliation and discharge instructions.
                </p>
              )}
            </div>
          ) : null}

              <div className="flex flex-wrap gap-3">
            <Button onClick={() => saveIntake('save')} disabled={upsertIntake.isPending || !patientId}>
              <UserRoundSearch className="mr-2 h-4 w-4" />
              Save Intake
            </Button>
            <Button variant="secondary" onClick={() => saveIntake('check-in')} disabled={upsertIntake.isPending || !patientId}>
              Check In
            </Button>
            <Button variant="outline" onClick={() => saveIntake('check-out')} disabled={upsertIntake.isPending || !patientId}>
              <Printer className="mr-2 h-4 w-4" />
              Checkout + AVS
            </Button>
            {printableAdmissionId ? (
              <Button asChild variant="outline" disabled={!patientId}>
                <Link
                  href={`/dashboard/reception/discharge-packet/${printableAdmissionId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Packet
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <WorkflowStatusCard patientId={patientId} />
    </div>
  )
}
