'use client'

import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const STEPS = [
  { id: 1, name: 'Patient Selection', icon: User, fields: ['patientId'] },
  { id: 2, name: 'Chief Complaint', icon: FileText, fields: ['chiefComplaint', 'history'] },
  { id: 3, name: 'Vitals & Examination', icon: Activity, fields: ['vitals.temperature', 'vitals.bloodPressure', 'vitals.heartRate', 'vitals.weight', 'vitals.height', 'examination'] },
  { id: 4, name: 'Diagnosis', icon: Stethoscope, fields: ['diagnosis'] },
  { id: 5, name: 'Treatment Plan', icon: Pill, fields: ['medications', 'labTests', 'followUp'] },
  { id: 6, name: 'Review & Submit', icon: Eye, fields: [] },
]

import { usePatients, type Patient } from '@/hooks/api/usePatients'
import { useCreateConsultation } from '@/hooks/api/useConsultations'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { consultationSchema, type ConsultationInput } from '@/lib/validations/consultation'

export default function NewConsultationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [patientSearch, setPatientSearch] = useState('')
  const debouncedSearch = useDebounce(patientSearch, 500)
  
  // React Hook Form
  const form = useForm<ConsultationInput>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      patientId: '',
      chiefComplaint: '',
      history: '',
      diagnosis: '',
      examination: '',
      medications: '',
      labTests: '',
      followUp: '',
      vitals: {
        temperature: '',
        bloodPressure: '',
        heartRate: '',
        weight: '',
        height: '',
      }
    },
    mode: 'onChange'
  })

  // Watch values for review step and conditional rendering
  const formValues = form.watch()
  const selectedPatientId = form.watch('patientId')

  // Fetch patients for search
  const { data: patientsData, isLoading: isSearching } = usePatients({ 
    query: debouncedSearch,
    limit: 5 
  })
  
  const patients = patientsData?.data || []
  const selectedPatient = patients.find((p: Patient) => p.id === selectedPatientId) || (patientsData?.data || []).find((p: Patient) => p.id === selectedPatientId)

  const createConsultationMutation = useCreateConsultation()

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = async () => {
    const currentStepFields = STEPS[currentStep - 1].fields as any[]
    
    if (currentStepFields.length > 0) {
      const isValid = await form.trigger(currentStepFields)
      if (!isValid) return
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const onSubmit = (data: ConsultationInput) => {
    const payload = {
      patientId: data.patientId,
      diagnosis: data.diagnosis,
      notes: `
Chief Complaint: ${data.chiefComplaint}
History: ${data.history || 'N/A'}
Examination: ${data.examination || 'N/A'}
Treatment: ${data.medications || 'N/A'}
Lab Tests: ${data.labTests || 'N/A'}
Follow Up: ${data.followUp || 'N/A'}
      `.trim(),
      vitals: data.vitals
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
            
            <div className="flex justify-between mt-6 overflow-x-auto pb-2 md:pb-0">
              {STEPS.map((step) => {
                const StepIcon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStep > step.id
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2 flex-1 min-w-[60px]">
                    <div
                      className={`
                        flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border-2 transition-all
                        ${isCompleted ? 'bg-success border-success text-white' : ''}
                        ${isActive ? 'bg-primary border-primary text-white scale-110' : ''}
                        ${!isActive && !isCompleted ? 'border-gray-300 text-gray-400' : ''}
                      `}
                    >
                      {isCompleted ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : <StepIcon className="h-4 w-4 md:h-5 md:w-5" />}
                    </div>
                    <span className={`text-[10px] md:text-xs text-center hidden md:block ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="mt-6">
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
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem className="space-y-4" id="patient-search-item">
                        <FormLabel>Search Patient *</FormLabel>
                        <div className="relative">
                          <Input 
                            placeholder="Search by name, ID or phone..." 
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                          />
                          {patientSearch && !field.value && (
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
                                      field.onChange(patient.id)
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
                        <FormMessage />

                        {field.value && (
                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Name:</span>
                                  <p className="font-medium">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Phone:</span>
                                  <p className="font-medium">{selectedPatient?.phone}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Gender:</span>
                                  <p className="font-medium">{selectedPatient?.gender}</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-4 text-destructive hover:text-destructive"
                                onClick={() => {
                                  field.onChange('')
                                  setPatientSearch('')
                                }}
                                type="button"
                              >
                                Change Patient
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Chief Complaint */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="chiefComplaint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chief Complaint *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What brings the patient in today?"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>History of Present Illness</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed history, onset, duration, severity..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Vitals */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vitals.temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="36.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vitals.bloodPressure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Pressure (mmHg)</FormLabel>
                          <FormControl>
                            <Input placeholder="120/80" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vitals.heartRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heart Rate (bpm)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="72" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vitals.weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="70.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vitals.height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="175" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label>BMI</Label>
                      <Input
                        disabled
                        value={
                          formValues.vitals?.weight && formValues.vitals?.height
                            ? (Number(formValues.vitals.weight) / Math.pow(Number(formValues.vitals.height) / 100, 2)).toFixed(1)
                            : ''
                        }
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="examination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physical Examination Findings</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="General appearance, systems review..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 4: Diagnosis */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis (ICD-10) *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter diagnosis codes and descriptions..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Pro tip: Use ICD-10 codes for accurate diagnosis recording
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 5: Treatment Plan */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medications / Prescriptions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Medication name, dosage, frequency, duration..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="labTests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lab Tests Ordered</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any lab tests or imaging required..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followUp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="When to return, what to watch for..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <p>{formValues.chiefComplaint || 'Not recorded'}</p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">Vitals:</Label>
                        <p>
                          Temp: {formValues.vitals?.temperature || '-'}°C, 
                          BP: {formValues.vitals?.bloodPressure || '-'}, 
                          HR: {formValues.vitals?.heartRate || '-'} bpm
                        </p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">Diagnosis:</Label>
                        <p>{formValues.diagnosis || 'Not recorded'}</p>
                      </div>

                      <div>
                        <Label className="text-muted-foreground">Treatment:</Label>
                        <p>{formValues.medications || 'No medications prescribed'}</p>
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
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              type="button"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex space-x-2">
              <Button variant="outline" type="button">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} type="button">
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="bg-success hover:bg-success/90" disabled={createConsultationMutation.isPending}>
                  <Check className="h-4 w-4 mr-2" />
                  {createConsultationMutation.isPending ? 'Completing...' : 'Complete Consultation'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}