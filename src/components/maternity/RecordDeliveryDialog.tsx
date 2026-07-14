"use client"

import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HeartPulse } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { PatientSelector } from "@/components/shared/PatientSelector"
import { useRecordDelivery } from "@/hooks/api/useMaternity"

const numeric = z.string().regex(/^\d*$/, "Whole number").optional().or(z.literal(""))

const deliverySchema = z
  .object({
    patientId: z.string().uuid({ message: "Select the mother" }),
    deliveryMode: z.string().min(1, "Select delivery mode"),
    outcome: z.string().min(1, "Select outcome"),
    deliveredAt: z.string().min(1, "Delivery time is required"),
    apgar1min: numeric,
    apgar5min: numeric,
    birthWeightGrams: numeric,
    registerNewborn: z.boolean(),
    newbornFirstName: z.string().max(100).optional().or(z.literal("")),
    newbornGender: z.string().optional().or(z.literal("")),
  })
  .refine((v) => !v.registerNewborn || v.outcome === "LIVE_BIRTH", {
    message: "Newborn registration requires a live birth",
    path: ["registerNewborn"],
  })

type DeliveryFormValues = z.infer<typeof deliverySchema>

const MODES = ["SVD", "ASSISTED", "CS_ELECTIVE", "CS_EMERGENCY"]
const OUTCOMES = ["LIVE_BIRTH", "STILLBIRTH"]

interface RecordDeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordDeliveryDialog({ open, onOpenChange }: RecordDeliveryDialogProps) {
  const recordDelivery = useRecordDelivery()

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      patientId: "",
      deliveryMode: "",
      outcome: "",
      deliveredAt: "",
      registerNewborn: false,
    },
  })

  const registerNewborn = useWatch({ control, name: "registerNewborn" })

  const onSubmit = handleSubmit((values) => {
    recordDelivery.mutate(
      {
        patientId: values.patientId,
        deliveryMode: values.deliveryMode,
        outcome: values.outcome,
        deliveredAt: values.deliveredAt,
        apgar1min: values.apgar1min ? Number(values.apgar1min) : undefined,
        apgar5min: values.apgar5min ? Number(values.apgar5min) : undefined,
        birthWeightGrams: values.birthWeightGrams
          ? Number(values.birthWeightGrams)
          : undefined,
        registerNewborn: values.registerNewborn,
        newbornFirstName: values.newbornFirstName || undefined,
        newbornGender: values.newbornGender || undefined,
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" aria-hidden />
            Record delivery
          </DialogTitle>
          <DialogDescription>
            Document the delivery; a live birth can register the newborn as a linked patient.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mother</Label>
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
              <Label htmlFor="delivery-mode">Mode</Label>
              <Controller
                control={control}
                name="deliveryMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="delivery-mode" aria-invalid={!!errors.deliveryMode}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.deliveryMode && (
                <p className="text-sm text-destructive">{errors.deliveryMode.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-outcome">Outcome</Label>
              <Controller
                control={control}
                name="outcome"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="delivery-outcome" aria-invalid={!!errors.outcome}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTCOMES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o.replaceAll("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.outcome && (
                <p className="text-sm text-destructive">{errors.outcome.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-at">Delivered at</Label>
            <Input
              id="delivery-at"
              type="datetime-local"
              aria-invalid={!!errors.deliveredAt}
              {...register("deliveredAt")}
            />
            {errors.deliveredAt && (
              <p className="text-sm text-destructive">{errors.deliveredAt.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apgar1">APGAR 1 min</Label>
              <Input id="apgar1" inputMode="numeric" {...register("apgar1min")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apgar5">APGAR 5 min</Label>
              <Input id="apgar5" inputMode="numeric" {...register("apgar5min")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight-g">Weight (g)</Label>
              <Input id="weight-g" inputMode="numeric" {...register("birthWeightGrams")} />
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Controller
                control={control}
                name="registerNewborn"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => setValue("registerNewborn", checked === true)}
                  />
                )}
              />
              Register newborn as a patient (live birth)
            </label>
            {errors.registerNewborn && (
              <p className="text-sm text-destructive">{errors.registerNewborn.message}</p>
            )}
            {registerNewborn && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newborn-name">First name</Label>
                  <Input id="newborn-name" placeholder="Baby" {...register("newbornFirstName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newborn-gender">Gender</Label>
                  <Controller
                    control={control}
                    name="newbornGender"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger id="newborn-gender">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="MALE">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={recordDelivery.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={recordDelivery.isPending}>
              {recordDelivery.isPending ? "Saving…" : "Record delivery"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
