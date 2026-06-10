'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  CompactModalShell,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateConsultation } from '@/hooks/api/useConsultations'

interface ClinicalAddendumModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  consultationId: string
  existingNotes?: string
}

export function ClinicalAddendumModal({
  open,
  onOpenChange,
  consultationId,
  existingNotes,
}: ClinicalAddendumModalProps) {
  const updateConsultation = useUpdateConsultation()
  const [note, setNote] = useState('')

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) setNote('')
    onOpenChange(nextOpen)
  }

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error('Enter a clinical addendum before saving.')
      return
    }

    const timestamp = new Date().toLocaleString()
    const nextNotes = [existingNotes?.trim(), `[Clinical Addendum ${timestamp}]`, note.trim()]
      .filter(Boolean)
      .join('\n\n')

    try {
      await updateConsultation.mutateAsync({
        id: consultationId,
        data: { notes: nextNotes },
      })
      toast.success('Clinical addendum saved to the encounter.')
      setNote('')
      onOpenChange(false)
    } catch {
      toast.error('Failed to save clinical addendum.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <CompactModalShell className="sm:!max-w-xl">
        <div className="px-6 py-4 border-b">
          <DialogHeader className="pr-8">
            <DialogTitle>Add Clinical Addendum</DialogTitle>
            <DialogDescription>
              Record a handoff note, shift update, or clarifying addendum on the current encounter.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Document the update you want the next clinician to see."
            className="min-h-40 bg-white"
          />
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={updateConsultation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateConsultation.isPending || !note.trim()}>
            {updateConsultation.isPending ? 'Saving...' : 'Save Addendum'}
          </Button>
        </DialogFooter>
      </CompactModalShell>
    </Dialog>
  )
}
