'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader,
  DialogTitle,
  CompactModalShell
} from '@/components/ui/dialog'
import { 
  AlertTriangle, 
  Save,
  X
} from 'lucide-react'

interface ReasonForAmendmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldName: string
  oldValue: string
  newValue: string
  onConfirm: (reason: string) => void
  isLoading?: boolean
}

export function ReasonForAmendmentModal({
  open,
  onOpenChange,
  fieldName,
  oldValue,
  newValue,
  onConfirm,
  isLoading = false,
}: ReasonForAmendmentModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Reason for change is required')
      return
    }
    if (reason.length < 10) {
      setError('Please provide a more detailed reason (minimum 10 characters)')
      return
    }
    onConfirm(reason)
    setReason('')
    setError('')
  }

  const handleCancel = () => {
    setReason('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CompactModalShell className="sm:!max-w-[500px]">
        <div className="px-6 py-4 border-b">
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
              <span>Reason for Amendment</span>
            </DialogTitle>
            <DialogDescription>
              You are modifying a field that was entered by another clinician. 
              Please provide a reason for this change.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-warning-muted border-warning/40 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-foreground mt-0.5" />
              <div>
                <p className="font-medium text-warning-foreground">Clinical Amendment</p>
                <p className="text-sm text-warning mt-1">
                  All changes are logged in the audit trail with your name, timestamp, and reason.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-right text-muted-foreground">Field:</Label>
              <div className="col-span-2 font-medium">{fieldName}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-right text-muted-foreground">Original:</Label>
              <div className="col-span-2 font-mono text-sm bg-muted px-2 py-1 rounded">
                {oldValue || '(empty)'}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 items-center">
              <Label className="text-right text-muted-foreground">New:</Label>
              <div className="col-span-2 font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                {newValue || '(empty)'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Change <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="E.g., Patient reported different symptoms, device calibration error, misrecorded value..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
              rows={4}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters required. This reason will be recorded in the audit log.
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted border-t shrink-0">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </CompactModalShell>
    </Dialog>
  )
}

export default ReasonForAmendmentModal
