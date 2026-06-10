'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { AllergyInteractionOverrideModal } from '@/components/clinical/AllergyInteractionOverrideModal'
import { PrescriptionList } from '@/components/clinical/PrescriptionList'
import { StructuredMedicationEntry } from '@/components/clinical/StructuredMedicationEntry'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  WorkspaceModalShell,
} from '@/components/ui/dialog'
import { useAddMedication, useDryRunSafetyCheck, type AddMedicationPayload, type ConsultationMedication } from '@/hooks/api/useConsultations'

interface QuickMedicationOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultationId: string
  patientId: string
  patientName?: string
  medications: ConsultationMedication[]
}

export function QuickMedicationOrderModal({
  open,
  onOpenChange,
  consultationId,
  patientId,
  patientName,
  medications,
}: QuickMedicationOrderModalProps) {
  const addMedication = useAddMedication()
  const dryRunSafetyCheck = useDryRunSafetyCheck()
  const [pendingMed, setPendingMed] = useState<(AddMedicationPayload & { drugName: string }) | null>(null)
  const [safetyError, setSafetyError] = useState<string | null>(null)

  const saveMedication = async (
    medication: AddMedicationPayload & { drugName: string },
    overrides?: { allergyOverrideReason?: string; interactionOverrideReason?: string },
  ) => {
    try {
      await addMedication.mutateAsync({
        consultationId,
        payload: {
          formularyId: medication.formularyId,
          dose: medication.dose,
          route: medication.route,
          frequency: medication.frequency,
          duration: medication.duration,
          indication: medication.indication,
          allergyOverrideReason: overrides?.allergyOverrideReason,
          interactionOverrideReason: overrides?.interactionOverrideReason,
        },
      })
      toast.success(`${medication.drugName} added to the encounter prescription list.`)
    } catch {
      toast.error(`Failed to prescribe ${medication.drugName}.`)
    }
  }

  const handleAddMedication = async (medication: AddMedicationPayload & { drugName: string }) => {
    try {
      const safetyResult = await dryRunSafetyCheck.mutateAsync({
        patientId,
        formularyId: medication.formularyId,
        activeFormularyIds: medications.map((item) => item.formularyId),
      })

      if (safetyResult.safe) {
        await saveMedication(medication)
        return
      }

      if (safetyResult.allergyConflict) {
        setPendingMed(medication)
        setSafetyError(
          `ALLERGY CONFLICT: Patient has documented allergy to '${safetyResult.allergyConflict.allergen}' (severity: ${safetyResult.allergyConflict.severity}).`,
        )
        return
      }

      if (safetyResult.interactionConflict) {
        setPendingMed(medication)
        setSafetyError(
          `DRUG INTERACTION DETECTED: ${safetyResult.interactionConflict.drug1Name} and ${safetyResult.interactionConflict.drug2Name} — ${safetyResult.interactionConflict.description}.`,
        )
        return
      }

      await saveMedication(medication)
    } catch {
      toast.error('Medication safety check failed. Please try again.')
    }
  }

  const handleOverrideConfirm = async (reason: string) => {
    if (!pendingMed || !safetyError) return

    const isAllergy = safetyError.toLowerCase().includes('allergy')
    const isInteraction = safetyError.toLowerCase().includes('interaction')

    await saveMedication(pendingMed, {
      allergyOverrideReason: isAllergy ? reason : undefined,
      interactionOverrideReason: isInteraction ? reason : undefined,
    })

    setPendingMed(null)
    setSafetyError(null)
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPendingMed(null)
      setSafetyError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <WorkspaceModalShell className="lg:!max-w-[1000px]">
          <div className="px-6 py-4 border-b shrink-0">
            <DialogHeader className="pr-10">
              <div className="flex items-center justify-between gap-3 mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Structured Medication Entry
                </Badge>
                {patientName ? (
                  <span className="text-sm text-muted-foreground">
                    Patient: <span className="font-medium">{patientName}</span>
                  </span>
                ) : null}
              </div>
              <DialogTitle>Prescribe Medication</DialogTitle>
              <DialogDescription>
                Search the formulary, run safety checks, and save prescriptions directly to this encounter.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            <StructuredMedicationEntry
              onAdd={handleAddMedication}
              isLoading={addMedication.isPending || dryRunSafetyCheck.isPending}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Current Encounter Medications</h3>
                <Badge variant="outline">{medications.length}</Badge>
              </div>
              <PrescriptionList medications={medications} />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
          </DialogFooter>
        </WorkspaceModalShell>
      </Dialog>

      <AllergyInteractionOverrideModal
        isOpen={!!pendingMed && !!safetyError}
        onClose={() => {
          setPendingMed(null)
          setSafetyError(null)
        }}
        error={safetyError || ''}
        onConfirm={handleOverrideConfirm}
        isLoading={addMedication.isPending}
      />
    </>
  )
}
