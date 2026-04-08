'use client'

import { useMemo, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
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

        <div className="space-y-5 py-2">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Common Tests</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {COMMON_LAB_TESTS.map((test) => (
                <label key={test} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                  <Checkbox
                    checked={selectedTests.includes(test)}
                    onCheckedChange={() => toggleTest(test)}
                    className="mt-0.5"
                  />
                  <span>{test}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-tests" className="text-sm font-semibold">
              Additional Tests
            </Label>
            <Input
              id="custom-tests"
              placeholder="Enter custom tests, separated by commas"
              value={customTests}
              onChange={(event) => setCustomTests(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinical-note" className="text-sm font-semibold">
              Clinical Indication
            </Label>
            <Textarea
              id="clinical-note"
              value={clinicalNote}
              onChange={(event) => setClinicalNote(event.target.value)}
              placeholder="Optional context for the lab team and downstream clinical review."
              className="min-h-24"
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">Order Preview</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {allTests.length ? allTests.join(', ') : 'No tests selected yet.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={createLabOrder.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createLabOrder.isPending || allTests.length === 0}>
            {createLabOrder.isPending ? 'Placing Order...' : 'Place Lab Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
