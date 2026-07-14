"use client"

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
import { useAvailableTheatres, useCreateSurgerySchedule } from "@/hooks/api/useTheatre"
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
  const createSchedule = useCreateSurgerySchedule()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleSurgeryFormValues>({
    resolver: zodResolver(scheduleSurgerySchema),
    defaultValues: {
      theatreId: "",
      patientId: "",
      procedureName: "",
      surgeonName: "",
      scheduledStart: "",
      scheduledEnd: "",
    },
  })

  const onSubmit = handleSubmit((values) => {
    createSchedule.mutate(
      {
        theatreId: values.theatreId,
        patientId: values.patientId,
        procedureName: values.procedureName,
        surgeonName: values.surgeonName || undefined,
        scheduledStart: values.scheduledStart,
        scheduledEnd: values.scheduledEnd || undefined,
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
                  onSelect={(patient) => field.onChange(patient.id)}
                />
              )}
            />
            {errors.patientId && (
              <p className="text-sm text-destructive">{errors.patientId.message}</p>
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
            <Label htmlFor="surgery-surgeon">Surgeon</Label>
            <Input id="surgery-surgeon" placeholder="Lead surgeon" {...register("surgeonName")} />
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
              <Label htmlFor="surgery-end">End (defaults to 2h)</Label>
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
              disabled={createSchedule.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSchedule.isPending}>
              {createSchedule.isPending ? "Scheduling…" : "Schedule surgery"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
