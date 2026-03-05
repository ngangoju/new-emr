'use client'

import { useState } from 'react'
import { Activity } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { useCreatePatientVitals } from '@/hooks/api/usePatients'
import type { Patient } from '@/hooks/api/usePatients'
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

export function NurseVitalsForm() {
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

  const { mutateAsync: createPatientVitals, isPending } = useCreatePatientVitals()

  const handleSubmit = async () => {
    if (!patient.id) {
      toast.error('Please select a patient before recording vitals.')
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
            onSelect={(selectedPatient) => setPatient(selectedPatient)}
          />
        </div>

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

        <RealTimeMEWSDisplay
          temperature={temperature}
          bloodPressure={bloodPressure}
          heartRate={heartRate}
          respiratoryRate={respiratoryRate}
          avpu={avpu}
        />

        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Vitals'}
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
