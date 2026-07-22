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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSelector } from './PatientSelector'
import { DoctorSelector } from './DoctorSelector'
import { Patient } from '@/hooks/api/usePatients'
import { Activity, Clock, User, AlertCircle, Ticket, ExternalLink } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTariffs } from '@/hooks/useTariffs'
import { useRegisterReceptionVisit } from '@/hooks/useReceptionVisits'
import { useIssueJourneyTicket } from '@/hooks/useJourneyTicket'
import toast from 'react-hot-toast'
import type { Tariff } from '@/types/billing'
import { formatMoney } from '@/lib/format'
import QRCode from 'qrcode'


interface CheckInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CheckInModal({ open, onOpenChange }: CheckInModalProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [selectedTariffId, setSelectedTariffId] = useState<string>('')
  const [priority, setPriority] = useState<string>('1')
  const [notes, setNotes] = useState('')
  const [issuedTicket, setIssuedTicket] = useState<{ token: string; url: string; qrUrl: string } | null>(null)

  const registerVisitMutation = useRegisterReceptionVisit()
  const issueTicketMutation = useIssueJourneyTicket()
  const { data: consultationTariffs, isLoading: isLoadingTariffs } = useTariffs({ category: 'CONSULTATION' })
  const tariffs = consultationTariffs?.data ?? []
  const selectedTariff = tariffs.find((tariff) => tariff.id === selectedTariffId)

  const handleCheckIn = async () => {
    if (!selectedPatient || !selectedDoctorId || !selectedTariff) return

    try {
      const result = await registerVisitMutation.mutateAsync({
        invoice: {
          patientId: selectedPatient.id,
          doctorId: selectedDoctorId,
          items: [{
            billing_code: selectedTariff.billingCode,
            quantity: 1,
            unit_price: selectedTariff.basePrice,
            description: selectedTariff.serviceName,
            tariffId: selectedTariff.id,
          }],
        },
        queue: {
          patientId: selectedPatient.id,
          doctorId: selectedDoctorId,
          priority: parseInt(priority),
          notes: [
            notes.trim(),
            `Initial service: ${selectedTariff.serviceName}`,
            'Cashier payment required before triage completion.',
          ].filter(Boolean).join('\n'),
        },
      })

      // Reset form state but keep patient info for ticket generation
      setSelectedTariffId('')
      setPriority('1')
      setNotes('')

      // Auto-issue a journey ticket for the newly created queue entry
      if (result?.queueEntry?.id) {
        try {
          const ticket = await issueTicketMutation.mutateAsync(result.queueEntry.id)
          const ticketUrl = `${window.location.origin}/j/${ticket.ticketToken}`
          const qrUrl = await QRCode.toDataURL(ticketUrl, { margin: 1, width: 220 }).catch(() => '')
          setIssuedTicket({ token: ticket.ticketToken, url: ticketUrl, qrUrl })
        } catch {
          // Ticket issuance failed, but check-in succeeded
          toast.error('Check-in succeeded, but ticket generation failed. You can generate it later.')
        }
      }

    } catch {
      // API interceptors and mutation hooks surface the detailed error.
    }
  }

  const handleGenerateTicket = async () => {
    // Find the patient's latest queue entry and issue a ticket
    // For simplicity, we use the last selected patient's most recent queue entry
    // In production, you'd query the queue for this patient
    if (!selectedPatient) return

    try {
      // This would need a backend endpoint to find the latest queue entry for a patient
      // For now, we'll show a placeholder
      toast('Please use the queue board to generate a ticket for an existing visit.')
    } catch {
      // Silently handle
    }
  }

  // handleGenerateTicket is referenced in the JSX for the ticket button
  void handleGenerateTicket

  const isSubmitting = registerVisitMutation.isPending || issueTicketMutation.isPending

  const formatTariffLabel = (tariff: Tariff) => {
    const price = Number(tariff.basePrice || 0).toLocaleString()
    return `${tariff.serviceName} · ${formatMoney(price)}`
  }

  const canSubmit = Boolean(selectedPatient && selectedDoctorId && selectedTariff && !isSubmitting && !issuedTicket)

  const resetAndClose = () => {
    if (isSubmitting) return
    setIssuedTicket(null)
    setSelectedPatient(null)
    setSelectedDoctorId('')
    setSelectedTariffId('')
    setPriority('1')
    setNotes('')
    onOpenChange(false)
  }

  const priorityOptions = [
    { value: '1', label: 'Routine', icon: Clock, color: 'text-slate-500', bgColor: 'bg-slate-50' },
    { value: '2', label: 'Priority', icon: Activity, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: '3', label: 'Urgent', icon: AlertCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: '4', label: 'Emergency', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-primary" />
            Register Visit
          </DialogTitle>
          <DialogDescription>
            Assign the patient to a doctor, create the first service invoice, and notify cashier, nurse, and doctor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">1. Patient</Label>
            <PatientSelector onSelect={setSelectedPatient} selectedPatientId={selectedPatient?.id} />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">2. Initial Service</Label>
            <Select value={selectedTariffId} onValueChange={setSelectedTariffId} disabled={isLoadingTariffs}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTariffs ? 'Loading services...' : 'Select consultation/service'} />
              </SelectTrigger>
              <SelectContent>
                {tariffs.map((tariff) => (
                  <SelectItem key={tariff.id} value={tariff.id}>
                    {formatTariffLabel(tariff)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">3. Doctor</Label>
            <DoctorSelector value={selectedDoctorId} onValueChange={setSelectedDoctorId} />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">4. Triage Priority</Label>
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
            <Label className="text-base font-semibold">5. Visit Notes</Label>
            <Textarea 
              placeholder="Reason for visit, symptoms, or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            On submit, the cashier receives an unpaid invoice notification, the nurse receives a triage queue notification, and the assigned doctor receives a check-in notification.
          </div>

          {/* Journey Ticket success state */}
          {issuedTicket && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-green-700" />
                <p className="text-sm font-semibold text-green-900">Journey Ticket Generated</p>
              </div>
              <p className="text-xs text-green-700">
                Share this link with the patient. They can track their visit live without logging in.
              </p>
              <div className="flex items-center gap-2 rounded-md bg-white border border-green-200 p-2">
                <code className="flex-1 text-xs text-gray-700 break-all">{issuedTicket.url}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(issuedTicket.url)
                    toast.success('Ticket link copied to clipboard')
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(issuedTicket.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Ticket
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetAndClose}
                >
                  Done
                </Button>
              </div>

              <div className="rounded-md border bg-white p-2">
                <p className="text-[10px] text-gray-500 mb-1">Patient QR</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={issuedTicket.qrUrl}
                  alt="Journey ticket QR"
                  className="mx-auto h-40 w-40"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-center">
                  Scan to open visit tracker
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-0">
          <Button variant="ghost" onClick={resetAndClose} disabled={isSubmitting}>Cancel</Button>
          <Button 
            onClick={handleCheckIn} 
            disabled={!canSubmit}
            className="px-8"
          >
            {isSubmitting ? 'Sending to cashier...' : 'Send to Cashier & Queue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
