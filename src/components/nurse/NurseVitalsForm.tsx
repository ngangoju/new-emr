'use client'

import { useState } from 'react'
import { Activity } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { useCreatePatientVitals } from '@/hooks/api/usePatients'
import type { Patient } from '@/hooks/api/usePatients'

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
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input id="weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input id="height" type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Vitals'}
        </Button>
      </CardContent>
    </Card>
  )
}
