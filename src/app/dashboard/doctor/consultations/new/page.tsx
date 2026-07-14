'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check, Save } from 'lucide-react'
import { Form } from '@/components/ui/form'

import { usePatients, usePatient, usePatientVitals } from '@/hooks/api/usePatients'
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
import { AllergyInteractionOverrideModal } from '@/components/clinical/AllergyInteractionOverrideModal'
import { AddMedicationPayload, useAddMedication, useDryRunSafetyCheck } from '@/hooks/api/useConsultations'

import { STEPS } from './steps/constants'
import type { StructuredMed } from './steps/types'
import { PatientSelectionStep } from './steps/PatientSelectionStep'
import { ChiefComplaintStep } from './steps/ChiefComplaintStep'
import { VitalsExaminationStep } from './steps/VitalsExaminationStep'
import { DiagnosisStep } from './steps/DiagnosisStep'
import { TreatmentPlanStep } from './steps/TreatmentPlanStep'
import { ReviewStep } from './steps/ReviewStep'

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
  const isNurseRole = isRole(['NURSE', 'CHIEF_NURSE'])
  const canActAsDoctorWorkflow = isRole(['DOCTOR', 'CLINICAL_DIRECTOR'])

  const [currentStep, setCurrentStep] = useState(1)
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([])
  const [createdConsultation, setCreatedConsultation] = useState<{ id: string; status: string } | null>(null)

  // Item 1 & 2: Structured Medication State
  const [structuredMeds, setStructuredMeds] = useState<StructuredMed[]>([])
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatientSearch('Loading patient...')
      // Auto-advance to step 2 (Chief Complaint) since patient is selected
      setCurrentStep(2)
    }
  }, [patientIdFromUrl, form])

  // Update patient search display when patient data is loaded
  useEffect(() => {
    if (selectedPatient && patientIdFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const isNurse = isNurseRole;
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
    if (stepRole === 'NURSE' && isNurseRole) return true;
    if (stepRole === 'DOCTOR' && canActAsDoctorWorkflow) return true;

    // Doctors can override nurse fields with audit
    if (stepRole === 'NURSE' && canActAsDoctorWorkflow) return true;

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

  const bmi =
    formValues.vitals?.weight && formValues.vitals?.height
      ? (Number(formValues.vitals.weight) / Math.pow(Number(formValues.vitals.height) / 100, 2)).toFixed(1)
      : ''

  const reviewTemperature = (latestVitals?.temperature ?? formValues.vitals?.temperature) || '-'
  const reviewBloodPressure = latestVitals?.bloodPressure || formValues.vitals?.bloodPressure || '-'
  const reviewHeartRate = (latestVitals?.heartRate ?? formValues.vitals?.heartRate) || '-'

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

              {currentStep === 1 && (
                <PatientSelectionStep
                  form={form}
                  patientSearch={patientSearch}
                  onPatientSearchChange={setPatientSearch}
                  editable={isStepEditable()}
                  lockedFromUrl={!!patientIdFromUrl}
                  isSearching={isSearching}
                  patients={patients}
                  isLoadingPatient={isLoadingPatient}
                  selectedPatient={selectedPatient}
                />
              )}

              {currentStep === 2 && <ChiefComplaintStep form={form} />}

              {currentStep === 3 && (
                <VitalsExaminationStep
                  form={form}
                  latestVitalsLoading={latestVitalsLoading}
                  latestVitals={latestVitals}
                  bmi={bmi}
                />
              )}

              {currentStep === 4 && <DiagnosisStep form={form} />}

              {currentStep === 5 && (
                <TreatmentPlanStep
                  form={form}
                  onAddMedication={handleAddStructuredMed}
                  isAddingMedication={addMedicationMutation.isPending}
                  structuredMeds={structuredMeds}
                  onRemoveMedication={handleRemoveStructuredMed}
                  selectedLabTests={selectedLabTests}
                  onToggleLabTest={toggleLabTest}
                />
              )}

              {currentStep === 6 && (
                <ReviewStep
                  selectedPatient={selectedPatient}
                  chiefComplaint={formValues.chiefComplaint}
                  diagnosis={formValues.diagnosis}
                  medications={formValues.medications}
                  temperature={reviewTemperature}
                  bloodPressure={reviewBloodPressure}
                  heartRate={reviewHeartRate}
                  createdConsultation={createdConsultation}
                />
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

              {currentStep === 3 && isNurseRole && encounter?.workflowMode === 'MULTI_ACTOR' ? (
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
