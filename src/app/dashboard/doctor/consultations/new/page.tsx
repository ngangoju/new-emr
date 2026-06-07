'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
  { id: 1, name: 'Patient Selection', icon: User, fields: ['patientId'], role: 'DOCTOR' },
  { id: 2, name: 'Chief Complaint', icon: FileText, fields: ['chiefComplaint', 'history'], role: 'DOCTOR' },
  { id: 3, name: 'Vitals & Examination', icon: Activity, fields: ['examination'], role: 'DOCTOR' },
  { id: 4, name: 'Diagnosis', icon: Stethoscope, fields: ['diagnosis'], role: 'DOCTOR' },
  { id: 5, name: 'Treatment Plan', icon: Pill, fields: ['medications', 'labTests', 'followUp'], role: 'DOCTOR' },
  { id: 6, name: 'Review & Submit', icon: Eye, fields: [], role: 'DOCTOR' },
]

const LAB_TEST_OPTIONS = [
  'Complete Blood Count (CBC)',
  'Blood Glucose',
  'Urinalysis',
  'Lipid Profile',
  'Liver Function Test',
  'Kidney Function Test',
  'Malaria Test',
  'HIV Rapid Test',
]

import { usePatients, usePatient, usePatientVitals, type Patient } from '@/hooks/api/usePatients'
import { useCreateConsultation, useSignConsultation } from '@/hooks/api/useConsultations'
import { useCreateLabOrder } from '@/hooks/useLabOrders'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { consultationSchema, type ConsultationInput } from '@/lib/validations/consultation'
import { useRole } from '@/hooks/useRole'
import { WorkflowIndicator } from '@/components/clinical/WorkflowIndicator'
import { useEncounter, useHandoffEncounter, useUpdateEncounterStep, type Encounter } from '@/hooks/api/useEncounters'
import { StructuredMedicationEntry } from '@/components/clinical/StructuredMedicationEntry'
import { PrescriptionList } from '@/components/clinical/PrescriptionList'
import { AllergyInteractionOverrideModal } from '@/components/clinical/AllergyInteractionOverrideModal'
import { AddMedicationPayload, useAddMedication, useDryRunSafetyCheck } from '@/hooks/api/useConsultations'
import type { PrescriptionListMedication } from '@/components/clinical/PrescriptionList'

export default function NewConsultationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading consultation wizard...</div>}>
      <ConsultationWizard />
    </Suspense>
  )
}

function ConsultationWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const encounterId = searchParams.get('encounterId')
  const patientIdFromUrl = searchParams.get('patientId')
  const { isRole } = useRole()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([])
  const [createdConsultation, setCreatedConsultation] = useState<{ id: string; status: string } | null>(null)
  
  // Item 1 & 2: Structured Medication State
  const [structuredMeds, setStructuredMeds] = useState<(AddMedicationPayload & { drugName: string, id: string, safetyChecked?: boolean })[]>([])
  const [safetyError, setSafetyError] = useState<string | null>(null)
  const [pendingMed, setPendingMed] = useState<(AddMedicationPayload & { drugName: string }) | null>(null)
  
  const debouncedSearch = useDebounce(patientSearch, 500)
  
  // Fetch encounter data if it exists
  const { data: encounterData } = useEncounter(encounterId || '')
  const encounter: Encounter | null = encounterData ?? null
  const handoffMutation = useHandoffEncounter()
  const updateStepMutation = useUpdateEncounterStep()

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
  const formValues = useWatch({ control: form.control })
  const selectedPatientId = useWatch({ control: form.control, name: 'patientId' })

  // Fetch patients for search
  const { data: patientsData, isLoading: isSearching } = usePatients({ 
    query: debouncedSearch,
    limit: 5 
  })
  
  // Reliably fetch selected patient data
  const { data: selectedPatient, isLoading: isLoadingPatient } = usePatient(selectedPatientId)
  const { data: patientVitalsData, isLoading: latestVitalsLoading } = usePatientVitals(selectedPatientId)
  
  const patients = patientsData?.data || []
  const latestVitals = Array.isArray(patientVitalsData) ? patientVitalsData[0] : undefined

  const createConsultationMutation = useCreateConsultation()
  const signConsultationMutation = useSignConsultation()
  const createLabOrderMutation = useCreateLabOrder()
  const addMedicationMutation = useAddMedication()
  const dryRunSafetyCheckMutation = useDryRunSafetyCheck()

  // Auto-populate patient when patientId is provided in URL
  useEffect(() => {
    if (patientIdFromUrl) {
      // Set the form's patientId field
      form.setValue('patientId', patientIdFromUrl, { shouldValidate: true })
      // Set the patient search to show the patient name
      setPatientSearch('Loading patient...')
      // Auto-advance to step 2 (Chief Complaint) since patient is selected
      setCurrentStep(2)
    }
  }, [patientIdFromUrl, form])

  // Update patient search display when patient data is loaded
  useEffect(() => {
    if (selectedPatient && patientIdFromUrl) {
      setPatientSearch(`${selectedPatient.firstName} ${selectedPatient.lastName}`)
    }
  }, [selectedPatient, patientIdFromUrl])

  useEffect(() => {
    if (!latestVitals) {
      return
    }

    form.setValue('vitals.temperature', latestVitals.temperature ? String(latestVitals.temperature) : '')
    form.setValue('vitals.bloodPressure', latestVitals.bloodPressure || '')
    form.setValue('vitals.heartRate', latestVitals.heartRate ? String(latestVitals.heartRate) : '')
    form.setValue('vitals.weight', latestVitals.weight ? String(latestVitals.weight) : '')
    form.setValue('vitals.height', latestVitals.height ? String(latestVitals.height) : '')
  }, [form, latestVitals])

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = async () => {
    const currentStepFields =
      (STEPS[currentStep - 1].fields as Parameters<typeof form.trigger>[0]) ?? []
    
    if (currentStepFields.length > 0) {
      const isValid = await form.trigger(currentStepFields)
      if (!isValid) return
    }

    // Capture completion state for the step
    if (encounterId) {
      updateStepMutation.mutate({
        id: encounterId,
        stepName: STEPS[currentStep - 1].name,
        completed: true
      })
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleHandoff = async () => {
    if (!encounterId) return;

    const isNurse = isRole('NURSE');
    const nextStage = isNurse ? 'CONSULTATION' : 'SIGN_OFF';
    
    // In a real app, we'd have a dropdown to select the specific doctor/user
    // For this redesign, we'll use a placeholder or the first available
    const placeholderDoctorId = '00000000-0000-0000-0000-000000000000'; 

    handoffMutation.mutate({
      id: encounterId,
      nextStage,
      newOwnerId: placeholderDoctorId,
      notes: "Handoff from wizard"
    }, {
      onSuccess: () => {
        toast.success(`Handoff to ${isNurse ? 'Doctor' : 'Reviewer'} successful!`)
        router.push('/dashboard')
      }
    })
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Determine if current step is editable by current role
  const isStepEditable = () => {
    if (encounter?.workflowMode === 'SINGLE_ACTOR') return true;
    
    const stepRole = STEPS[currentStep - 1].role;
    if (stepRole === 'NURSE' && isRole('NURSE')) return true;
    if (stepRole === 'DOCTOR' && isRole('DOCTOR')) return true;
    
    // Doctors can override nurse fields with audit
    if (stepRole === 'NURSE' && isRole('DOCTOR')) return true; 

    return false;
  }

  const extractErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null) {
      const maybeError = error as {
        message?: string
        response?: { data?: { message?: string } }
      }

      return maybeError.response?.data?.message || maybeError.message || fallback
    }

    return fallback
  }

  const onSubmit = async (data: ConsultationInput) => {
    const payload = {
      patientId: data.patientId,
      diagnosis: data.diagnosis,
      findings: `
Chief Complaint: ${data.chiefComplaint}
History: ${data.history || 'N/A'}
Physical Examination: ${data.examination || 'N/A'}
      `.trim(),
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

    try {
      const created = await createConsultationMutation.mutateAsync(payload)
      setCreatedConsultation({ id: created.id, status: created.status })
      
      // Item 1 & 2: Save structured medications
      if (structuredMeds.length > 0) {
        toast.loading('Saving structured prescriptions...')
        for (const med of structuredMeds) {
          try {
            await addMedicationMutation.mutateAsync({
              consultationId: created.id,
              payload: {
                formularyId: med.formularyId,
                dose: med.dose,
                route: med.route,
                frequency: med.frequency,
                duration: med.duration,
                indication: med.indication,
                allergyOverrideReason: med.allergyOverrideReason,
                interactionOverrideReason: med.interactionOverrideReason
              }
            })
          } catch (err: unknown) {
             console.error('Failed to save med:', med.drugName, err)
             toast.error(`Failed to save prescription for ${med.drugName}`)
          }
        }
      }
      
      toast.dismiss()
      toast.success('Consultation created. Finalize and sign to complete.')
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to create consultation'))
    }
  }

  // Item 1 & 2: Structured Med Handlers
  const addStructuredMedLocal = (
    med: AddMedicationPayload & { drugName: string },
    overrides?: { allergyOverrideReason?: string; interactionOverrideReason?: string }
  ) => {
    // Generate a temp ID for local list
    const tempId = Math.random().toString(36).substr(2, 9);
    setStructuredMeds([...structuredMeds, { ...med, ...overrides, id: tempId, safetyChecked: true }]);
    toast.success(`Added ${med.drugName} to prescription list`);
  }

  const handleAddStructuredMed = async (med: AddMedicationPayload & { drugName: string }) => {
    const patientId = form.getValues('patientId')
    if (!patientId) {
      toast.error('Select a patient before adding medication')
      return
    }

    try {
      const safetyResult = await dryRunSafetyCheckMutation.mutateAsync({
        patientId,
        formularyId: med.formularyId,
        activeFormularyIds: structuredMeds.map((m) => m.formularyId),
      })

      if (safetyResult.safe) {
        addStructuredMedLocal(med)
        return
      }

      if (safetyResult.allergyConflict) {
        setPendingMed(med)
        setSafetyError(
          `ALLERGY CONFLICT: Patient has documented allergy to '${safetyResult.allergyConflict.allergen}' (severity: ${safetyResult.allergyConflict.severity}).`
        )
        return
      }

      if (safetyResult.interactionConflict) {
        setPendingMed(med)
        setSafetyError(
          `DRUG INTERACTION DETECTED: ${safetyResult.interactionConflict.drug1Name} and ${safetyResult.interactionConflict.drug2Name} — ${safetyResult.interactionConflict.description}.`
        )
        return
      }

      addStructuredMedLocal(med)
    } catch {
      toast.error('Safety check failed. Please try again.')
    }
  }

  const handleOverrideConfirm = (reason: string) => {
    if (!pendingMed || !safetyError) return

    const isAllergy = safetyError.toLowerCase().includes('allergy')
    const isInteraction = safetyError.toLowerCase().includes('interaction')

    addStructuredMedLocal(pendingMed, {
      allergyOverrideReason: isAllergy ? reason : undefined,
      interactionOverrideReason: isInteraction ? reason : undefined,
    })

    setPendingMed(null)
    setSafetyError(null)
  }

  const handleOverrideClose = () => {
    setPendingMed(null)
    setSafetyError(null)
  }

  const handleRemoveStructuredMed = (id: string) => {
    setStructuredMeds(structuredMeds.filter(m => m.id !== id));
  }

  const toggleLabTest = (testName: string) => {
    setSelectedLabTests((prev) =>
      prev.includes(testName) ? prev.filter((item) => item !== testName) : [...prev, testName]
    )
  }

  const handleFinalizeConsultation = async () => {
    if (!createdConsultation?.id) {
      toast.error('Create consultation first before finalizing.')
      return
    }

    try {
      if (selectedLabTests.length > 0) {
        await createLabOrderMutation.mutateAsync({
          patientId: form.getValues('patientId'),
          consultId: createdConsultation.id,
          tests: selectedLabTests,
        })
      }

      const signed = await signConsultationMutation.mutateAsync(createdConsultation.id)
      setCreatedConsultation({ id: signed.id, status: signed.status })
      toast.success('Consultation finalized and signed successfully.')
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to finalize consultation'))
    }
  }

  const CurrentStepIcon = STEPS[currentStep - 1].icon

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <PageHeader
        title="Consultation Wizard"
        description="Multi-role clinical workflow with secure handoffs"
      />

      {/* Workflow Indicator */}
      {encounter && (
        <WorkflowIndicator 
          stage={encounter.stage}
          workflowMode={encounter.workflowMode}
          currentOwnerName={encounter.currentOwnerName}
          patientName={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : ''}
          lastUpdated={new Date(encounter.updatedAt).toLocaleString()}
        />
      )}

      {/* Legacy Progress Bar (Optional, keep for compatibility if needed) */}
      {!encounter && (
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
      )}

      {/* Step Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CurrentStepIcon className="h-5 w-5 text-primary" />
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
                            disabled={!isStepEditable() || !!patientIdFromUrl}
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
                              {isLoadingPatient ? (
                                <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
                                  Loading patient details...
                                </div>
                              ) : selectedPatient ? (
                                <>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Name:</span>
                                      <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Phone:</span>
                                      <p className="font-medium">{selectedPatient.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Gender:</span>
                                      <p className="font-medium capitalize">{selectedPatient.gender?.toLowerCase() || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">ID:</span>
                                      <p className="font-medium text-xs font-mono">{selectedPatient.id}</p>
                                    </div>
                                  </div>
                                  {!patientIdFromUrl && (
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
                                  )}
                                </>
                              ) : (
                                <div className="p-4 text-center text-sm text-destructive">
                                  Failed to load patient information. Please try re-selecting.
                                </div>
                              )}
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
                  {latestVitalsLoading ? (
                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                      Loading latest vitals...
                    </div>
                  ) : latestVitals ? (
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Latest nurse-recorded vitals</h3>
                        <Badge variant="secondary">Read only</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vitals recorded at {new Date(latestVitals.recordedAt).toLocaleString()}
                      </p>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <Label className="text-muted-foreground">Temperature</Label>
                          <p className="font-medium">{latestVitals.temperature ?? '-'} °C</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Blood Pressure</Label>
                          <p className="font-medium">{latestVitals.bloodPressure || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Heart Rate</Label>
                          <p className="font-medium">{latestVitals.heartRate ?? '-'} bpm</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Respiratory Rate</Label>
                          <p className="font-medium">{latestVitals.respiratoryRate ?? '-'} /min</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">SpO2</Label>
                          <p className="font-medium">{latestVitals.oxygenSaturation ?? '-'} %</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Pain Score</Label>
                          <p className="font-medium">{latestVitals.painScore ?? '-'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Weight</Label>
                          <p className="font-medium">{latestVitals.weight ?? '-'} kg</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Height</Label>
                          <p className="font-medium">{latestVitals.height ?? '-'} cm</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No vitals recorded yet
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="vitals.temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="36.5" {...field} disabled />
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
                            <Input placeholder="120/80" {...field} disabled />
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
                            <Input type="number" placeholder="72" {...field} disabled />
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
                            <Input type="number" step="0.1" placeholder="70.5" {...field} disabled />
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
                            <Input type="number" placeholder="175" {...field} disabled />
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
                  <div className="space-y-4">
                    <Label className="text-base font-bold flex items-center gap-2">
                       <Pill className="h-5 w-5 text-primary" />
                       Structured Prescriptions (Item 1 & 2)
                    </Label>
                    
                    <StructuredMedicationEntry 
                      onAdd={handleAddStructuredMed} 
                      isLoading={addMedicationMutation.isPending}
                    />

                    <div className="space-y-2 mt-4">
                      <Label className="text-sm font-medium">Added Medications</Label>
                      <PrescriptionList 
                        medications={structuredMeds as PrescriptionListMedication[]} 
                        onRemove={handleRemoveStructuredMed}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="medications"
                      render={({ field }) => (
                        <FormItem className="mt-6 opacity-60">
                          <FormLabel>Legacy Prescription Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any non-drug treatment notes or general advice..."
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <div className="space-y-3">
                    <Label>Doctor Lab Request Selection</Label>
                    <p className="text-sm text-muted-foreground">
                      Selected tests will be submitted as a lab order when you finalize the consultation.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {LAB_TEST_OPTIONS.map((testName) => {
                        const isSelected = selectedLabTests.includes(testName)
                        return (
                          <Button
                            key={testName}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleLabTest(testName)}
                          >
                            {isSelected ? '✓ ' : ''}
                            {testName}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

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
                          Temp: {(latestVitals?.temperature ?? formValues.vitals?.temperature) || '-'}°C,
                          BP: {latestVitals?.bloodPressure || formValues.vitals?.bloodPressure || '-'},
                          HR: {(latestVitals?.heartRate ?? formValues.vitals?.heartRate) || '-'} bpm
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
                      ⚠️ Please review all information carefully before submitting. This consultation will be permanently recorded in the patient&apos;s medical history.
                    </p>
                  </div>

                  {createdConsultation && (
                    <div className="rounded-lg border bg-primary/5 border-primary/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Consultation Status</p>
                        <Badge variant={createdConsultation.status === 'SIGNED' ? 'default' : 'secondary'}>
                          {createdConsultation.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">ID: {createdConsultation.id}</p>
                      {createdConsultation.status === 'SIGNED' ? (
                        <p className="text-sm text-success">Consultation is finalized and signed.</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Consultation created in pending state. Finalize and sign to complete workflow.
                        </p>
                      )}
                    </div>
                  )}
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
              <Button variant="outline" type="button" disabled={!isStepEditable()}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>

              {currentStep === 3 && isRole('NURSE') && encounter?.workflowMode === 'MULTI_ACTOR' ? (
                <Button 
                  onClick={handleHandoff} 
                  type="button" 
                  className="bg-warning hover:bg-warning/90"
                  disabled={handoffMutation.isPending}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  {handoffMutation.isPending ? 'Processing...' : 'Ready for Doctor'}
                </Button>
              ) : (
                <>
                  {/* Always show the main action buttons on the final step (Review) */}
                  {currentStep === STEPS.length && (
                    <>
                      {!createdConsultation ? (
                        <Button
                          type="submit"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                          disabled={createConsultationMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {createConsultationMutation.isPending ? 'Creating...' : 'Create Consultation'}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                          disabled={
                            signConsultationMutation.isPending ||
                            createLabOrderMutation.isPending ||
                            createdConsultation.status === 'SIGNED'
                          }
                          onClick={handleFinalizeConsultation}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {createLabOrderMutation.isPending
                            ? 'Submitting Lab Order...'
                            : signConsultationMutation.isPending
                            ? 'Signing Consultation...'
                            : createdConsultation.status === 'SIGNED'
                            ? 'Consultation Signed'
                            : 'Finalize & Sign Consultation'}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Show Next button if not on final step */}
                  {currentStep < STEPS.length && (
                    <Button onClick={handleNext} type="button">
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </form>
      </Form>

      <AllergyInteractionOverrideModal
        isOpen={!!safetyError}
        onClose={handleOverrideClose}
        error={safetyError || ''}
        onConfirm={handleOverrideConfirm}
        isLoading={dryRunSafetyCheckMutation.isPending}
      />
    </div>
  )
}
