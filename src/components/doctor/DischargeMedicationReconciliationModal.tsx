import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  WorkspaceModalShell,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertCircle,
  ClipboardCheck,
  FileText,
  Loader2,
  Pill,
} from 'lucide-react'
import {
  useAdmissionMedicationReconciliation,
  useAdmissionMedicationSchedule,
  useSaveAdmissionMedicationReconciliation,
} from '@/hooks/useAdmissions'
import { usePrintableAfterVisitDocument, useSimulateAfterVisitDocumentPreview } from '@/hooks/useWorkflow'
import type { MedicationReconciliationDecision } from '@/types/admission'
import type { AfterVisitDocumentPreview } from '@/types/workflow'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const PREVIEW_DEBOUNCE_MS = 800

interface DischargeMedicationReconciliationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admissionId: string
  patientName?: string
}

type MedDecision = MedicationReconciliationDecision | 'UNDECIDED'

function isMedicationPacketChange(label: string) {
  const normalized = label.toLowerCase()
  return normalized.startsWith('continue-at-home') || normalized.startsWith('stop-after-discharge')
}

function classifyPacketChange(previousValue: string, currentValue: string) {
  if (previousValue.trim().toLowerCase() === 'added') {
    return 'added'
  }
  if (currentValue.trim().toLowerCase() === 'removed') {
    return 'removed'
  }
  return 'modified'
}

export function DischargeMedicationReconciliationModal({
  open,
  onOpenChange,
  admissionId,
  patientName
}: DischargeMedicationReconciliationModalProps) {
  const { data: scheduleRaw, isLoading: scheduleLoading } = useAdmissionMedicationSchedule(admissionId)
  const { data: reconciliationData, isLoading: reconciliationLoading } = useAdmissionMedicationReconciliation(admissionId)
  const { data: printableDocument, isLoading: printableDocumentLoading } = usePrintableAfterVisitDocument(admissionId)
  const simulatePreview = useSimulateAfterVisitDocumentPreview(admissionId)
  const [decisions, setDecisions] = useState<Record<string, MedDecision>>({})
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({})
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [serverPreview, setServerPreview] = useState<AfterVisitDocumentPreview | null>(null)
  const [previewStale, setPreviewStale] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveReconciliation = useSaveAdmissionMedicationReconciliation(admissionId)

  const schedule = useMemo(() => {
    return (scheduleRaw || []).filter(item =>
      item.requestStatus === 'fulfilled' || item.requestStatus === 'approved'
    )
  }, [scheduleRaw])

  useEffect(() => {
    if (!open) return

    const initialDecisions: Record<string, MedDecision> = {}
    const initialNotes: Record<string, string> = {}

    schedule.forEach((entry) => {
      const id = `${entry.drugRequestId}-${entry.drugRequestItemIndex}`
      const savedItem = reconciliationData?.items.find((item) =>
        item.drugRequestId === entry.drugRequestId && item.drugRequestItemIndex === entry.drugRequestItemIndex
      )

      initialDecisions[id] = savedItem?.decision || 'UNDECIDED'
      initialNotes[id] = savedItem?.decisionNote || ''
    })

    setDecisions(initialDecisions)
    setDecisionNotes(initialNotes)
    setAdditionalInstructions(reconciliationData?.additionalInstructions || '')
  }, [open, schedule, reconciliationData])

  const pendingDecisions = useMemo(() => {
    return Object.values(decisions).filter(d => d === 'UNDECIDED').length
  }, [decisions])

  // Lightweight local dirty check — kept only as a loading fallback while preview data is in flight
  const localPacketImpact = useMemo(() => {
    let decisionChanges = 0
    let noteChanges = 0

    schedule.forEach((entry) => {
      const id = `${entry.drugRequestId}-${entry.drugRequestItemIndex}`
      const savedItem = reconciliationData?.items.find((item) =>
        item.drugRequestId === entry.drugRequestId && item.drugRequestItemIndex === entry.drugRequestItemIndex
      )

      const currentDecision = decisions[id] ?? 'UNDECIDED'
      const savedDecision = savedItem?.decision || 'UNDECIDED'
      if (currentDecision !== savedDecision) {
        decisionChanges += 1
      }

      const currentNote = (decisionNotes[id] || '').trim()
      const savedNote = (savedItem?.decisionNote || '').trim()
      if (currentNote !== savedNote) {
        noteChanges += 1
      }
    })

    const instructionsChanged =
      additionalInstructions.trim() !== (reconciliationData?.additionalInstructions || '').trim()

    return {
      decisionChanges,
      noteChanges,
      instructionsChanged,
      hasChanges: decisionChanges > 0 || noteChanges > 0 || instructionsChanged,
    }
  }, [additionalInstructions, decisionNotes, decisions, reconciliationData, schedule])

  // Build the simulation payload from form state
  const buildSimulationPayload = useCallback(() => {
    return {
      reconciliationItems: schedule.map((item) => ({
        drugRequestId: item.drugRequestId,
        drugRequestItemIndex: item.drugRequestItemIndex,
        decision: decisions[`${item.drugRequestId}-${item.drugRequestItemIndex}`] ?? 'UNDECIDED',
        decisionNote: decisionNotes[`${item.drugRequestId}-${item.drugRequestItemIndex}`] || undefined,
      })),
      additionalInstructions: additionalInstructions || undefined,
    }
  }, [schedule, decisions, decisionNotes, additionalInstructions])

  // Debounced server preview — fire only when the form is dirty and admissionId is active
  useEffect(() => {
    if (!open || !admissionId || !localPacketImpact.hasChanges) {
      return
    }

    setPreviewStale(true)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await simulatePreview.mutateAsync(buildSimulationPayload())
        setServerPreview(result)
        setPreviewStale(false)
      } catch {
        // Preview failure is non-blocking — local fallback remains visible
      }
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, admissionId, localPacketImpact.hasChanges, buildSimulationPayload])

  // Clear server preview when the modal closes
  useEffect(() => {
    if (!open) {
      setServerPreview(null)
      setPreviewStale(false)
    }
  }, [open])

  const packetChangePreview = useMemo(() => {
    if (!printableDocument?.changeDetailsSinceLastExport?.length) {
      return []
    }

    return [...printableDocument.changeDetailsSinceLastExport]
      .sort((left, right) => {
        const leftMedication = isMedicationPacketChange(left.label)
        const rightMedication = isMedicationPacketChange(right.label)
        if (leftMedication !== rightMedication) {
          return leftMedication ? -1 : 1
        }

        const leftKind = classifyPacketChange(left.previousValue, left.currentValue)
        const rightKind = classifyPacketChange(right.previousValue, right.currentValue)
        const order = { added: 0, removed: 1, modified: 2 }
        if (order[leftKind] !== order[rightKind]) {
          return order[leftKind] - order[rightKind]
        }

        return left.label.localeCompare(right.label)
      })
      .slice(0, 6)
      .map((change) => ({
        ...change,
        kind: classifyPacketChange(change.previousValue, change.currentValue),
        medicationRelated: isMedicationPacketChange(change.label),
      }))
  }, [printableDocument?.changeDetailsSinceLastExport])

  const generatedSummary = useMemo(() => {
    const today = format(new Date(), 'MMMM d, yyyy')
    const toContinue = schedule.filter(s => decisions[`${s.drugRequestId}-${s.drugRequestItemIndex}`] === 'CONTINUE')
    const toStop = schedule.filter(s => decisions[`${s.drugRequestId}-${s.drugRequestItemIndex}`] === 'STOP')

    let summary = `DISCHARGE MEDICATION RECONCILIATION & HANDOFF SUMMARY\n`
    summary += `Patient: ${patientName || 'Unknown Patient'}\n`
    summary += `Date: ${today}\n\n`
    
    summary += `=== MEDICATIONS TO CONTINUE AT HOME ===\n`
    if (toContinue.length === 0) {
      summary += `None.\n`
    } else {
      toContinue.forEach(item => {
        summary += `- ${item.drugName} ${item.dose || ''} ${item.route || ''} ${item.frequency || ''}\n`
        if (item.lastDocumentedAt) {
           summary += `  (Last inpatient dose given: ${format(new Date(item.lastDocumentedAt), 'MMM d, HH:mm')})\n`
        } else {
           summary += `  (No inpatient doses documented)\n`
        }
        const note = decisionNotes[`${item.drugRequestId}-${item.drugRequestItemIndex}`]
        if (note) {
          summary += `  Home note: ${note}\n`
        }
      })
    }
    summary += `\n`
    
    summary += `=== MEDICATIONS TO STOP ===\n`
    if (toStop.length === 0) {
      summary += `None.\n`
    } else {
      toStop.forEach(item => {
        summary += `- ${item.drugName} ${item.dose || ''}\n`
        const note = decisionNotes[`${item.drugRequestId}-${item.drugRequestItemIndex}`]
        if (note) {
          summary += `  Reason: ${note}\n`
        }
      })
    }
    summary += `\n`
    
    summary += `=== ADDITIONAL DISCHARGE INSTRUCTIONS ===\n`
    summary += additionalInstructions ? additionalInstructions : `Standard discharge instructions apply.`
    
    return summary
  }, [schedule, decisions, decisionNotes, patientName, additionalInstructions])

  const handleDecision = (id: string, decision: MedDecision) => {
    setDecisions(prev => ({ ...prev, [id]: decision }))
  }

  const handleSave = async () => {
    if (pendingDecisions > 0) {
      toast.error('Please make a Continue/Stop decision for all medications first.')
      return
    }

    try {
      await saveReconciliation.mutateAsync({
        additionalInstructions,
        items: schedule.map((item) => ({
          drugRequestId: item.drugRequestId,
          drugRequestItemIndex: item.drugRequestItemIndex,
          decision: decisions[`${item.drugRequestId}-${item.drugRequestItemIndex}`] as MedicationReconciliationDecision,
          decisionNote: decisionNotes[`${item.drugRequestId}-${item.drugRequestItemIndex}`] || undefined,
        })),
      })
      onOpenChange(false)
      setPreviewMode(false)
      setDecisions({})
      setDecisionNotes({})
      setAdditionalInstructions('')
    } catch (error) {
      console.error('Failed to save reconciliation', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <WorkspaceModalShell className="lg:!max-w-[1100px]">
        <div className="px-6 py-4 border-b shrink-0">
          <DialogHeader className="pr-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  Discharge Medication Reconciliation
                </DialogTitle>
                <DialogDescription>
                  Review inpatient medications and generate the patient's handoff summary.
                </DialogDescription>
              </div>
              {reconciliationData?.complete && (
                 <Badge className="bg-emerald-100 text-emerald-800 border-none">Already Completed</Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          {scheduleLoading || reconciliationLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewMode ? (
            <div className="flex-1 flex flex-col space-y-4">
              {!printableDocumentLoading && printableDocument ? (
                <div className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-none bg-slate-900 text-white">
                      Packet {printableDocument.documentVersion ? `v${printableDocument.documentVersion}` : 'draft'}
                    </Badge>
                    {printableDocument.lastExportedVersion ? (
                      <Badge variant="outline">Last exported v{printableDocument.lastExportedVersion}</Badge>
                    ) : (
                      <Badge variant="outline">No packet exported yet</Badge>
                    )}
                    {serverPreview ? (
                      <Badge className={`border-none ${
                        serverPreview.packetStatus === 'REISSUE_REQUIRED'
                          ? 'bg-amber-100 text-amber-800'
                          : serverPreview.packetStatus === 'MATCHES_LAST_EXPORT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {serverPreview.packetStatus === 'REISSUE_REQUIRED'
                          ? 'Reception reissue pending'
                          : serverPreview.packetStatus === 'MATCHES_LAST_EXPORT'
                            ? 'Packet matches export'
                            : 'No packet exported yet'}
                      </Badge>
                    ) : printableDocument.reissueRequired ? (
                      <Badge className="border-none bg-amber-100 text-amber-800">Reception reissue pending</Badge>
                    ) : null}
                    {serverPreview ? (
                      <Badge variant="outline">Owner: {serverPreview.responsibleRole.replaceAll('_', ' ')}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    This preview is tied to the discharge packet used at checkout, so medication decisions here flow directly into the front-desk handoff.
                  </p>
                </div>
              ) : null}

              {serverPreview && serverPreview.requiredActions.length > 0 ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-blue-900">Server-computed impact of unsaved edits</p>
                    {previewStale ? (
                      <Badge variant="outline" className="border-amber-300 text-amber-700 text-[11px]">
                        Updating…
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {serverPreview.requiredActions.map((action) => (
                      <span key={action} className="rounded-full bg-white px-3 py-1 font-medium text-blue-900">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ) : localPacketImpact.hasChanges && !serverPreview ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-blue-900">Unsaved edits detected</p>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-700" />
                    <span className="text-xs text-blue-700">Computing server preview…</span>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <FileText className="h-4 w-4" />
                Previewing Handoff Summary
              </div>
              <div className="flex-1 overflow-auto border rounded-md p-4 bg-muted/30 font-mono text-sm whitespace-pre-wrap">
                {generatedSummary}
              </div>
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Back to Editing
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto pr-4 space-y-6 p-6">
              {!printableDocumentLoading && printableDocument ? (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-none bg-slate-900 text-white">
                        Packet {printableDocument.documentVersion ? `v${printableDocument.documentVersion}` : 'draft'}
                      </Badge>
                      {printableDocument.documentStatus ? (
                        <Badge variant="outline">{printableDocument.documentStatus}</Badge>
                      ) : null}
                      {printableDocument.lastExportedVersion ? (
                        <Badge variant="outline">Last exported v{printableDocument.lastExportedVersion}</Badge>
                      ) : (
                        <Badge variant="outline">No packet exported yet</Badge>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Medication reconciliation is now part of the formal discharge packet. What you save here shapes what reception prints and hands off to the patient.
                    </p>
                  </div>

                  {serverPreview && serverPreview.requiredActions.length > 0 ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-blue-900">Predicted packet impact</p>
                        {previewStale ? (
                          <Badge variant="outline" className="border-amber-300 text-amber-700 text-[11px]">
                            Updating…
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-blue-800">
                        {serverPreview.packetStatus === 'REISSUE_REQUIRED'
                          ? 'Saving will require reception to reissue the discharged packet before checkout.'
                          : serverPreview.packetStatus === 'NO_EXPORT_YET'
                            ? 'Saving will populate the first printable discharge packet for reception.'
                            : 'Packet currently matches the latest export.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {serverPreview.requiredActions.map((action) => (
                          <span key={action} className="rounded-full bg-white px-3 py-1 font-medium text-blue-900">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : localPacketImpact.hasChanges && !serverPreview ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-blue-900">Edits detected — computing impact</p>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-700" />
                      </div>
                    </div>
                  ) : null}

                  {printableDocument.reissueRequired ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">Checkout packet already needs reissue</p>
                      <p className="mt-2 text-sm text-amber-800">
                        The current charted discharge packet differs from the latest exported version
                        {printableDocument.lastExportedVersion ? ` (v${printableDocument.lastExportedVersion})` : ''}.
                      </p>
                      {packetChangePreview.length ? (
                        <div className="mt-3 space-y-2">
                          {packetChangePreview.map((change) => (
                            <div key={`${change.label}-${change.previousValue}-${change.currentValue}`} className="rounded-lg border border-amber-200 bg-white p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">{change.label}</p>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                    change.kind === 'added'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : change.kind === 'removed'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {change.kind}
                                </span>
                                {change.medicationRelated ? (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                                    Medication
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-xs text-slate-700">{change.previousValue}</pre>
                                <pre className="whitespace-pre-wrap rounded-md bg-amber-100/60 p-2 text-xs text-amber-950">{change.currentValue}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {schedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No active medications found for this admission.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedule.map(entry => {
                    const id = `${entry.drugRequestId}-${entry.drugRequestItemIndex}`
                    const decision = decisions[id]
                    return (
                      <div key={id} className={`rounded-lg border p-4 transition-colors ${decision === 'UNDECIDED' ? 'border-amber-200 bg-amber-50/50' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-base flex items-center gap-2">
                              {entry.drugName}
                              {decision === 'UNDECIDED' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {[entry.dose, entry.route, entry.frequency].filter(Boolean).join(' • ')}
                            </p>
                            {entry.lastDocumentedAt ? (
                              <p className="text-xs text-muted-foreground mt-2">
                                Last given on unit: {format(new Date(entry.lastDocumentedAt), 'MMM d, HH:mm')} 
                                {entry.lastAdministrationStatus && ` (${entry.lastAdministrationStatus})`}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-2">No documented administrations yet</p>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <Button 
                              size="sm" 
                              variant={decision === 'CONTINUE' ? 'default' : 'outline'}
                              className={decision === 'CONTINUE' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                              onClick={() => handleDecision(id, 'CONTINUE')}
                            >
                              Continue at Home
                            </Button>
                            <Button 
                              size="sm" 
                              variant={decision === 'STOP' ? 'destructive' : 'outline'}
                              onClick={() => handleDecision(id, 'STOP')}
                            >
                              Stop
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            {decision === 'STOP' ? 'Reason for stopping' : 'Home instruction note'}
                          </label>
                          <Textarea
                            value={decisionNotes[id] || ''}
                            onChange={(event) => setDecisionNotes(prev => ({ ...prev, [id]: event.target.value }))}
                            placeholder={
                              decision === 'STOP'
                                ? 'Optional reason for stopping this medication at discharge...'
                                : 'Optional counseling or home-use note for this medication...'
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="space-y-3 pt-4 border-t">
                 <h3 className="text-sm font-semibold">Additional Discharge Instructions</h3>
                 <Textarea 
                   placeholder="Add any specific instructions, follow-up dates, wound care, or mobility guidance..." 
                   value={additionalInstructions}
                   onChange={e => setAdditionalInstructions(e.target.value)}
                   rows={4}
                 />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50 shrink-0 sm:justify-between items-center">
          {!previewMode ? (
             <div className="text-sm flex items-center gap-3">
                {pendingDecisions > 0 ? (
                  <span className="text-amber-600 font-medium">{pendingDecisions} medications still need review</span>
                ) : (
                  <span className="text-emerald-600 font-medium">All medications reviewed ✓</span>
                )}
                {previewStale && localPacketImpact.hasChanges ? (
                  <span className="text-xs text-slate-500">Preview updating…</span>
                ) : null}
             </div>
          ) : (
            <div className="text-sm">
              {previewStale ? (
                <span className="text-amber-600 font-medium">⚠ Preview may be stale — edits were made since last server check</span>
              ) : serverPreview ? (
                <span className="text-slate-600">
                  Server preview: {serverPreview.packetStatus.replaceAll('_', ' ').toLowerCase()}
                  {' · '}{serverPreview.handoffStatus.replaceAll('_', ' ').toLowerCase()}
                </span>
              ) : null}
            </div>
          )}
          <div className="flex gap-2">
            {!previewMode ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button 
                  onClick={() => setPreviewMode(true)}
                  disabled={pendingDecisions > 0}
                >
                  Preview Summary
                </Button>
              </>
            ) : (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 font-medium"
                onClick={handleSave}
                disabled={saveReconciliation.isPending}
              >
                {saveReconciliation.isPending ? 'Saving to Chart...' : 'Sign & Save to Chart'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </WorkspaceModalShell>
    </Dialog>
  )
}
