'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { format, isToday, parseISO } from 'date-fns'
import { AlertCircle, CheckCircle2, Clock, ClipboardList, Pill, ScanLine, Syringe, TimerReset } from 'lucide-react'
import {
  useAdmissionMedicationAdministrations,
  useAdmissionMedicationSchedule,
  useRecordMedicationAdministration
} from '@/hooks/useAdmissions'
import { useDrugRequests } from '@/hooks/useDrugRequests'
import type {
  Admission,
  MedicationAdministrationStatus,
  MedicationScheduleTaskStatus
} from '@/types/admission'
import type { DrugRequest, DrugRequestItem } from '@/types/pharmacy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  WorkspaceModalShell,
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <WorkspaceModalShell>
        <DialogHeader className="px-6 py-4 border-b pr-14">
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Medication Administration Record
          </DialogTitle>
          <DialogDescription>
            Review what pharmacy has dispensed for this inpatient and document what happened at the bedside.
          </DialogDescription>
        </DialogHeader>

        {/* ─── Scrollable Body ─── */}
        {admission && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/50">

            {/* ── KPI Stats Row ── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{scheduleCounts.overdue}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Now</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{scheduleCounts.due}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Given Today</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{administeredTodayCount}</p>
              </div>
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pharmacy Queue</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{waitingPharmacyCount}</p>
              </div>
            </div>

            {/* ── Two Column Layout ── */}
            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">

              {/* ── Left: Documentation Form ── */}
              <div className="flex flex-col gap-6 min-w-0">

                {/* BCMA Barcode Scanning */}
                <div className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ScanLine className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">Barcode Verification</p>
                      <p className="text-[11px] text-muted-foreground">Scan patient wristband and medication barcode before recording</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="scanned-patient" className="text-xs font-semibold">
                        Patient Wristband
                      </Label>
                      <Input 
                        id="scanned-patient"
                        placeholder="Scan wristband..."
                        value={scannedPatientBarcode}
                        onChange={e => setScannedPatientBarcode(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="scanned-medication" className="text-xs font-semibold">
                        Medication Barcode
                      </Label>
                      <Input 
                        id="scanned-medication"
                        placeholder="Scan medication..."
                        value={scannedMedicationBarcode}
                        onChange={e => setScannedMedicationBarcode(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Administration Form */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">Document Medication Event</p>
                      <p className="text-[11px] text-muted-foreground">Record administration, refusal, hold, or missed dose</p>
                    </div>
                  </div>

                  {medicationOptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 mb-3 text-slate-300">
                        <Pill className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">No dispensed medications</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">Pharmacy needs to fulfill the order before you can document administration events.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="medication-line" className="text-xs font-semibold text-slate-700">Medication Line</Label>
                        <Select value={selectedMedicationKey} onValueChange={setSelectedMedicationKey}>
                          <SelectTrigger id="medication-line" className="h-10">
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
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{selectedMedication.item.drugName}</p>
                              <p className="mt-1 text-sm text-slate-500">
                                {selectedMedication.item.dose || 'Dose N/A'} · {selectedMedication.item.route || 'Route N/A'} · {selectedMedication.item.frequency || 'Freq N/A'}
                              </p>
                            </div>
                            {selectedScheduleEntry && (
                              <Badge variant="outline" className={cn('shrink-0', getScheduleBadgeClass(selectedScheduleEntry.taskStatus))}>
                                {SCHEDULE_LABELS[selectedScheduleEntry.taskStatus]}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span>Dispensed {selectedMedication.request.requestedAtFormatted || formatDateTime(selectedMedication.request.requestedAt)}</span>
                            {selectedScheduleEntry?.nextDueAt && (
                              <span>Next dose {formatDateTime(selectedScheduleEntry.nextDueAt)}</span>
                            )}
                            {selectedScheduleEntry?.remainingDoseCount != null && (
                              <span>{selectedScheduleEntry.remainingDoseCount} dose(s) left</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="administration-status" className="text-xs font-semibold text-slate-700">Outcome</Label>
                          <Select
                            value={administrationStatus}
                            onValueChange={(value) => setAdministrationStatus(value as MedicationAdministrationStatus)}
                          >
                            <SelectTrigger id="administration-status" className="h-10">
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
                        <div className="space-y-1.5">
                          <Label htmlFor="quantity" className="text-xs font-semibold text-slate-700">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min={1}
                            className="h-10"
                            value={quantity}
                            onChange={(event) => setQuantity(Math.max(Number(event.target.value) || 1, 1))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="administered-at" className="text-xs font-semibold text-slate-700">Time</Label>
                          <Input
                            id="administered-at"
                            type="datetime-local"
                            className="h-10"
                            value={administeredAt}
                            onChange={(event) => setAdministeredAt(event.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                          Reason {administrationStatus !== 'administered' ? <span className="text-rose-500">(required)</span> : <span className="text-slate-400">(optional)</span>}
                        </Label>
                        <Textarea
                          id="reason"
                          rows={2}
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder={
                            administrationStatus === 'administered'
                              ? 'Optional explanation or bedside context...'
                              : 'Explain why this dose was held, refused, or missed...'
                          }
                          className="resize-none text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">Nursing Notes</Label>
                        <Textarea
                          id="notes"
                          rows={2}
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Patient response, education given, follow-up plan..."
                          className="resize-none text-sm"
                        />
                      </div>

                      <Button
                        className="w-full h-10 mt-2"
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
                         <div className="flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
                           <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                           Both barcodes must be scanned to document an administration.
                         </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: Queue + History ── */}
              <div className="flex flex-col gap-6 min-w-0">

                {/* Dose Queue */}
                <div className="flex flex-col rounded-xl border bg-card shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-card-foreground">Dose Queue</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">
                      {sortedSchedule.length} {sortedSchedule.length === 1 ? 'Task' : 'Tasks'}
                    </Badge>
                  </div>
                  <div className="p-4">
                    {sortedSchedule.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-muted/30">
                        <div className="mb-3 text-muted-foreground">
                          <Clock className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No scheduled tasks</p>
                        <p className="text-xs text-muted-foreground mt-1">Medication schedule will appear once pharmacy fulfills orders.</p>
                      </div>
                    ) : (
                      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {sortedSchedule.map((entry) => {
                          const entryKey = `${entry.drugRequestId}:${entry.drugRequestItemIndex}`
                          return (
                          <button
                            key={entryKey}
                            type="button"
                            onClick={() => setSelectedMedicationKey(entryKey)}
                            className={cn(
                              'w-full rounded-lg border p-3.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground',
                              selectedMedicationKey === entryKey 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                : 'border-border'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-sm truncate">{entry.drugName}</p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                  {[entry.dose, entry.route, entry.frequency].filter(Boolean).join(' · ') || 'Legacy medication line'}
                                </p>
                              </div>
                              <Badge variant="outline" className={cn('shrink-0 text-[10px]', getScheduleBadgeClass(entry.taskStatus))}>
                                {SCHEDULE_LABELS[entry.taskStatus]}
                              </Badge>
                            </div>
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                              {entry.nextDueAt && (
                                <span className="flex items-center gap-1">
                                  <TimerReset className="h-3 w-3" />
                                  {formatDateTime(entry.nextDueAt)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" />
                                {entry.documentedDoseCount} documented{entry.totalPlannedDoses != null ? ` / ${entry.totalPlannedDoses}` : ''}
                              </span>
                              {entry.lastAdministrationStatus && (
                                <span className="flex items-center gap-1">
                                  <Pill className="h-3 w-3" />
                                  Last: {OUTCOME_LABELS[entry.lastAdministrationStatus]}
                                </span>
                              )}
                              {!entry.nextDueAt && entry.taskStatus === 'as_needed' && (
                                <span className="flex items-center gap-1 text-violet-500">
                                  <AlertCircle className="h-3 w-3" />
                                  PRN — document when indicated
                                </span>
                              )}
                            </div>
                          </button>
                        )})}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Events */}
                <div className="flex flex-col rounded-xl border bg-card shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-card-foreground">Recent Events</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">
                      {administrations.length} {administrations.length === 1 ? 'Record' : 'Records'}
                    </Badge>
                  </div>
                  <div className="p-4">
                    {administrations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-muted/30">
                        <div className="mb-3 text-muted-foreground">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No events documented</p>
                        <p className="text-xs text-muted-foreground mt-1">Record your first administration event above.</p>
                      </div>
                    ) : (
                      <div className="max-h-[260px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {administrations.map((record) => (
                          <div key={record.id} className="rounded-lg border p-3.5 hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-sm truncate">{record.drugName}</p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {record.dose || 'Dose N/A'} · {record.route || 'Route N/A'} · Qty {record.quantity}
                                </p>
                              </div>
                              <Badge variant="outline" className={cn('shrink-0 text-[10px]', getStatusBadgeClass(record.administrationStatus))}>
                                {OUTCOME_LABELS[record.administrationStatus]}
                              </Badge>
                            </div>
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <ClipboardList className="h-3 w-3" />
                                {formatDateTime(record.administeredAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Pill className="h-3 w-3" />
                                {record.documentedByName || 'Nurse'}
                              </span>
                            </div>
                            {record.reason && (
                              <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                <span className="font-medium text-slate-600">Reason:</span> {record.reason}
                              </p>
                            )}
                            {record.notes && (
                              <p className="mt-2 text-xs text-slate-600 bg-indigo-50/50 rounded-lg px-3 py-2 border border-indigo-100/50">
                                {record.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </WorkspaceModalShell>
    </Dialog>
  )
}
