'use client'

import { useEffect, useState } from 'react'
import { Activity, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { useCreatePatientVitals, usePatient } from '@/hooks/api/usePatients'
import { useInvoices } from '@/hooks/useInvoices'
import type { Patient } from '@/hooks/api/usePatients'
import type { Invoice } from '@/types/billing'
import { calculateMews, mewsToAcuityColor } from '@/lib/clinical/mews'

type AvpuOption = 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE'

const defaultPatient: Patient = {
  id: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
}

type InitialInvoiceGateInput = Pick<Invoice, 'paymentStatus' | 'patientDue' | 'insuranceDue' | 'total'> & {
  invoiceDate?: Invoice['invoiceDate'] | null
  createdAt?: Invoice['createdAt'] | string | null
  payments?: Array<{ amount?: number | string | null }> | null
}

function getEffectivePatientDue(invoice: InitialInvoiceGateInput) {
  const total = Number(invoice.total ?? 0)
  const patientDue = Number(invoice.patientDue ?? 0)
  const insuranceDue = Number(invoice.insuranceDue ?? 0)
  const hasLegacyUnsplitTotal = total > 0 && patientDue <= 0 && insuranceDue <= 0

  return hasLegacyUnsplitTotal ? total : patientDue
}

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function shouldHoldTriageForInitialInvoice(invoice: InitialInvoiceGateInput, today = new Date()) {
  const dateSource = invoice.invoiceDate ?? invoice.createdAt
  if (!dateSource) return false

  const invoiceDate = dateSource instanceof Date
    ? dateSource
    : new Date(dateSource)

  if (Number.isNaN(invoiceDate.getTime()) || utcDateKey(invoiceDate) !== utcDateKey(today)) {
    return false
  }

  const paymentStatus = String(invoice.paymentStatus ?? '').toUpperCase()
  const patientDue = getEffectivePatientDue(invoice)

  if (!Number.isFinite(patientDue) || patientDue <= 0) {
    return false
  }

  if (paymentStatus === 'UNPAID') {
    return true
  }

  if (paymentStatus === 'PARTIAL' && Array.isArray(invoice.payments) && invoice.payments.length > 0) {
    const totalPaid = invoice.payments.reduce((sum, payment) => {
      const amount = Number(payment.amount ?? 0)
      return Number.isFinite(amount) ? sum + amount : sum
    }, 0)

    return totalPaid < patientDue
  }

  return paymentStatus === 'PARTIAL'
}

interface NurseVitalsFormProps {
  initialPatientId?: string
}

export function NurseVitalsForm({ initialPatientId = '' }: NurseVitalsFormProps) {
  const [patient, setPatient] = useState<Patient>(defaultPatient)
  const [temperature, setTemperature] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [respiratoryRate, setRespiratoryRate] = useState('')
  const [oxygenSaturation, setOxygenSaturation] = useState('')
  const [painScore, setPainScore] = useState('')
  const [avpu, setAvpu] = useState<AvpuOption>('ALERT')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [triageNote, setTriageNote] = useState('')
  const [triageDisposition, setTriageDisposition] = useState('WAIT_FOR_DOCTOR')

  const { mutateAsync: createPatientVitals, isPending } = useCreatePatientVitals()
  const { data: initialPatient } = usePatient(initialPatientId)
  const { pending: pendingInvoices, loading: invoicesLoading } = useInvoices({
    patientId: patient.id,
    enabled: Boolean(patient.id),
  })
  const hasOutstandingInitialInvoice = pendingInvoices.some((invoice) => shouldHoldTriageForInitialInvoice(invoice))

  useEffect(() => {
    if (initialPatient?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatient(initialPatient)
    }
  }, [initialPatient])

  const handleSubmit = async () => {
    if (!patient.id) {
      toast.error('Please select a patient before recording vitals.')
      return
    }

    if (hasOutstandingInitialInvoice) {
      toast.error('Initial service payment is still pending with cashier.')
      return
    }

    const parsedHeight = height ? Number(height) : undefined
    const parsedWeight = weight ? Number(weight) : undefined
    const computedBmi = parsedHeight && parsedWeight ? Number((parsedWeight / ((parsedHeight / 100) ** 2)).toFixed(2)) : undefined

    try {
      await createPatientVitals({
        patientId: patient.id,
        data: {
          temperature: temperature ? Number(temperature) : undefined,
          bloodPressure: bloodPressure || undefined,
          heartRate: heartRate ? Number(heartRate) : undefined,
          respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
          oxygenSaturation: oxygenSaturation ? Number(oxygenSaturation) : undefined,
          painScore: painScore ? Number(painScore) : undefined,
          avpu: avpu || undefined,
          weight: parsedWeight,
          height: parsedHeight,
          bmi: computedBmi,
          triageNote: triageNote || undefined,
          triageDisposition: triageDisposition || undefined,
        },
      })

      toast.success('Vitals recorded successfully.')
      setTemperature('')
      setBloodPressure('')
      setHeartRate('')
      setRespiratoryRate('')
      setOxygenSaturation('')
      setPainScore('')
      setAvpu('ALERT')
      setWeight('')
      setHeight('')
      setTriageNote('')
      setTriageDisposition('WAIT_FOR_DOCTOR')
    } catch (error) {
      console.error('Failed to record vitals', error)
      toast.error('Failed to record vitals.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Record Patient Vitals
        </CardTitle>
        <CardDescription>
          Capture and submit vital signs directly to the clinical record.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Patient</Label>
          <PatientSelector
            selectedPatientId={patient.id}
            selectedPatient={patient.id ? patient : null}
            onSelect={(selectedPatient) => setPatient(selectedPatient)}
          />
        </div>

        {hasOutstandingInitialInvoice && (
          <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
            <Receipt className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Waiting for cashier payment</p>
              <p className="text-yellow-800">Record triage after the initial patient payment is cleared.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature (°C)</Label>
            <Input id="temperature" type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blood-pressure">Blood Pressure</Label>
            <Input id="blood-pressure" placeholder="120/80" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heart-rate">Heart Rate (bpm)</Label>
            <Input id="heart-rate" type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resp-rate">Respiratory Rate</Label>
            <Input id="resp-rate" type="number" value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oxygen">Oxygen Saturation (%)</Label>
            <Input id="oxygen" type="number" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pain-score">Pain Score (0-10)</Label>
            <Input id="pain-score" type="number" min="0" max="10" value={painScore} onChange={(e) => setPainScore(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avpu">AVPU</Label>
            <Select value={avpu} onValueChange={(value) => setAvpu(value as AvpuOption)}>
              <SelectTrigger id="avpu" className="w-full">
                <SelectValue placeholder="Select AVPU level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALERT">Alert</SelectItem>
                <SelectItem value="VOICE">Voice</SelectItem>
                <SelectItem value="PAIN">Pain</SelectItem>
                <SelectItem value="UNRESPONSIVE">Unresponsive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input id="weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input id="height" type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="triage-disposition">Triage Disposition</Label>
            <Select value={triageDisposition} onValueChange={setTriageDisposition}>
              <SelectTrigger id="triage-disposition" className="w-full">
                <SelectValue placeholder="Select disposition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WAIT_FOR_DOCTOR">Wait for Doctor</SelectItem>
                <SelectItem value="DIRECT_TO_LAB">Direct to Lab</SelectItem>
                <SelectItem value="OBSERVATION">Observation</SelectItem>
                <SelectItem value="ADMISSION_REVIEW">Admission Review</SelectItem>
                <SelectItem value="EMERGENCY_ESCALATION">Emergency Escalation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="triage-note">Triage Note</Label>
          <Input
            id="triage-note"
            value={triageNote}
            onChange={(e) => setTriageNote(e.target.value)}
            placeholder="Brief triage summary and handoff note"
          />
        </div>

        <RealTimeMEWSDisplay
          temperature={temperature}
          bloodPressure={bloodPressure}
          heartRate={heartRate}
          respiratoryRate={respiratoryRate}
          avpu={avpu}
        />

        <Button onClick={handleSubmit} disabled={isPending || invoicesLoading || hasOutstandingInitialInvoice}>
          {isPending ? 'Saving...' : invoicesLoading ? 'Checking payment...' : 'Save Vitals'}
        </Button>
      </CardContent>
    </Card>
  )
}

function RealTimeMEWSDisplay({
  temperature,
  bloodPressure,
  heartRate,
  respiratoryRate,
  avpu,
}: {
  temperature: string
  bloodPressure: string
  heartRate: string
  respiratoryRate: string
  avpu: AvpuOption
}) {
  const mewsScore = calculateMews({
    temperature: temperature ? Number(temperature) : undefined,
    bloodPressure: bloodPressure || undefined,
    heartRate: heartRate ? Number(heartRate) : undefined,
    respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
    avpu,
  })

  const acuity = mewsToAcuityColor(mewsScore)
  const acuityClass = {
    GREEN: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    YELLOW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ORANGE: 'bg-orange-100 text-orange-800 border-orange-300',
    RED: 'bg-red-100 text-red-800 border-red-300',
  }[acuity]

  return (
    <div className={`rounded-md border p-3 ${acuityClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Real-time MEWS (pre-submit)</p>
        <Badge className="font-bold" variant="secondary">
          {acuity}
        </Badge>
      </div>
      <p className="mt-1 text-sm">Current score: <span className="font-bold">{mewsScore}</span></p>
    </div>
  )
}
