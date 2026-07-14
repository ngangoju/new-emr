"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Circle, FileSignature, Play, XCircle, CheckCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/shared"
import {
  type TheatreCase,
  type ChecklistStage,
  usePreopChecklist,
  useCompleteChecklistStage,
  useOperationNote,
  useWriteOperationNote,
  useSignOperationNote,
  useUpdateTheatreCase,
} from "@/hooks/api/useTheatre"
import {
  operationNoteSchema,
  type OperationNoteFormValues,
} from "@/lib/validations/theatre"

// Form values (post-transform) type for react-hook-form
type OpNoteFormState = Omit<OperationNoteFormValues, "bloodLossMl"> & {
  bloodLossMl?: number
}

interface CaseDetailDialogProps {
  surgeryCase: TheatreCase | null
  onOpenChange: (open: boolean) => void
}

const STAGES: { key: ChecklistStage; label: string; hint: string }[] = [
  { key: "SIGN_IN", label: "Sign-in", hint: "Before anesthesia" },
  { key: "TIME_OUT", label: "Time-out", hint: "Before incision" },
  { key: "SIGN_OUT", label: "Sign-out", hint: "Before leaving theatre" },
]

/** Theatre case detail: WHO checklist stepper, operation note, status flow. */
export function CaseDetailDialog({ surgeryCase, onOpenChange }: CaseDetailDialogProps) {
  const caseId = surgeryCase?.id
  const { data: checklist } = usePreopChecklist(caseId)
  const { data: note } = useOperationNote(caseId)
  const completeStage = useCompleteChecklistStage(caseId)
  const writeNote = useWriteOperationNote(caseId)
  const signNote = useSignOperationNote(caseId)
  const updateCase = useUpdateTheatreCase(caseId ?? "")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<OpNoteFormState>({
    resolver: zodResolver(operationNoteSchema),
    defaultValues: { procedure: "", countsConfirmed: false },
  })

  useEffect(() => {
    if (note) {
      reset({
        procedure: note.procedure ?? note.procedurePerformed ?? "",
        findings: note.findings ?? "",
        anesthesiaNotes: note.anesthesiaNotes ?? "",
        bloodLossMl:
          note.bloodLossMl != null ? note.bloodLossMl : undefined,
        countsConfirmed: note.countsConfirmed ?? false,
      })
    } else {
      reset({ procedure: "", countsConfirmed: false })
    }
  }, [note, reset])

  const countsConfirmed = useWatch({ control, name: "countsConfirmed" })

  if (!surgeryCase) return null

  const stageDone: Record<ChecklistStage, boolean> = {
    SIGN_IN: checklist?.signInCompleted ?? false,
    TIME_OUT: checklist?.timeOutCompleted ?? false,
    SIGN_OUT: checklist?.signOutCompleted ?? false,
  }
  const nextStage = STAGES.find((s) => !stageDone[s.key])?.key
  const isSigned = Boolean(note?.signedAt)

  const onSaveNote = handleSubmit((values) => {
    writeNote.mutate({
      procedure: values.procedure,
      findings: values.findings || undefined,
      anesthesiaNotes: values.anesthesiaNotes || undefined,
      bloodLossMl: values.bloodLossMl ?? undefined,
      countsConfirmed: values.countsConfirmed,
    })
  })

  return (
    <Dialog open={Boolean(surgeryCase)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>{surgeryCase.procedureName ?? "Surgery case"}</span>
            <StatusBadge status={surgeryCase.status} label={surgeryCase.status} />
          </DialogTitle>
          <DialogDescription>
            {surgeryCase.surgeonId ? `Surgeon ${surgeryCase.surgeonId.slice(0, 8)} · ` : ""}
            {new Date(surgeryCase.scheduledStart).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        {/* Status flow */}
        <div className="flex flex-wrap gap-2">
          {surgeryCase.status === "SCHEDULED" && (
            <>
              <Button
                size="sm"
                onClick={() => updateCase.mutate({ status: "IN_THEATRE" })}
                disabled={updateCase.isPending}
              >
                <Play className="mr-1 h-4 w-4" aria-hidden /> Start case
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateCase.mutate({ status: "CANCELLED" })}
                disabled={updateCase.isPending}
              >
                <XCircle className="mr-1 h-4 w-4" aria-hidden /> Cancel case
              </Button>
            </>
          )}
          {surgeryCase.status === "IN_THEATRE" && (
            <Button
              size="sm"
              onClick={() => updateCase.mutate({ status: "RECOVERY" })}
              disabled={updateCase.isPending}
              title="Requires WHO checklist sign-out"
            >
              <CheckCheck className="mr-1 h-4 w-4" aria-hidden /> Send to recovery
            </Button>
          )}
          {surgeryCase.status === "RECOVERY" && (
            <Button
              size="sm"
              onClick={() => updateCase.mutate({ status: "COMPLETED" })}
              disabled={updateCase.isPending}
            >
              <CheckCheck className="mr-1 h-4 w-4" aria-hidden /> Complete case
            </Button>
          )}
        </div>

        {/* WHO checklist stepper */}
        <section className="rounded-lg border p-4 space-y-3">
          <h3 className="font-heading font-semibold">WHO Surgical Safety Checklist</h3>
          <ol className="space-y-2">
            {STAGES.map((stage) => {
              const done = stageDone[stage.key]
              return (
                <li key={stage.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />
                    )}
                    <span className={done ? "font-medium" : "text-muted-foreground"}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-muted-foreground">({stage.hint})</span>
                  </span>
                  {!done && stage.key === nextStage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeStage.mutate(stage.key)}
                      disabled={completeStage.isPending}
                    >
                      Complete {stage.label.toLowerCase()}
                    </Button>
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        {/* Operation note */}
        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold">Operation note</h3>
            {isSigned && <StatusBadge status="SIGNED" label="SIGNED" tone="success" />}
          </div>

          <form onSubmit={onSaveNote} className="space-y-3">
            <fieldset disabled={isSigned} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="opnote-procedure">Procedure performed</Label>
                <Input
                  id="opnote-procedure"
                  aria-invalid={!!errors.procedure}
                  {...register("procedure")}
                />
                {errors.procedure && (
                  <p className="text-sm text-destructive">{errors.procedure.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="opnote-anesthesia">Anesthesia</Label>
                  <Input id="opnote-anesthesia" {...register("anesthesiaNotes")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="opnote-ebl">Estimated blood loss (ml)</Label>
                  <Input
                    id="opnote-ebl"
                    type="number"
                    min={0}
                    {...register("bloodLossMl", { valueAsNumber: true })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="opnote-findings">Findings</Label>
                <Textarea id="opnote-findings" rows={2} {...register("findings")} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={countsConfirmed ?? false}
                  onCheckedChange={(checked) => setValue("countsConfirmed", checked === true)}
                />
                Instrument &amp; swab counts confirmed
              </label>
            </fieldset>

            {!isSigned && (
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={writeNote.isPending}>
                  {writeNote.isPending ? "Saving…" : "Save note"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => signNote.mutate()}
                  disabled={signNote.isPending || !note || !note.countsConfirmed}
                  title={
                    !note
                      ? "Save the note first"
                      : !note.countsConfirmed
                        ? "Counts must be confirmed (and saved) before signing"
                        : undefined
                  }
                >
                  <FileSignature className="mr-1 h-4 w-4" aria-hidden />
                  Sign note
                </Button>
              </div>
            )}
          </form>
        </section>
      </DialogContent>
    </Dialog>
  )
}

