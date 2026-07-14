"use client"

import { useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientSelector } from "@/components/shared/PatientSelector"
import { useAvailableTheatres, useScheduleSurgery } from "@/hooks/api/useTheatre"
import { useAdmissions } from "@/hooks/useAdmissions"
import { useProfile } from "@/hooks/useProfile"
import {
  scheduleSurgerySchema,
  type ScheduleSurgeryFormValues,
} from "@/lib/validations/theatre"

interface ScheduleSurgeryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Book a theatre slot; overlapping bookings are rejected by the backend. */
export function ScheduleSurgeryDialog({ open, onOpenChange }: ScheduleSurgeryDialogProps) {
  const { data: theatres } = useAvailableTheatres()
  const createCase = useScheduleSurgery()
  const { profile } = useProfile()

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ScheduleSurgeryFormValues>({
    resolver: zodResolver(scheduleSurgerySchema),
    defaultValues: {
      theatreId: "",
      surgeonId: "",
      patientId: "",
      admissionId: "",
      procedureName: "",
      procedureCode: "",
      notes: "",
      scheduledStart: "",
      scheduledEnd: "",
    },
  })

  const patientId = watch("patientId")
  // Look up the patient's active admission to satisfy admissionId (FK required by backend).
  const { data: admissions } = useAdmissions(
    patientId ? { patientId, status: "admitted" } : undefined,
    { enabled: Boolean(patientId) }
  )
  const activeAdmissionId = useMemo(
    () => admissions?.[0]?.id ?? "",
    [admissions]
  )

  const onSubmit = handleSubmit((values) => {
    createCase.mutate(
      {
        theatreId: values.theatreId,
        surgeonId: profile?.userId ?? values.surgeonId,
        anaesthetistId: values.anaesthetistId || undefined,
        patientId: values.patientId,
        admissionId: values.admissionId || activeAdmissionId,
        procedureName: values.procedureName,
        procedureCode: values.procedureCode || undefined,
        notes: values.notes || undefined,
        scheduledStart: values.scheduledStart,
        scheduledEnd: values.scheduledEnd,
      },
      {
        onSuccess: () => {
          reset()
          onOpenChange(false)
        },
      }
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" aria-hidden />
            Schedule surgery
          </DialogTitle>
          <DialogDescription>
            Book a theatre slot. Overlapping bookings for the same theatre are rejected.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Controller
              control={control}
              name="patientId"
              render={({ field }) => (
                <PatientSelector
                  selectedPatientId={field.value || undefined}
                  onSelect={(patient) => {
                    field.onChange(patient.id)
                    // Reset admission when patient changes
                    setValue("admissionId", "")
                  }}
                />
              )}
            />
            {errors.patientId && (
              <p className="text-sm text-destructive">{errors.patientId.message}</p>
            )}
            {patientId && !activeAdmissionId && (
              <p className="text-sm text-amber-600">
                No active admission found for this patient — select one below.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgery-admission">Admission</Label>
            <Controller
              control={control}
              name="admissionId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!patientId}
                >
                  <SelectTrigger id="surgery-admission" aria-invalid={!!errors.admissionId}>
                    <SelectValue placeholder="Select admission" />
                  </SelectTrigger>
                  <SelectContent>
                    {(admissions ?? []).map((adm) => (
                      <SelectItem key={adm.id} value={adm.id}>
                        #{adm.id.slice(0, 8)} · {adm.wardName ?? "Ward"}
                        {adm.bedNumber ? ` · Bed ${adm.bedNumber}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.admissionId && (
              <p className="text-sm text-destructive">{errors.admissionId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgery-theatre">Theatre</Label>
            <Controller
              control={control}
              name="theatreId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="surgery-theatre" aria-invalid={!!errors.theatreId}>
                    <SelectValue placeholder="Select available theatre" />
                  </SelectTrigger>
                  <SelectContent>
                    {(theatres ?? []).map((theatre) => (
                      <SelectItem key={theatre.id} value={theatre.id}>
                        {theatre.name}
                        {theatre.location ? ` — ${theatre.location}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.theatreId && (
              <p className="text-sm text-destructive">{errors.theatreId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgery-procedure">Procedure</Label>
            <Input
              id="surgery-procedure"
              placeholder="e.g. Open appendectomy"
              aria-invalid={!!errors.procedureName}
              {...register("procedureName")}
            />
            {errors.procedureName && (
              <p className="text-sm text-destructive">{errors.procedureName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgery-procedure-code">Procedure code (optional)</Label>
            <Input
              id="surgery-procedure-code"
              placeholder="e.g. ICD-9-CM 47.09"
              {...register("procedureCode")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgery-notes">Notes (optional)</Label>
            <Input id="surgery-notes" placeholder="Any scheduling notes" {...register("notes")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="surgery-start">Start</Label>
              <Input
                id="surgery-start"
                type="datetime-local"
                aria-invalid={!!errors.scheduledStart}
                {...register("scheduledStart")}
              />
              {errors.scheduledStart && (
                <p className="text-sm text-destructive">{errors.scheduledStart.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="surgery-end">End</Label>
              <Input
                id="surgery-end"
                type="datetime-local"
                aria-invalid={!!errors.scheduledEnd}
                {...register("scheduledEnd")}
              />
              {errors.scheduledEnd && (
                <p className="text-sm text-destructive">{errors.scheduledEnd.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCase.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCase.isPending}>
              {createCase.isPending ? "Scheduling…" : "Schedule surgery"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
