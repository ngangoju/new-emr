'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PatientSelector } from './PatientSelector'
import { DoctorSelector } from './DoctorSelector'
import { useAddToQueue } from '@/hooks/useQueue'
import { Patient } from '@/hooks/api/usePatients'
import { Activity, Clock, User, AlertCircle } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface CheckInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckInModal({ open, onOpenChange }: CheckInModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [priority, setPriority] = useState<string>('1')
  const [notes, setNotes] = useState('')

  const checkInMutation = useAddToQueue()

  const handleCheckIn = () => {
    if (!selectedPatient || !selectedDoctorId) return

    checkInMutation.mutate({
      patientId: selectedPatient.id,
      doctorId: selectedDoctorId,
      priority: parseInt(priority),
      notes: notes,
    }, {
      onSuccess: () => {
        onOpenChange(false)
        // Reset form
        setSelectedPatient(null)
        setSelectedDoctorId('')
        setPriority('1')
        setNotes('')
      }
    })
  }

  const priorityOptions = [
    { value: '1', label: 'Routine', icon: Clock, color: 'text-slate-500', bgColor: 'bg-slate-50' },
    { value: '2', label: 'Priority', icon: Activity, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: '3', label: 'Urgent', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: '4', label: 'Emergency', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-primary" />
            Patient Check-in
          </DialogTitle>
          <DialogDescription>
            Assign a patient to a doctor's queue and set triage priority.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">1. Search Patient</Label>
            <PatientSelector onSelect={setSelectedPatient} selectedPatientId={selectedPatient?.id} />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">2. Assign Doctor</Label>
            <DoctorSelector value={selectedDoctorId} onValueChange={setSelectedDoctorId} />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">3. Triage Priority</Label>
            <RadioGroup 
              value={priority} 
              onValueChange={setPriority} 
              className="grid grid-cols-2 gap-3"
            >
              {priorityOptions.map((opt) => (
                <Label
                  key={opt.value}
                  className={`flex items-center justify-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-all ${priority === opt.value ? 'border-primary ring-1 ring-primary' : ''}`}
                >
                  <RadioGroupItem value={opt.value} className="sr-only" />
                  <div className={`h-8 w-8 rounded-full ${opt.bgColor} ${opt.color} flex items-center justify-center`}>
                    <opt.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">4. Notes (Optional)</Label>
            <Textarea 
              placeholder="Symptoms, reason for visit, or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleCheckIn} 
            disabled={!selectedPatient || !selectedDoctorId || checkInMutation.isPending}
            className="px-8"
          >
            {checkInMutation.isPending ? "Checking in..." : "Check-in Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
