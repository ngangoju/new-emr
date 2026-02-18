'use client'

import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { NurseBilling } from '@/components/nurse/NurseBilling'
import { DrugRequestForm } from '@/components/nurse/DrugRequestForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DoctorSelector } from '@/components/shared/DoctorSelector'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Stethoscope, Trash2 } from 'lucide-react'
import { useRole } from '@/hooks/useRole'
import { useConsultations, useCreateConsultation, useDeleteConsultation, type Consultation } from '@/hooks/api/useConsultations'

type ApiError = {
  response?: {
    data?: {
      message?: string
    }
  }
}

type CreateConsultationForm = {
  patientId: string
  doctorId: string
  type: string
  notes: string
}

const initialForm: CreateConsultationForm = {
  patientId: '',
  doctorId: '',
  type: 'General',
  notes: '',
}

export default function NurseDashboardPage() {
  const { hasPermission } = useRole()
  const canManageConsultations = hasPermission('CAN_MANAGE_CONSULTATIONS')

  const { data: consultations = [], isLoading: consultationsLoading } = useConsultations()
  const createConsultationMutation = useCreateConsultation()
  const deleteConsultationMutation = useDeleteConsultation()

  const [createForm, setCreateForm] = useState<CreateConsultationForm>(initialForm)
  const [consultationToDelete, setConsultationToDelete] = useState<Consultation | null>(null)

  const sortedConsultations = useMemo(
    () => [...consultations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [consultations],
  )

  const handleCreateConsultation = () => {
    if (!canManageConsultations) return

    if (!createForm.patientId || !createForm.doctorId) {
      toast.error('Please select patient and doctor')
      return
    }

    createConsultationMutation.mutate(
      {
        patientId: createForm.patientId,
        doctorId: createForm.doctorId,
        type: createForm.type,
        notes: createForm.notes,
      },
      {
        onSuccess: () => {
          toast.success('Consultation added successfully')
          setCreateForm(initialForm)
        },
        onError: (error: unknown) => {
          const apiError = error as ApiError
          toast.error(apiError?.response?.data?.message || 'Failed to add consultation')
        },
      },
    )
  }

  const handleDeleteConsultation = () => {
    if (!consultationToDelete || !canManageConsultations) return

    deleteConsultationMutation.mutate(consultationToDelete.id, {
      onSuccess: () => {
        toast.success('Consultation removed successfully')
        setConsultationToDelete(null)
      },
      onError: (error: unknown) => {
        const apiError = error as ApiError
        toast.error(apiError?.response?.data?.message || 'Failed to remove consultation')
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Nurse Dashboard"
        description="Manage patient billing, submit drug requests, and manage consultations."
      />
      <Tabs defaultValue="billing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="drugs">Drug Requests</TabsTrigger>
          {canManageConsultations && <TabsTrigger value="consultations">Consultations</TabsTrigger>}
        </TabsList>
        <TabsContent value="billing">
          <NurseBilling />
        </TabsContent>
        <TabsContent value="drugs">
          <DrugRequestForm />
        </TabsContent>

        {canManageConsultations && (
          <TabsContent value="consultations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Consultation</CardTitle>
                <CardDescription>Assign a patient to a doctor and capture consultation notes/type.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <PatientSelector
                    selectedPatientId={createForm.patientId}
                    onSelect={(patient) => {
                      setCreateForm((prev) => ({ ...prev, patientId: patient.id }))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <DoctorSelector
                    value={createForm.doctorId}
                    onValueChange={(value) => {
                      setCreateForm((prev) => ({ ...prev, doctorId: value }))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultation-type">Consultation Type</Label>
                  <Input
                    id="consultation-type"
                    value={createForm.type}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, type: event.target.value }))
                    }}
                    placeholder="General, Follow-up, Emergency..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultation-notes">Notes</Label>
                  <Textarea
                    id="consultation-notes"
                    value={createForm.notes}
                    onChange={(event) => {
                      setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
                    }}
                    placeholder="Add consultation notes..."
                  />
                </div>

                <Button onClick={handleCreateConsultation} disabled={createConsultationMutation.isPending}>
                  {createConsultationMutation.isPending ? 'Adding...' : 'Add Consultation'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consultations</CardTitle>
                <CardDescription>View and remove consultations when required.</CardDescription>
              </CardHeader>
              <CardContent>
                {consultationsLoading ? (
                  <div className="flex min-h-32 items-center justify-center">
                    <Spinner />
                  </div>
                ) : sortedConsultations.length === 0 ? (
                  <EmptyState
                    icon={Stethoscope}
                    title="No consultations found"
                    description="New consultations created here will appear in this list."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Created</TableHead>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Doctor ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedConsultations.map((consultation) => (
                        <TableRow key={consultation.id}>
                          <TableCell>{new Date(consultation.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{consultation.patientId}</TableCell>
                          <TableCell>{consultation.doctorId || 'N/A'}</TableCell>
                          <TableCell>{consultation.status}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setConsultationToDelete(consultation)}
                              disabled={deleteConsultationMutation.isPending}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Dialog open={!!consultationToDelete} onOpenChange={(open) => !open && setConsultationToDelete(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove consultation</DialogTitle>
                  <DialogDescription>
                    This will remove the selected consultation. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConsultationToDelete(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteConsultation} disabled={deleteConsultationMutation.isPending}>
                    {deleteConsultationMutation.isPending ? 'Removing...' : 'Confirm Remove'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}
