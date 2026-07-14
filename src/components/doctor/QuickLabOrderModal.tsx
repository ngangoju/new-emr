'use client'

import { useMemo, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  CompactModalShell,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateLabOrder } from '@/hooks/useLabOrders'

interface QuickLabOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  consultId: string
  patientName?: string
}

const COMMON_LAB_TESTS = [
  'Complete Blood Count (CBC)',
  'Blood Glucose',
  'Urinalysis',
  'Liver Function Test',
  'Kidney Function Test',
  'Malaria Test',
  'HIV Rapid Test',
  'CRP',
]

export function QuickLabOrderModal({
  open,
  onOpenChange,
  patientId,
  consultId,
  patientName,
}: QuickLabOrderModalProps) {
  const createLabOrder = useCreateLabOrder()
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [customTests, setCustomTests] = useState('')
  const [clinicalNote, setClinicalNote] = useState('')
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'STAT'>('ROUTINE')
  const [scheduledExamDate, setScheduledExamDate] = useState('')

  const allTests = useMemo(() => {
    const custom = customTests
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    return [...selectedTests, ...custom]
  }, [customTests, selectedTests])

  const toggleTest = (testName: string) => {
    setSelectedTests((current) =>
      current.includes(testName) ? current.filter((item) => item !== testName) : [...current, testName],
    )
  }

  const reset = () => {
    setSelectedTests([])
    setCustomTests('')
    setClinicalNote('')
    setPriority('ROUTINE')
    setScheduledExamDate('')
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleSubmit = async () => {
    if (allTests.length === 0) {
      toast.error('Select at least one lab test before placing the order.')
      return
    }

    try {
      await createLabOrder.mutateAsync({
        patientId,
        consultId,
        tests: clinicalNote.trim() ? `${allTests.join(', ')} | Indication: ${clinicalNote.trim()}` : allTests,
        priority,
        clinicalIndication: clinicalNote.trim() || undefined,
        scheduledExamDate: scheduledExamDate || undefined,
      })
      toast.success('Lab order created from treatment workspace.')
      reset()
      onOpenChange(false)
    } catch {
      toast.error('Failed to create lab order.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <CompactModalShell className="sm:!max-w-2xl">
        <div className="px-6 py-4 border-b">
          <DialogHeader className="pr-8">
            <div className="flex items-center justify-between gap-3 mb-2">
              <Badge variant="outline" className="bg-info-muted text-info-foreground border-info/40">
                <FlaskConical className="mr-1 h-3 w-3" />
                Quick Lab Order
              </Badge>
              {patientName ? (
                <span className="text-sm text-muted-foreground">
                  Patient: <span className="font-medium">{patientName}</span>
                </span>
              ) : null}
            </div>
            <DialogTitle>Order Lab Tests</DialogTitle>
            <DialogDescription>
              Select common panels or enter custom tests without leaving the treatment workspace.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-muted/50">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Common Tests</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {COMMON_LAB_TESTS.map((test) => (
                <label key={test} className="flex items-start gap-3 rounded-xl border bg-card p-3.5 text-sm shadow-sm hover:border-border transition-colors cursor-pointer">
                  <Checkbox
                    checked={selectedTests.includes(test)}
                    onCheckedChange={() => toggleTest(test)}
                    className="mt-0.5"
                  />
                  <span className="font-medium text-foreground">{test}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-tests" className="text-sm font-semibold text-foreground">
              Additional Tests
            </Label>
            <Input
              id="custom-tests"
              className="bg-card"
              placeholder="Enter custom tests, separated by commas"
              value={customTests}
              onChange={(event) => setCustomTests(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as 'ROUTINE' | 'URGENT' | 'STAT')}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROUTINE">ROUTINE</SelectItem>
                <SelectItem value="URGENT">URGENT</SelectItem>
                <SelectItem value="STAT">STAT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled-exam-date" className="text-sm font-semibold text-foreground">
              Schedule for date
            </Label>
            <Input
              id="scheduled-exam-date"
              className="bg-card"
              type="date"
              value={scheduledExamDate}
              onChange={(event) => setScheduledExamDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinical-note" className="text-sm font-semibold text-foreground">
              Clinical Indication
            </Label>
            <Textarea
              id="clinical-note"
              value={clinicalNote}
              onChange={(event) => setClinicalNote(event.target.value)}
              placeholder="Optional context for the lab team and downstream clinical review."
              className="min-h-24 bg-card"
            />
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">Order Preview</p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {allTests.length ? allTests.join(', ') : 'No tests selected yet.'}
            </p>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted border-t shrink-0">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={createLabOrder.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createLabOrder.isPending || allTests.length === 0} className="bg-info hover:bg-info/90">
            {createLabOrder.isPending ? 'Placing Order...' : 'Place Lab Order'}
          </Button>
        </DialogFooter>
      </CompactModalShell>
    </Dialog>
  )
}
