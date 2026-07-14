'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  CompactModalShell,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useDischargePatient } from '@/hooks/useAdmissions'
import { formatMoney } from '@/lib/format'

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!open) setAdminOverrideReason('')
  }, [open])

  const trimmedReason = adminOverrideReason.trim()
  const characterCount = trimmedReason.length
  const canSubmit = characterCount >= MIN_OVERRIDE_REASON_LENGTH && !dischargePatientMutation.isPending

  const humanReadableOutstandingAmount = useMemo(
    () => `${formatMoney(outstandingAmount)}`,
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
      <CompactModalShell>
        <div className="px-6 py-4 border-b">
          <DialogHeader className="pr-8">
            <DialogTitle>Admin Discharge Override</DialogTitle>
            <DialogDescription>
              Outstanding balance: <span className="font-semibold">{humanReadableOutstandingAmount}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
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

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={dischargePatientMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {dischargePatientMutation.isPending ? 'Submitting Override...' : 'Confirm Override & Discharge'}
          </Button>
        </DialogFooter>
      </CompactModalShell>
    </Dialog>
  )
}
