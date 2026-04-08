import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { MedicationReconciliationDecision } from '@/types/admission'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface DischargeMedicationReconciliationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admissionId: string
  patientName?: string
}

type MedDecision = MedicationReconciliationDecision | 'UNDECIDED'

export function DischargeMedicationReconciliationModal({
  open,
  onOpenChange,
  admissionId,
  patientName
}: DischargeMedicationReconciliationModalProps) {
  const { data: scheduleRaw, isLoading: scheduleLoading } = useAdmissionMedicationSchedule(admissionId)
  const { data: reconciliationData, isLoading: reconciliationLoading } = useAdmissionMedicationReconciliation(admissionId)
  const [decisions, setDecisions] = useState<Record<string, MedDecision>>({})
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({})
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
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
      <DialogContent className="max-w-4xl p-6 h-[90vh] flex flex-col">
        <DialogHeader>
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

        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          {scheduleLoading || reconciliationLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewMode ? (
            <div className="flex-1 flex flex-col space-y-4">
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
            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
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
                        <div className="flex items-start justify-between">
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
                          
                          <div className="flex gap-2">
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

        <DialogFooter className="mt-6 border-t pt-4 sm:justify-between items-center">
          {!previewMode ? (
             <div className="text-sm">
                {pendingDecisions > 0 ? (
                  <span className="text-amber-600 font-medium">{pendingDecisions} medications still need review</span>
                ) : (
                  <span className="text-emerald-600 font-medium">All medications reviewed ✓</span>
                )}
             </div>
          ) : <div />}
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
      </DialogContent>
    </Dialog>
  )
}
