'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDischargePatient } from '@/hooks/useAdmissions'

const MIN_OVERRIDE_REASON_LENGTH = 20

interface AdminDischargeOverrideModalProps {
  open: boolean
  admissionId: string
  outstandingAmount: number
  onOpenChange: (open: boolean) => void
  onSubmitted: (overrideReason: string) => void
}

export function AdminDischargeOverrideModal({
  open,
  admissionId,
  outstandingAmount,
  onOpenChange,
  onSubmitted,
}: AdminDischargeOverrideModalProps) {
  const [adminOverrideReason, setAdminOverrideReason] = useState('')
  const dischargePatientMutation = useDischargePatient()

  useEffect(() => {
    if (!open) setAdminOverrideReason('')
  }, [open])

  const trimmedReason = adminOverrideReason.trim()
  const characterCount = trimmedReason.length
  const canSubmit = characterCount >= MIN_OVERRIDE_REASON_LENGTH && !dischargePatientMutation.isPending

  const humanReadableOutstandingAmount = useMemo(
    () => `${outstandingAmount.toLocaleString()} RWF`,
    [outstandingAmount],
  )

  const handleSubmit = async () => {
    if (!canSubmit) return

    await dischargePatientMutation.mutateAsync({
      id: admissionId,
      overrideReason: trimmedReason,
    })

    onSubmitted(trimmedReason)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Discharge Override</DialogTitle>
          <DialogDescription>
            Outstanding balance: <span className="font-semibold">{humanReadableOutstandingAmount}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="admin-discharge-override-reason">Override Reason</Label>
          <Textarea
            id="admin-discharge-override-reason"
            value={adminOverrideReason}
            onChange={(event) => setAdminOverrideReason(event.target.value)}
            placeholder="Provide the administrative rationale for overriding discharge balance blocking."
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {characterCount} / {MIN_OVERRIDE_REASON_LENGTH} minimum
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={dischargePatientMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {dischargePatientMutation.isPending ? 'Submitting Override...' : 'Confirm Override & Discharge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
