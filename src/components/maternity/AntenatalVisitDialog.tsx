"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Baby } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientSelector } from "@/components/shared/PatientSelector"
import { useCreateAntenatalVisit } from "@/hooks/api/useMaternity"

const numeric = z.string().regex(/^\d*$/, "Whole number").optional().or(z.literal(""))
const decimal = z.string().regex(/^\d*(\.\d+)?$/, "Number").optional().or(z.literal(""))

const antenatalSchema = z.object({
  patientId: z.string().uuid({ message: "Select a patient" }),
  visitNumber: numeric,
  gestationalAgeWeeks: numeric,
  bloodPressure: z.string().max(20).optional().or(z.literal("")),
  weightKg: decimal,
  foetalHeartRate: numeric,
})

type AntenatalFormValues = z.infer<typeof antenatalSchema>

interface AntenatalVisitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AntenatalVisitDialog({ open, onOpenChange }: AntenatalVisitDialogProps) {
  const createVisit = useCreateAntenatalVisit()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AntenatalFormValues>({
    resolver: zodResolver(antenatalSchema),
    defaultValues: { patientId: "" },
  })

  const onSubmit = handleSubmit((values) => {
    createVisit.mutate(
      {
        patientId: values.patientId,
        visitNumber: values.visitNumber ? Number(values.visitNumber) : undefined,
        gestationalAgeWeeks: values.gestationalAgeWeeks
          ? Number(values.gestationalAgeWeeks)
          : undefined,
        bloodPressure: values.bloodPressure || undefined,
        weightKg: values.weightKg ? Number(values.weightKg) : undefined,
        foetalHeartRate: values.foetalHeartRate ? Number(values.foetalHeartRate) : undefined,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" aria-hidden />
            Record antenatal visit
          </DialogTitle>
          <DialogDescription>Document a routine antenatal care visit.</DialogDescription>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anc-visit-number">Visit #</Label>
              <Input id="anc-visit-number" inputMode="numeric" {...register("visitNumber")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anc-gestation">Gestation (weeks)</Label>
              <Input id="anc-gestation" inputMode="numeric" {...register("gestationalAgeWeeks")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anc-bp">Blood pressure</Label>
              <Input id="anc-bp" placeholder="120/80" {...register("bloodPressure")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anc-weight">Weight (kg)</Label>
              <Input id="anc-weight" inputMode="decimal" {...register("weightKg")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anc-fhr">Foetal heart rate</Label>
              <Input id="anc-fhr" inputMode="numeric" {...register("foetalHeartRate")} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createVisit.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createVisit.isPending}>
              {createVisit.isPending ? "Saving…" : "Record visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
