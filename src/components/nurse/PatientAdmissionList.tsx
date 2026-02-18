'use client'

import React, { useState } from 'react'
import { useRole } from '@/hooks/useRole'
import { 
  useCurrentAdmissions, 
  useDischargePatient,
  useWards,
  useAvailableBeds,
  useTransferPatient 
} from '@/hooks/useAdmissions'
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
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  LogOut, 
  ArrowRightLeft, 
  Loader2, 
  Bed,
  Building2,
  Calendar,
  User
} from 'lucide-react'
import { 
  format, 
  formatDistanceToNow, 
  parseISO, 
  isValid 
} from 'date-fns'
import type { Admission } from '@/types/admission'

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

function getAdmissionDisplayId(admission: Admission): string | null {
  const nationalId = admission.patientNationalId?.trim()
  if (nationalId) return nationalId

  const patientId = admission.patientId?.trim()
  if (patientId) return patientId

  return null
}

export function PatientAdmissionList() {
  const { hasPermission } = useRole()
  const { data: admissions, isLoading, refetch } = useCurrentAdmissions()
  const { data: wards } = useWards()
  const { data: availableBeds } = useAvailableBeds()
  const dischargePatient = useDischargePatient()
  const transferPatient = useTransferPatient()

  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null)
  const [dischargeNotes, setDischargeNotes] = useState('')
  const [transferWardId, setTransferWardId] = useState('')
  const [transferBedId, setTransferBedId] = useState('')

  const canDischarge = hasPermission('CAN_DISCHARGE') || hasPermission('admission:discharge')
  const canTransfer = hasPermission('CAN_TRANSFER') || hasPermission('admission:transfer')

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
                {admissions.map((admission) => (
                  <TableRow key={admission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{getAdmissionDisplayName(admission)}</span>
                          {getAdmissionDisplayId(admission) && (
                            <span className="text-xs text-muted-foreground">
                              ID: {getAdmissionDisplayId(admission)}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Discharge Dialog */}
      <Dialog open={dischargeDialogOpen} onOpenChange={setDischargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discharge Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to discharge this patient?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          <DialogFooter>
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
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Patient</DialogTitle>
            <DialogDescription>
              Transfer patient to a different bed or ward
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          <DialogFooter>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
