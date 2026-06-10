'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  CompactModalShell,
} from '@/components/ui/dialog'
import { useFinalizeStructuredResult } from '@/hooks/useLabOrders'
import type { LabPanelParameter } from '@/types/lab'
import toast from 'react-hot-toast'

export interface FinalizeResultModalProps {
  open: boolean
  orderId: string
  values: Record<string, string>
  criticalParameters: Array<Pick<LabPanelParameter, 'code' | 'name'>>
  onOpenChange: (open: boolean) => void
  onSubmitted?: () => void
}

export function FinalizeResultModal({
  open,
  orderId,
  values,
  criticalParameters,
  onOpenChange,
  onSubmitted,
}: FinalizeResultModalProps) {
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({})
  const { finalizeStructuredResult, finalizing } = useFinalizeStructuredResult()

  const allCriticalAcknowledged = useMemo(
    () => criticalParameters.every((parameter) => acknowledged[parameter.code]),
    [acknowledged, criticalParameters],
  )

  const hasCritical = criticalParameters.length > 0

  const handleSubmit = async () => {
    const parsedEntries = Object.entries(values)
      .filter(([, raw]) => raw.trim().length > 0)
      .map(([code, raw]) => [code, Number(raw)] as const)

    const invalidEntry = parsedEntries.find(([, numeric]) => !Number.isFinite(numeric))
    if (invalidEntry) {
      toast.error(`Value for ${invalidEntry[0]} must be numeric.`)
      return
    }

    if (hasCritical && !allCriticalAcknowledged) {
      toast.error('Acknowledge each critical parameter before finalizing.')
      return
    }

    await finalizeStructuredResult({
      orderId,
      payload: {
        values: Object.fromEntries(parsedEntries),
      },
    })

    onSubmitted?.()
    onOpenChange(false)
    setAcknowledged({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CompactModalShell>
        <div className="px-6 py-4 border-b">
          <DialogHeader className="pr-8">
            <DialogTitle>Finalize Result</DialogTitle>
            <DialogDescription>
              Submit structured parameter values and complete the lab order.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {hasCritical && (
            <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Critical parameters detected</p>
              <ul className="space-y-3 text-sm text-red-700">
                {criticalParameters.map((parameter) => (
                  <li key={parameter.code} className="space-y-2 border-t border-red-100 pt-2 first:border-0 first:pt-0">
                    <p className="font-medium">{parameter.name}</p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`ack-${parameter.code}`}
                        checked={Boolean(acknowledged[parameter.code])}
                        onCheckedChange={(checked) =>
                          setAcknowledged((current) => ({
                            ...current,
                            [parameter.code]: Boolean(checked),
                          }))
                        }
                      />
                      <Label htmlFor={`ack-${parameter.code}`}>
                        Acknowledge critical value for {parameter.name}
                      </Label>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!hasCritical && (
            <p className="text-sm text-slate-600">Review all values before finalizing.</p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={finalizing || (hasCritical && !allCriticalAcknowledged)} className="bg-blue-600 hover:bg-blue-700">
            {finalizing ? 'Finalizing...' : 'Confirm Finalize'}
          </Button>
        </DialogFooter>
      </CompactModalShell>
    </Dialog>
  )
}

