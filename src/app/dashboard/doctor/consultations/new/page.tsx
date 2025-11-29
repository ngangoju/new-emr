'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  User, 
  Activity, 
  Stethoscope,
  Pill,
  FileText,
  Save,
  Eye
} from 'lucide-react'

const STEPS = [
  { id: 1, name: 'Patient Selection', icon: User },
  { id: 2, name: 'Chief Complaint', icon: FileText },
  { id: 3, name: 'Vitals & Examination', icon: Activity },
  { id: 4, name: 'Diagnosis', icon: Stethoscope },
  { id: 5, name: 'Treatment Plan', icon: Pill },
  { id: 6, name: 'Review & Submit', icon: Eye },
]

import { usePatients, type Patient } from '@/hooks/api/usePatients'
import { useCreateConsultation } from '@/hooks/api/useConsultations'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce' // Assuming you have this or I'll implement a simple debounce

// ... (keep existing imports)

export default function NewConsultationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const debouncedSearch = useDebounce(patientSearch, 500)
  
  // Fetch patients for search
  const { data: patientsData, isLoading: isSearching } = usePatients({ 
    query: debouncedSearch,
    limit: 5 
  })
  
  const patients = patientsData?.data || []
  const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId)

  const createConsultationMutation = useCreateConsultation()

  const [consultationData, setConsultationData] = useState({
    chiefComplaint: '',
    history: '',
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    weight: '',
    height: '',
    examination: '',
    diagnosis: '',
    medications: '',
    labTests: '',
    followUp: '',
  })

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient')
      return
    }

    const payload = {
      patientId: selectedPatientId,
      diagnosis: consultationData.diagnosis,
      notes: `
Chief Complaint: ${consultationData.chiefComplaint}
History: ${consultationData.history}
Examination: ${consultationData.examination}
Treatment: ${consultationData.medications}
Lab Tests: ${consultationData.labTests}
Follow Up: ${consultationData.followUp}
      `.trim(),
      vitals: {
        temperature: consultationData.temperature,
        bloodPressure: consultationData.bloodPressure,
        heartRate: consultationData.heartRate,
        weight: consultationData.weight,
        height: consultationData.height,
      }
    }

    createConsultationMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Consultation created successfully!')
        router.push('/dashboard')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to create consultation')
      }
    })
  }

  const updateData = (field: string, value: string) => {
    setConsultationData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <PageHeader
        title="New Consultation"
        description="Record patient consultation following the structured workflow"
      />

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Step Indicators */}
            <div className="flex justify-between mt-6">
              {STEPS.map((step) => {
                const StepIcon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2 flex-1">
                    <div
                      className={`
                        flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all
                        ${isCompleted ? 'bg-success border-success text-white' : ''}
                        ${isActive ? 'bg-primary border-primary text-white scale-110' : ''}
                        ${!isActive && !isCompleted ? 'border-gray-300 text-gray-400' : ''}
                      `}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs text-center ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                      {step.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {React.createElement(STEPS[currentStep - 1].icon, { className: 'h-5 w-5 text-primary' })}
            <span>{STEPS[currentStep - 1].name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Patient Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Patient *</Label>
                <div className="relative">
                  <Input 
                    placeholder="Search by name, ID or phone..." 
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                  {patientSearch && !selectedPatientId && (
                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-auto">
                      {isSearching ? (
                        <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                      ) : patients.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No patients found</div>
                      ) : (
                        patients.map((patient: Patient) => (
                          <div 
                            key={patient.id}
                            className="p-2 hover:bg-accent cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedPatientId(patient.id)
                              setPatientSearch(`${patient.firstName} ${patient.lastName}`)
                            }}
                          >
                            <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                            <div className="text-xs text-muted-foreground">
                              {patient.gender} • {patient.phone}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">

                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender:</span>
                        <p className="font-medium">{selectedPatient.gender}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 text-destructive hover:text-destructive"
                      onClick={() => {
                        setSelectedPatientId('')
                        setPatientSearch('')
                      }}
                    >
                      Change Patient
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Chief Complaint */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                <Textarea
                  id="chiefComplaint"
                  placeholder="What brings the patient in today?"
                  value={consultationData.chiefComplaint}
                  onChange={(e) => updateData('chiefComplaint', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="history">History of Present Illness</Label>
                <Textarea
                  id="history"
                  placeholder="Detailed history, onset, duration, severity..."
                  value={consultationData.history}
                  onChange={(e) => updateData('history', e.target.value)}
                  rows={6}
                />
              </div>
            </div>
          )}

          {/* Step 3: Vitals */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temp">Temperature (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={consultationData.temperature}
                    onChange={(e) => updateData('temperature', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bp">Blood Pressure (mmHg)</Label>
                  <Input
                    id="bp"
                    placeholder="120/80"
                    value={consultationData.bloodPressure}
                    onChange={(e) => updateData('bloodPressure', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hr">Heart Rate (bpm)</Label>
                  <Input
                    id="hr"
                    type="number"
                    placeholder="72"
                    value={consultationData.heartRate}
                    onChange={(e) => updateData('heartRate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={consultationData.weight}
                    onChange={(e) => updateData('weight', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={consultationData.height}
                    onChange={(e) => updateData('height', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>BMI</Label>
                  <Input
                    disabled
                    value={
                      consultationData.weight && consultationData.height
                        ? (Number(consultationData.weight) / Math.pow(Number(consultationData.height) / 100, 2)).toFixed(1)
                        : ''
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examination">Physical Examination Findings</Label>
                <Textarea
                  id="examination"
                  placeholder="General appearance, systems review..."
                  value={consultationData.examination}
                  onChange={(e) => updateData('examination', e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}

          {/* Step 4: Diagnosis */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis (ICD-10) *</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Enter diagnosis codes and descriptions..."
                  value={consultationData.diagnosis}
                  onChange={(e) => updateData('diagnosis', e.target.value)}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Pro tip: Use ICD-10 codes for accurate diagnosis recording
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Treatment Plan */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medications">Medications / Prescriptions</Label>
                <Textarea
                  id="medications"
                  placeholder="Medication name, dosage, frequency, duration..."
                  value={consultationData.medications}
                  onChange={(e) => updateData('medications', e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="labTests">Lab Tests Ordered</Label>
                <Textarea
                  id="labTests"
                  placeholder="List any lab tests or imaging required..."
                  value={consultationData.labTests}
                  onChange={(e) => updateData('labTests', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUp">Follow-up Instructions</Label>
                <Textarea
                  id="followUp"
                  placeholder="When to return, what to watch for..."
                  value={consultationData.followUp}
                  onChange={(e) => updateData('followUp', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                <h3 className="font-semibold text-lg">Consultation Summary</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label className="text-muted-foreground">Patient:</Label>
                    <p className="font-medium">
                      {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Not selected'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Chief Complaint:</Label>
                    <p>{consultationData.chiefComplaint || 'Not recorded'}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Vitals:</Label>
                    <p>
                      Temp: {consultationData.temperature || '-'}°C, 
                      BP: {consultationData.bloodPressure || '-'}, 
                      HR: {consultationData.heartRate || '-'} bpm
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Diagnosis:</Label>
                    <p>{consultationData.diagnosis || 'Not recorded'}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Treatment:</Label>
                    <p>{consultationData.medications || 'No medications prescribed'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-warning/50 bg-warning/5 p-4">
                <p className="text-sm text-foreground">
                  ⚠️ Please review all information carefully before submitting. This consultation will be permanently recorded in the patient's medical history.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex space-x-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-success hover:bg-success/90">
              <Check className="h-4 w-4 mr-2" />
              Complete Consultation
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}