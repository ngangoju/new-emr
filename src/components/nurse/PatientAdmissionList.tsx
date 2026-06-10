'use client'

import React, { useState } from 'react'
import { useRole } from '@/hooks/useRole'
import {
  useCurrentAdmissions,
  useAdmissionDischargePrep,
  useDischargePatient,
  useWards,
  useAvailableBeds,
  useTransferPatient,
  useUpdateAdmissionDischargePrep
} from '@/hooks/useAdmissions'
import { useDischargeReadiness } from '@/hooks/useWorkflow'
import { usePrintableAfterVisitDocument } from '@/hooks/useWorkflow'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  CompactModalShell,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MedicationAdministrationDialog } from '@/components/nurse/MedicationAdministrationDialog'
import {
  Users,
  LogOut,
  ArrowRightLeft,
  Loader2,
  Bed,
  Building2,
  User,
  Eye,
  EyeOff,
  ClipboardCheck,
  Syringe
} from 'lucide-react'
import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid
} from 'date-fns'
import type { Admission } from '@/types/admission'
import { maskIdentifier, type RevealedIdsMap } from '@/lib/utils/masking'

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return '-'
    return format(date, 'MMM dd, yyyy HH:mm')
  } catch {
    return '-'
  }
}

function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = parseISO(dateString)
    if (!isValid(date)) return '-'
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return '-'
  }
}

function getAdmissionDisplayName(admission: Admission): string {
  const name = admission.patientName?.trim()
  if (name) return name

  const nationalId = admission.patientNationalId?.trim()
  if (nationalId) return nationalId

  return admission.patientId || 'Unknown'
}

function getAdmissionDisplayId(
  admission: Admission,
  revealedIds: RevealedIdsMap
): { displayValue: string | null; isRevealed: boolean; canReveal: boolean } {
  const nationalId = admission.patientNationalId?.trim()
  const patientId = admission.patientId?.trim()

  const rawId = nationalId || patientId
  if (!rawId) return { displayValue: null, isRevealed: false, canReveal: false }

  const isRevealed = revealedIds[admission.id] || false
  const maskedValue = maskIdentifier(rawId)

  // Only allow reveal if there's an actual ID to mask (not just patient UUID)
  const canReveal = !!nationalId

  return {
    displayValue: isRevealed ? rawId : (maskedValue || rawId),
    isRevealed,
    canReveal
  }
}

export function PatientAdmissionList() {
  const { hasPermission } = useRole()
  const { data: admissions, isLoading } = useCurrentAdmissions()
  const { data: wards } = useWards()
  const { data: availableBeds } = useAvailableBeds()
  const dischargePatient = useDischargePatient()
  const transferPatient = useTransferPatient()

  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [prepDialogOpen, setPrepDialogOpen] = useState(false)
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false)
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null)
  const [dischargeNotes, setDischargeNotes] = useState('')
  const [transferWardId, setTransferWardId] = useState('')
  const [transferBedId, setTransferBedId] = useState('')
  const [revealedIds, setRevealedIds] = useState<RevealedIdsMap>({})
  const { data: dischargePrep } = useAdmissionDischargePrep(selectedAdmission?.id || '')
  const { data: dischargeReadiness } = useDischargeReadiness(selectedAdmission?.id || '')
  const { data: prepPacketDocument } = usePrintableAfterVisitDocument(selectedAdmission?.id || '')
  const updateDischargePrep = useUpdateAdmissionDischargePrep(selectedAdmission?.id || '')
  const [medicationReconciliationCompleted, setMedicationReconciliationCompleted] = useState(false)
  const [patientEducationCompleted, setPatientEducationCompleted] = useState(false)
  const [dischargeInstructions, setDischargeInstructions] = useState('')
  const [nursingProgressNotes, setNursingProgressNotes] = useState('')

  const toggleIdReveal = (id: string) => {
    setRevealedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const canDischarge = hasPermission('CAN_DISCHARGE') || hasPermission('admission:discharge:financial')
  const canTransfer = hasPermission('CAN_TRANSFER') || hasPermission('admission:transfer')
  const canDocumentMedicationAdministration =
    hasPermission('route:/dashboard/nurse/admissions')
    || hasPermission('menu:/dashboard/nurse/admissions')
    || canDischarge
    || canTransfer

  const handleDischarge = async () => {
    if (!selectedAdmission) return
    try {
      await dischargePatient.mutateAsync({
        id: selectedAdmission.id,
        dischargeNotes
      })
      setDischargeDialogOpen(false)
      setSelectedAdmission(null)
      setDischargeNotes('')
    } catch (error) {
      console.error('Discharge error:', error)
    }
  }

  const handleTransfer = async () => {
    if (!selectedAdmission || !transferBedId) return
    try {
      await transferPatient.mutateAsync({
        id: selectedAdmission.id,
        dto: {
          newBedId: transferBedId,
          reason: dischargeNotes
        }
      })
      setTransferDialogOpen(false)
      setSelectedAdmission(null)
      setTransferWardId('')
      setTransferBedId('')
      setDischargeNotes('')
    } catch (error) {
      console.error('Transfer error:', error)
    }
  }

  const openDischargeDialog = (admission: Admission) => {
    setSelectedAdmission(admission)
    setDischargeDialogOpen(true)
  }

  const openTransferDialog = (admission: Admission) => {
    setSelectedAdmission(admission)
    setTransferWardId(admission.wardId)
    setTransferDialogOpen(true)
  }

  const openPrepDialog = (admission: Admission) => {
    setSelectedAdmission(admission)
    setPrepDialogOpen(true)
  }

  const openMedicationDialog = (admission: Admission) => {
    setSelectedAdmission(admission)
    setMedicationDialogOpen(true)
  }

  const handleSavePrep = async () => {
    if (!selectedAdmission) return
    try {
      await updateDischargePrep.mutateAsync({
        medicationReconciliationCompleted,
        patientEducationCompleted,
        dischargeInstructions,
        nursingProgressNotes,
      })
      setPrepDialogOpen(false)
    } catch (error) {
      console.error('Discharge prep error:', error)
    }
  }

  React.useEffect(() => {
    setMedicationReconciliationCompleted(Boolean(dischargePrep?.medicationReconciliationCompleted))
    setPatientEducationCompleted(Boolean(dischargePrep?.patientEducationCompleted))
    setDischargeInstructions(dischargePrep?.dischargeInstructions || '')
    setNursingProgressNotes(dischargePrep?.nursingProgressNotes || '')
  }, [dischargePrep])

  // Filter beds by selected ward for transfer
  const transferBeds = transferWardId 
    ? availableBeds?.filter(bed => bed.wardId === transferWardId && bed.id !== selectedAdmission?.bedId)
    : []

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading admissions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Inpatients
          </CardTitle>
          <CardDescription>
            Patients currently admitted to wards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!admissions || admissions.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bed className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No patients currently admitted</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Ward / Bed</TableHead>
                  <TableHead>Admitted</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admissions.map((admission) => {
                  const idInfo = getAdmissionDisplayId(admission, revealedIds)
                  return (
                  <TableRow key={admission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{getAdmissionDisplayName(admission)}</span>
                          {idInfo.displayValue && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              ID: {idInfo.displayValue}
                              {idInfo.canReveal && (
                                <button
                                  onClick={() => toggleIdReveal(admission.id)}
                                  className="ml-1 p-0.5 hover:bg-muted rounded-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  title={idInfo.isRevealed ? 'Hide ID' : 'Reveal full ID'}
                                >
                                  {idInfo.isRevealed ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {admission.wardName || 'Unknown Ward'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Bed className="h-3 w-3" />
                          Bed {admission.bedNumber || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDate(admission.admittedAt)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(admission.admittedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{admission.reason}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {admission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canDocumentMedicationAdministration && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMedicationDialog(admission)}
                          >
                            <Syringe className="h-4 w-4 mr-1" />
                            MAR
                          </Button>
                        )}
                        {canDischarge && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPrepDialog(admission)}
                          >
                            <ClipboardCheck className="h-4 w-4 mr-1" />
                            Prep
                          </Button>
                        )}
                        {canDischarge && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDischargeDialog(admission)}
                          >
                            <LogOut className="h-4 w-4 mr-1" />
                            Discharge
                          </Button>
                        )}
                        {canTransfer && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTransferDialog(admission)}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            Transfer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Discharge Dialog */}
      <Dialog open={dischargeDialogOpen} onOpenChange={setDischargeDialogOpen}>
        <CompactModalShell>
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Discharge Patient</DialogTitle>
              <DialogDescription>
                Are you sure you want to discharge this patient?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedAdmission && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Patient:</strong> {getAdmissionDisplayName(selectedAdmission)}</p>
                <p><strong>Ward:</strong> {selectedAdmission.wardName}</p>
                <p><strong>Bed:</strong> {selectedAdmission.bedNumber}</p>
                <p><strong>Admitted:</strong> {formatDate(selectedAdmission.admittedAt)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="dischargeNotes">Discharge Notes</Label>
              <Textarea
                id="dischargeNotes"
                placeholder="Add any discharge notes..."
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
            <Button variant="outline" onClick={() => setDischargeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDischarge} 
              disabled={dischargePatient.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {dischargePatient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Discharging...
                </>
              ) : (
                'Confirm Discharge'
              )}
            </Button>
          </DialogFooter>
        </CompactModalShell>
      </Dialog>

      <MedicationAdministrationDialog
        admission={selectedAdmission}
        open={medicationDialogOpen}
        onOpenChange={setMedicationDialogOpen}
      />

      <Dialog open={prepDialogOpen} onOpenChange={setPrepDialogOpen}>
        <CompactModalShell className="sm:!max-w-[700px]">
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Discharge Preparation</DialogTitle>
              <DialogDescription>
                Complete the nurse-owned discharge tasks before final discharge clearance.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="med-rec"
                checked={medicationReconciliationCompleted}
                disabled
                onCheckedChange={() => undefined}
              />
              <Label htmlFor="med-rec">Medication reconciliation completed by doctor</Label>
            </div>
            {dischargePrep?.medicationHandoffSummary ? (
              <div className="space-y-2">
                <Label>Medication Handoff Summary</Label>
                <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {dischargePrep.medicationHandoffSummary}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Medication reconciliation is completed in the doctor discharge workspace and will appear here once finalized.
              </p>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="education"
                checked={patientEducationCompleted}
                onCheckedChange={(checked) => setPatientEducationCompleted(Boolean(checked))}
              />
              <Label htmlFor="education">Patient education completed</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dischargeInstructions">Discharge Instructions</Label>
              <Textarea
                id="dischargeInstructions"
                value={dischargeInstructions}
                onChange={(event) => setDischargeInstructions(event.target.value)}
                placeholder="Medication use, return precautions, transport and follow-up guidance..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nursingProgressNotes">Nursing Progress Notes</Label>
              <Textarea
                id="nursingProgressNotes"
                value={nursingProgressNotes}
                onChange={(event) => setNursingProgressNotes(event.target.value)}
                placeholder="Shift handoff, patient education details, discharge prep notes..."
              />
            </div>
            {dischargeReadiness && (
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-sm font-medium">Current blockers</p>
                <div className="mt-2 space-y-1">
                  {dischargeReadiness.blockers.length ? dischargeReadiness.blockers.map((blocker) => (
                    <p key={blocker} className="text-sm text-muted-foreground">{blocker}</p>
                  )) : <p className="text-sm text-emerald-700">No blockers right now.</p>}
                </div>
              </div>
            )}
            {prepPacketDocument ? (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discharge Packet Awareness</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    prepPacketDocument.medicationReconciledAt
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {prepPacketDocument.medicationReconciledAt
                      ? `Reconciliation complete${prepPacketDocument.medicationReconciledByName ? ` by ${prepPacketDocument.medicationReconciledByName}` : ''}`
                      : 'Medication reconciliation incomplete'}
                  </span>
                  {prepPacketDocument.reissueRequired ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-semibold">
                      Packet reissue pending — reception action needed
                    </span>
                  ) : prepPacketDocument.lastExportedVersion ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold">
                      Packet matches export v{prepPacketDocument.lastExportedVersion}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-semibold">
                      No packet exported yet
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {prepPacketDocument.reissueRequired
                    ? 'Nursing edits saved here may generate additional packet changes. Reception will handle the reissue before checkout.'
                    : 'If you add or change discharge instructions, reception may need to re-export the packet.'}
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
            <Button variant="outline" onClick={() => setPrepDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrep} disabled={updateDischargePrep.isPending}>
              {updateDischargePrep.isPending ? 'Saving...' : 'Save Preparation'}
            </Button>
          </DialogFooter>
        </CompactModalShell>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <CompactModalShell>
          <div className="px-6 py-4 border-b">
            <DialogHeader className="pr-8">
              <DialogTitle>Transfer Patient</DialogTitle>
              <DialogDescription>
                Transfer patient to a different bed or ward
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedAdmission && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>Patient:</strong> {getAdmissionDisplayName(selectedAdmission)}</p>
                <p><strong>Current:</strong> {selectedAdmission.wardName} - Bed {selectedAdmission.bedNumber}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="transferWard">Select Ward</Label>
              <Select value={transferWardId} onValueChange={setTransferWardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ward" />
                </SelectTrigger>
                <SelectContent>
                  {wards?.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name} (Floor {ward.floor})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferBed">Select Bed</Label>
              <Select 
                value={transferBedId} 
                onValueChange={setTransferBedId}
                disabled={!transferWardId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!transferWardId ? "Select ward first" : "Select available bed"} />
                </SelectTrigger>
                <SelectContent>
                  {transferBeds?.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>
                      Bed {bed.bedNumber}
                    </SelectItem>
                  ))}
                  {transferBeds?.length === 0 && transferWardId && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available beds in this ward
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transferReason">Reason for Transfer</Label>
              <Textarea
                id="transferReason"
                placeholder="Add reason for transfer..."
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t shrink-0">
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTransfer} 
              disabled={transferPatient.isPending || !transferBedId}
            >
              {transferPatient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Confirm Transfer'
              )}
            </Button>
          </DialogFooter>
        </CompactModalShell>
      </Dialog>
    </>
  )
}
