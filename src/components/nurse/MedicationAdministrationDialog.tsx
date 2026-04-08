'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import { AlertCircle, ClipboardList, Pill, Syringe, TimerReset } from 'lucide-react'
import {
  useAdmissionMedicationAdministrations,
  useAdmissionMedicationSchedule,
  useRecordMedicationAdministration
} from '@/hooks/useAdmissions'
import { useDrugRequests } from '@/hooks/useDrugRequests'
import type {
  Admission,
  MedicationAdministrationStatus,
  MedicationScheduleEntry,
  MedicationScheduleTaskStatus
} from '@/types/admission'
import type { DrugRequest, DrugRequestItem } from '@/types/pharmacy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { normalizeDrugRequestItems } from '@/lib/pharmacy/drugRequestMapping'

type MedicationOption = {
  key: string
  requestId: string
  itemIndex: number
  request: DrugRequest
  item: DrugRequestItem
}

const OUTCOME_LABELS: Record<MedicationAdministrationStatus, string> = {
  administered: 'Administered',
  held: 'Held',
  refused: 'Refused',
  missed: 'Missed',
}

function getDefaultAdministrationTime() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  try {
    return format(parseISO(value), 'MMM dd, yyyy HH:mm')
  } catch {
    return value
  }
}

function getStatusBadgeClass(status: MedicationAdministrationStatus) {
  switch (status) {
    case 'administered':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'held':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'refused':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'missed':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    default:
      return ''
  }
}

function getScheduleBadgeClass(status: MedicationScheduleTaskStatus) {
  switch (status) {
    case 'overdue':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'due':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'upcoming':
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'as_needed':
      return 'bg-violet-50 text-violet-700 border-violet-200'
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'manual_review':
      return 'bg-slate-100 text-slate-700 border-slate-200'
    default:
      return ''
  }
}

const SCHEDULE_LABELS: Record<MedicationScheduleTaskStatus, string> = {
  overdue: 'Overdue',
  due: 'Due now',
  upcoming: 'Upcoming',
  as_needed: 'As needed',
  manual_review: 'Needs review',
  completed: 'Completed',
}

export function MedicationAdministrationDialog({
  admission,
  open,
  onOpenChange,
}: {
  admission: Admission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const admissionId = admission?.id || ''
  const patientId = admission?.patientId || ''
  const { data: drugRequests = [] } = useDrugRequests({ patientId })
  const { data: administrations = [] } = useAdmissionMedicationAdministrations(admissionId)
  const { data: schedule = [] } = useAdmissionMedicationSchedule(admissionId)
  const recordAdministration = useRecordMedicationAdministration(admissionId)

  const normalizedDrugRequests = useMemo(
    () => drugRequests.map((request) => ({
      ...request,
      items: normalizeDrugRequestItems(request.items),
    })) as DrugRequest[],
    [drugRequests],
  )

  const medicationOptions = useMemo<MedicationOption[]>(
    () => normalizedDrugRequests
      .filter((request) => request.status === 'fulfilled')
      .flatMap((request) => request.items.map((item, itemIndex) => ({
        key: `${request.id}:${itemIndex}`,
        requestId: request.id,
        itemIndex,
        request,
        item,
      }))),
    [normalizedDrugRequests],
  )

  const waitingPharmacyCount = useMemo(
    () => normalizedDrugRequests.filter((request) => request.status === 'pending' || request.status === 'approved').length,
    [normalizedDrugRequests],
  )

  const administeredTodayCount = useMemo(
    () => administrations.filter((record) => {
      try {
        return record.administrationStatus === 'administered' && isToday(parseISO(record.administeredAt))
      } catch {
        return false
      }
    }).length,
    [administrations],
  )

  const [selectedMedicationKey, setSelectedMedicationKey] = useState('')
  const [administrationStatus, setAdministrationStatus] = useState<MedicationAdministrationStatus>('administered')
  const [quantity, setQuantity] = useState(1)
  const [administeredAt, setAdministeredAt] = useState(getDefaultAdministrationTime())
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  
  // BCMA Fields
  const [scannedPatientBarcode, setScannedPatientBarcode] = useState('')
  const [scannedMedicationBarcode, setScannedMedicationBarcode] = useState('')

  const selectedMedication = useMemo(
    () => medicationOptions.find((option) => option.key === selectedMedicationKey) || null,
    [medicationOptions, selectedMedicationKey],
  )

  const scheduleByKey = useMemo(
    () => new Map(schedule.map((entry) => [`${entry.drugRequestId}:${entry.drugRequestItemIndex}`, entry])),
    [schedule],
  )

  const sortedSchedule = useMemo(
    () => [...schedule].sort((left, right) => {
      const priority = ['overdue', 'due', 'upcoming', 'as_needed', 'manual_review', 'completed']
      const leftIndex = priority.indexOf(left.taskStatus)
      const rightIndex = priority.indexOf(right.taskStatus)
      if (leftIndex !== rightIndex) return leftIndex - rightIndex
      return (left.nextDueAt || '').localeCompare(right.nextDueAt || '')
    }),
    [schedule],
  )

  const scheduleCounts = useMemo(() => ({
    overdue: schedule.filter((entry) => entry.taskStatus === 'overdue').length,
    due: schedule.filter((entry) => entry.taskStatus === 'due').length,
    upcoming: schedule.filter((entry) => entry.taskStatus === 'upcoming').length,
    asNeeded: schedule.filter((entry) => entry.taskStatus === 'as_needed').length,
  }), [schedule])

  const selectedScheduleEntry = selectedMedication ? scheduleByKey.get(selectedMedication.key) || null : null

  useEffect(() => {
    if (!open) return

    const firstScheduleOption = sortedSchedule.find((entry) => entry.taskStatus === 'overdue' || entry.taskStatus === 'due')
    const preferredKey = firstScheduleOption
      ? `${firstScheduleOption.drugRequestId}:${firstScheduleOption.drugRequestItemIndex}`
      : medicationOptions[0]?.key
    setSelectedMedicationKey((current) => {
      if (current && medicationOptions.some((option) => option.key === current)) {
        return current
      }
      return preferredKey || ''
    })
    setAdministeredAt(getDefaultAdministrationTime())
    setAdministrationStatus('administered')
    setNotes('')
    setReason('')
  }, [open, medicationOptions, sortedSchedule])

  useEffect(() => {
    if (!selectedMedication) {
      setQuantity(1)
      return
    }
    setQuantity(Math.max(selectedMedication.item.quantity || 1, 1))
  }, [selectedMedication])

  const handleRecord = async () => {
    if (!selectedMedication || !admissionId) return

    await recordAdministration.mutateAsync({
      drugRequestId: selectedMedication.requestId,
      drugRequestItemIndex: selectedMedication.itemIndex,
      quantity,
      administrationStatus,
      administeredAt,
      notes,
      reason,
      scannedPatientBarcode,
      scannedMedicationBarcode,
    })

    setNotes('')
    setReason('')
    setScannedPatientBarcode('')
    setScannedMedicationBarcode('')
    setAdministrationStatus('administered')
    setAdministeredAt(getDefaultAdministrationTime())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Medication Administration Record
          </DialogTitle>
          <DialogDescription>
            Review what pharmacy has dispensed for this inpatient and document what happened at the bedside.
          </DialogDescription>
        </DialogHeader>

        {admission && (
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Overdue Doses</CardDescription>
                <CardTitle className="text-2xl">{scheduleCounts.overdue}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Due Now</CardDescription>
                <CardTitle className="text-2xl">{scheduleCounts.due}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Administered Today</CardDescription>
                <CardTitle className="text-2xl">{administeredTodayCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Waiting On Pharmacy</CardDescription>
                <CardTitle className="text-2xl">{waitingPharmacyCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Medication Event</CardTitle>
              <CardDescription>
                Record each administration, refusal, hold, or missed dose against the dispensed pharmacy line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 rounded-lg border bg-blue-50/50 p-4 border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="scanned-patient" className="text-blue-900 font-semibold flex items-center gap-2">
                    Patient Wristband Scan
                  </Label>
                  <Input 
                    id="scanned-patient"
                    placeholder="Scan patient wristband..."
                    value={scannedPatientBarcode}
                    onChange={e => setScannedPatientBarcode(e.target.value)}
                    className="border-blue-300 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scanned-medication" className="text-blue-900 font-semibold flex items-center gap-2">
                    Medication Barcode Scan
                  </Label>
                  <Input 
                    id="scanned-medication"
                    placeholder="Scan dispensed medication batch..."
                    value={scannedMedicationBarcode}
                    onChange={e => setScannedMedicationBarcode(e.target.value)}
                    className="border-blue-300 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              {medicationOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No dispensed medications are ready for this patient yet. Pharmacy needs to fulfill the order first.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="medication-line">Medication Line</Label>
                    <Select value={selectedMedicationKey} onValueChange={setSelectedMedicationKey}>
                      <SelectTrigger id="medication-line">
                        <SelectValue placeholder="Select a dispensed medication line" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicationOptions.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.item.drugName} · {option.item.dose || 'No dose'} · {option.item.route || 'Route N/A'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMedication && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      <div className="font-medium">{selectedMedication.item.drugName}</div>
                      <div className="mt-1 text-muted-foreground">
                        {selectedMedication.item.dose || 'Dose not documented'} · {selectedMedication.item.route || 'Route not documented'} · {selectedMedication.item.frequency || 'Frequency not documented'}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Dispensed from request {selectedMedication.request.requestedAtFormatted || formatDateTime(selectedMedication.request.requestedAt)}
                      </div>
                      {selectedScheduleEntry && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn(getScheduleBadgeClass(selectedScheduleEntry.taskStatus))}>
                            {SCHEDULE_LABELS[selectedScheduleEntry.taskStatus]}
                          </Badge>
                          {selectedScheduleEntry.nextDueAt && (
                            <span className="text-xs text-muted-foreground">
                              Next dose {formatDateTime(selectedScheduleEntry.nextDueAt)}
                            </span>
                          )}
                          {selectedScheduleEntry.remainingDoseCount != null && (
                            <span className="text-xs text-muted-foreground">
                              {selectedScheduleEntry.remainingDoseCount} dose(s) remaining
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="administration-status">Outcome</Label>
                      <Select
                        value={administrationStatus}
                        onValueChange={(value) => setAdministrationStatus(value as MedicationAdministrationStatus)}
                      >
                        <SelectTrigger id="administration-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(event) => setQuantity(Math.max(Number(event.target.value) || 1, 1))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="administered-at">Administration Time</Label>
                    <Input
                      id="administered-at"
                      type="datetime-local"
                      value={administeredAt}
                      onChange={(event) => setAdministeredAt(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">
                      Reason {administrationStatus !== 'administered' ? '(required)' : '(optional)'}
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder={
                        administrationStatus === 'administered'
                          ? 'Optional explanation or bedside context...'
                          : 'Explain why this dose was held, refused, or missed...'
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Nursing Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Patient response, education given, follow-up plan, shift handoff details..."
                    />
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleRecord}
                    disabled={
                      recordAdministration.isPending
                      || !selectedMedication
                      || (administrationStatus !== 'administered' && !reason.trim())
                      || (administrationStatus === 'administered' && (!scannedPatientBarcode || !scannedMedicationBarcode))
                    }
                  >
                    {recordAdministration.isPending ? 'Recording...' : 'Record Medication Event'}
                  </Button>
                  
                  {administrationStatus === 'administered' && (!scannedPatientBarcode || !scannedMedicationBarcode) && (
                     <div className="text-sm text-center text-amber-600 font-medium">
                       Patient and medication barcodes must be scanned to document an administration.
                     </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dose Queue</CardTitle>
              <CardDescription>
                Due and upcoming medication tasks generated from the dispensed order schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedSchedule.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No medication schedule is available for this admission yet.
                </div>
              ) : (
                <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
                  {sortedSchedule.map((entry) => {
                    const entryKey = `${entry.drugRequestId}:${entry.drugRequestItemIndex}`
                    return (
                    <button
                      key={entryKey}
                      type="button"
                      onClick={() => setSelectedMedicationKey(entryKey)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/40',
                        selectedMedicationKey === entryKey && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{entry.drugName}</div>
                          <div className="text-sm text-muted-foreground">
                            {[entry.dose, entry.route, entry.frequency].filter(Boolean).join(' · ') || 'Legacy medication line'}
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(getScheduleBadgeClass(entry.taskStatus))}>
                          {SCHEDULE_LABELS[entry.taskStatus]}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        {entry.nextDueAt && (
                          <div className="flex items-center gap-2">
                            <TimerReset className="h-4 w-4" />
                            <span>{formatDateTime(entry.nextDueAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          <span>
                            {entry.documentedDoseCount} documented
                            {entry.totalPlannedDoses != null ? ` / ${entry.totalPlannedDoses} planned` : ''}
                          </span>
                        </div>
                        {entry.lastAdministrationStatus && (
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            <span>Last event: {OUTCOME_LABELS[entry.lastAdministrationStatus]}</span>
                          </div>
                        )}
                        {!entry.nextDueAt && entry.taskStatus === 'as_needed' && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            <span>PRN medication. Document when clinically indicated.</span>
                          </div>
                        )}
                      </div>
                    </button>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Medication Events</CardTitle>
              <CardDescription>
                The latest bedside medication documentation for this admission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {administrations.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No medication administration events documented for this admission yet.
                </div>
              ) : (
                <div className="max-h-[190px] space-y-3 overflow-y-auto pr-1">
                  {administrations.map((record) => (
                    <div key={record.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{record.drugName}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.dose || 'Dose N/A'} · {record.route || 'Route N/A'} · Qty {record.quantity}
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(getStatusBadgeClass(record.administrationStatus))}>
                          {OUTCOME_LABELS[record.administrationStatus]}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4" />
                          <span>{formatDateTime(record.administeredAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          <span>{record.documentedByName || 'Nurse documentation'}</span>
                        </div>
                        {record.reason && (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            <span>{record.reason}</span>
                          </div>
                        )}
                        {record.notes && (
                          <p className="rounded bg-muted/50 p-2 text-foreground">{record.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
