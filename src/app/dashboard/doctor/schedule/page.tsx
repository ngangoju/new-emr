'use client'

import React, { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays, CheckCircle2, Clock3, PlusCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { DoctorSelector } from '@/components/shared/DoctorSelector'
import {
  useAppointments,
  useCancelAppointment,
  useCompleteAppointment,
  useCreateAppointment,
  useUpdateAppointmentStatus,
} from '@/hooks/api/useAppointments'

export default function SchedulePage() {
  const { data: appointments = [], isLoading } = useAppointments()
  const createAppointment = useCreateAppointment()
  const updateStatus = useUpdateAppointmentStatus()
  const cancelAppointment = useCancelAppointment()
  const completeAppointment = useCompleteAppointment()

  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const todaysAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.filter((apt) => apt.scheduledAt?.startsWith(today))
  }, [appointments])

  const handleCreate = async () => {
    if (!patientId || !doctorId || !date || !time) {
      toast.error('Patient, doctor, date, and time are required.')
      return
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
    await createAppointment.mutateAsync(
      { patientId, doctorId, scheduledAt, reason, notes },
      {
        onSuccess: () => {
          toast.success('Appointment created.')
          setOpen(false)
          setPatientId('')
          setDoctorId('')
          setDate('')
          setTime('')
          setReason('')
          setNotes('')
        },
      },
    )
  }

  const markInProgress = (id: string) =>
    updateStatus.mutate({ id, status: 'IN_PROGRESS' }, { onSuccess: () => toast.success('Marked in progress.') })

  const markComplete = (id: string) =>
    completeAppointment.mutate(id, { onSuccess: () => toast.success('Marked completed.') })

  const markCancelled = (id: string) =>
    cancelAppointment.mutate(id, { onSuccess: () => toast.success('Appointment cancelled.') })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Schedule"
        description="Manage your appointments and availability"
      />

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Appointment</DialogTitle>
              <DialogDescription>Book a patient with a doctor and manage the queue from one place.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Patient</Label>
                <PatientSelector
                  selectedPatientId={patientId}
                  onSelect={(patient) => {
                    setPatientId(patient.id)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Doctor</Label>
                <DoctorSelector value={doctorId} onValueChange={setDoctorId} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Consultation reason" />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createAppointment.isPending}>
                {createAppointment.isPending ? 'Creating...' : 'Create Appointment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Today&apos;s Appointments
          </CardTitle>
          <CardDescription>Track and manage appointment lifecycle states.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading appointments...</p>
          ) : todaysAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Schedule is empty"
              description="You don't have any appointments scheduled for today."
            />
          ) : (
            <div className="space-y-3">
              {todaysAppointments.map((apt) => (
                <div key={apt.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="font-medium">{apt.patientName || apt.patientId}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {format(new Date(apt.scheduledAt), 'PPP p')}
                      </span>
                      <span>Status: {apt.status}</span>
                    </div>
                    {apt.reason ? <p className="text-sm mt-2">Reason: {apt.reason}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => markInProgress(apt.id)}>
                      <Clock3 className="h-4 w-4 mr-1" /> In Progress
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => markComplete(apt.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => markCancelled(apt.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
