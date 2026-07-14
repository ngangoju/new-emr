"use client"

import { useEffect } from "react"
import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { useCurrentAdmissions, useAvailableBeds } from "@/hooks/useAdmissions"
import { useWards, useTransferBed } from "@/hooks/api/useBeds"
import {
  bedTransferSchema,
  type BedTransferFormValues,
} from "@/lib/validations/beds"

interface BedTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
}

/**
 * Transfer an admitted patient to a different (available) bed.
 * Posts to the audited bed-transfers endpoint (bed:transfer:create).
 */
export function BedTransferDialog({ open, onOpenChange, trigger }: BedTransferDialogProps) {
  const { data: admissions, isLoading: admissionsLoading } = useCurrentAdmissions()
  const { data: wards } = useWards()
  const transferBed = useTransferBed()

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BedTransferFormValues>({
    resolver: zodResolver(bedTransferSchema),
    defaultValues: { admissionId: "", targetWardId: "", toBedId: "", reason: "" },
  })

  const targetWardId = useWatch({ control, name: "targetWardId" })
  const { data: availableBeds, isLoading: bedsLoading } = useAvailableBeds(
    targetWardId || undefined
  )

  // Changing the target ward invalidates any previously chosen bed.
  useEffect(() => {
    setValue("toBedId", "")
  }, [targetWardId, setValue])

  const onSubmit = handleSubmit((values) => {
    transferBed.mutate(
      {
        admissionId: values.admissionId,
        toBedId: values.toBedId,
        reason: values.reason || undefined,
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
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" aria-hidden />
            Transfer patient
          </DialogTitle>
          <DialogDescription>
            Move an admitted patient to an available bed. The transfer is recorded
            in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transfer-admission">Patient (active admission)</Label>
            <Controller
              control={control}
              name="admissionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="transfer-admission" aria-invalid={!!errors.admissionId}>
                    <SelectValue
                      placeholder={admissionsLoading ? "Loading admissions…" : "Select patient"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(admissions ?? []).map((admission) => (
                      <SelectItem key={admission.id} value={admission.id}>
                        {admission.patientName ?? "Unknown patient"}
                        {admission.wardName ? ` — ${admission.wardName}` : ""}
                        {admission.bedNumber ? ` / Bed ${admission.bedNumber}` : ""}
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
            <Label htmlFor="transfer-ward">Target ward</Label>
            <Controller
              control={control}
              name="targetWardId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="transfer-ward" aria-invalid={!!errors.targetWardId}>
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {(wards ?? []).map((ward) => (
                      <SelectItem key={ward.id} value={ward.id}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.targetWardId && (
              <p className="text-sm text-destructive">{errors.targetWardId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-bed">Target bed (available only)</Label>
            <Controller
              control={control}
              name="toBedId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!targetWardId}
                >
                  <SelectTrigger id="transfer-bed" aria-invalid={!!errors.toBedId}>
                    <SelectValue
                      placeholder={
                        !targetWardId
                          ? "Select a ward first"
                          : bedsLoading
                            ? "Loading beds…"
                            : (availableBeds?.length ?? 0) === 0
                              ? "No available beds in this ward"
                              : "Select bed"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableBeds ?? []).map((bed) => (
                      <SelectItem key={bed.id} value={bed.id}>
                        Bed {bed.bedNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.toBedId && (
              <p className="text-sm text-destructive">{errors.toBedId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-reason">Reason (optional)</Label>
            <Controller
              control={control}
              name="reason"
              render={({ field }) => (
                <Textarea
                  id="transfer-reason"
                  rows={2}
                  placeholder="e.g. Ward decongestion, isolation requirement…"
                  {...field}
                />
              )}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={transferBed.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={transferBed.isPending}>
              {transferBed.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Transferring…
                </span>
              ) : (
                "Transfer patient"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
