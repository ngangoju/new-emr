'use client'

import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { uploadLabResultFile, useSubmitLabResult } from '@/hooks/useLabOrders'
import type { LabOrderDetail, SpecimenQuality } from '@/types/lab'

interface LabResultFormProps {
  order: LabOrderDetail
  onSubmitted?: () => void
}

const SPECIMEN_OPTIONS: SpecimenQuality[] = ['ADEQUATE', 'HEMOLYZED', 'LIPEMIC', 'INSUFFICIENT']

function parseRange(range: string | null | undefined) {
  if (!range) return null
  const match = range.match(/(-?\d+(?:\.\d+)?)\s*[–-]\s*(-?\d+(?:\.\d+)?)/)
  if (!match) return null
  return {
    low: Number(match[1]),
    high: Number(match[2]),
  }
}

export function LabResultForm({ order, onSubmitted }: LabResultFormProps) {
  const [resultValue, setResultValue] = useState(order.result?.resultValue ?? '')
  const [unit, setUnit] = useState(order.result?.unit ?? '')
  const [isCritical, setIsCritical] = useState(Boolean(order.result?.isCritical))
  const [criticalNote, setCriticalNote] = useState(order.result?.criticalNote ?? '')
  const [specimenQuality, setSpecimenQuality] = useState<SpecimenQuality>(
    order.result?.specimenQuality ?? 'ADEQUATE',
  )
  const [notes, setNotes] = useState(order.result?.notes ?? '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  const { submitResult, submittingResult } = useSubmitLabResult()

  const normalRangeText = order.result?.normalRangeText ?? null
  const parsedRange = useMemo(() => parseRange(normalRangeText), [normalRangeText])
  const numericValue = Number(resultValue)
  const isNumeric = resultValue.trim() !== '' && Number.isFinite(numericValue)
  const outsideNormal =
    parsedRange &&
    isNumeric &&
    (numericValue < parsedRange.low || numericValue > parsedRange.high)

  const handleSubmit = async () => {
    if (!resultValue.trim()) {
      toast.error('Result value is required.')
      return
    }

    if (isNumeric && !unit.trim()) {
      toast.error('Unit is required for numeric results.')
      return
    }

    if (isCritical && !criticalNote.trim()) {
      toast.error('Critical note is required for critical results.')
      return
    }

    try {
      let resultFiles: string[] = order.result?.resultFiles ?? []

      if (selectedFile) {
        setUploadingFile(true)
        const fileKey = await uploadLabResultFile(selectedFile)
        resultFiles = [fileKey]
      }

      await submitResult({
        orderId: order.id,
        payload: {
          resultValue: resultValue.trim(),
          unit: unit.trim(),
          isCritical,
          criticalNote: criticalNote.trim(),
          specimenQuality,
          resultFiles,
          notes: notes.trim(),
          normalRangeText: normalRangeText ?? '',
        },
      })

      onSubmitted?.()
    } catch (error) {
      console.error('Failed to submit lab result', error)
      toast.error('Failed to submit lab result.')
    } finally {
      setUploadingFile(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-5">
      <div className="space-y-2">
        <Label htmlFor="lab-result-value">Result Value</Label>
        <Input
          id="lab-result-value"
          value={resultValue}
          onChange={(event) => setResultValue(event.target.value)}
          placeholder="Enter numeric or text result"
        />
        {normalRangeText ? (
          <p className="text-sm text-muted-foreground">Normal: {normalRangeText}</p>
        ) : null}
        {outsideNormal ? (
          <p className="text-sm text-amber-600">
            Result appears outside normal range. Double-check before submitting.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lab-result-unit">Unit</Label>
        <Input
          id="lab-result-unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          placeholder="e.g. g/dL"
        />
      </div>

      <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
        <Checkbox
          id="lab-result-critical"
          checked={isCritical}
          onCheckedChange={(checked) => setIsCritical(Boolean(checked))}
        />
        <Label htmlFor="lab-result-critical" className="cursor-pointer">
          Critical value
        </Label>
      </div>

      {isCritical ? (
        <div className="space-y-2">
          <Label htmlFor="lab-critical-note">Critical Note</Label>
          <Textarea
            id="lab-critical-note"
            value={criticalNote}
            onChange={(event) => setCriticalNote(event.target.value)}
            placeholder="Describe why this value is critical and what was verified."
            className="min-h-24"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Specimen Quality</Label>
        <Select value={specimenQuality} onValueChange={(value) => setSpecimenQuality(value as SpecimenQuality)}>
          <SelectTrigger>
            <SelectValue placeholder="Select specimen quality" />
          </SelectTrigger>
          <SelectContent>
            {SPECIMEN_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lab-result-file">Result File</Label>
        <Input
          id="lab-result-file"
          type="file"
          accept=".pdf,image/*"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">Optional PDF or image upload to lab results storage.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lab-result-notes">Notes</Label>
        <Textarea
          id="lab-result-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional technician notes"
          className="min-h-24"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submittingResult || uploadingFile || order.status !== 'IN_PROGRESS'}
        className="w-full"
      >
        {uploadingFile ? 'Uploading file...' : submittingResult ? 'Submitting result...' : 'Submit Result'}
      </Button>
    </div>
  )
}
