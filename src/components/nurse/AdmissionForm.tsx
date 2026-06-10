'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRole } from '@/hooks/useRole'
import { 
  useWards, 
  useAvailableBeds, 
  useCreateAdmission 
} from '@/hooks/useAdmissions'
import { usePatients, Patient } from '@/hooks/api/usePatients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ChevronsUpDown, User, Bed, Building2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const admissionSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  wardId: z.string().min(1, 'Ward is required'),
  bedId: z.string().min(1, 'Bed is required'),
  reason: z.string().min(1, 'Reason for admission is required'),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
})

type AdmissionFormData = z.infer<typeof admissionSchema>

interface AdmissionFormProps {
  onSuccess?: () => void
}

export function AdmissionForm({ onSuccess }: AdmissionFormProps) {
  const { hasPermission } = useRole()
  const { data: wards, isLoading: loadingWards } = useWards()
  const { data: availableBeds, isLoading: loadingBeds } = useAvailableBeds()
  const createAdmission = useCreateAdmission()
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientSearchQuery, setPatientSearchQuery] = useState('')
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      patientId: '',
      wardId: '',
      bedId: '',
      reason: '',
      diagnosis: '',
      notes: '',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedWardId = watch('wardId')

  // Filter beds by selected ward
  const filteredBeds = selectedWardId 
    ? availableBeds?.filter(bed => bed.wardId === selectedWardId)
    : availableBeds

  // Patient search
  const { data: patientsData, isLoading: loadingPatients } = usePatients({
    query: patientSearchQuery,
    limit: 10
  })

  const patients = patientsData?.data || []

  // Check permission
  const canAdmit = hasPermission('CAN_ADMIT') || hasPermission('admission:create')

  useEffect(() => {
    if (selectedPatient) {
      setValue('patientId', selectedPatient.id)
    }
  }, [selectedPatient, setValue])

  const onSubmit = async (data: AdmissionFormData) => {
    try {
      await createAdmission.mutateAsync(data)
      reset()
      setSelectedPatient(null)
      onSuccess?.()
    } catch (error) {
      console.error('Admission error:', error)
    }
  }

  if (!canAdmit) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <p className="text-yellow-800 text-center">
            You do not have permission to admit patients. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Admit Patient
        </CardTitle>
        <CardDescription>
          Register a patient to a ward and bed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">Patient</Label>
            <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={patientPopoverOpen}
                  className="w-full justify-between h-10"
                  disabled={isSubmitting}
                >
                  {selectedPatient 
                    ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                    : "Search/Select Patient..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search patient name or ID..." 
                    preserveSpaces
                    onValueChange={setPatientSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loadingPatients ? "Searching..." : "No patients found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {patients.map((patient: Patient) => (
                        <CommandItem
                          key={patient.id}
                          value={patient.id}
                          onSelect={() => {
                            setSelectedPatient(patient)
                            setValue('patientId', patient.id)
                            setPatientPopoverOpen(false)
                          }}
                          className="flex items-center gap-3 py-3"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                            <span className="text-xs text-muted-foreground">
                              ID: {patient.id.slice(0, 8)} | {patient.gender}
                            </span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.patientId && (
              <p className="text-sm text-red-500">{errors.patientId.message}</p>
            )}
          </div>

          {/* Ward Selection */}
          <div className="space-y-2">
            <Label htmlFor="wardId">Ward</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Select
                value={watch('wardId')}
                onValueChange={(value) => {
                  setValue('wardId', value)
                  setValue('bedId', '') // Reset bed when ward changes
                }}
                disabled={loadingWards || isSubmitting}
              >
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder={loadingWards ? "Loading wards..." : "Select ward"} />
                </SelectTrigger>
                <SelectContent>
                  {wards?.map((ward) => (
                    <SelectItem key={ward.id} value={ward.id}>
                      {ward.name} (Floor {ward.floor}) - {ward.capacity} beds
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.wardId && (
              <p className="text-sm text-red-500">{errors.wardId.message}</p>
            )}
          </div>

          {/* Bed Selection */}
          <div className="space-y-2">
            <Label htmlFor="bedId">Bed</Label>
            <div className="relative">
              <Bed className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Select
                value={watch('bedId')}
                onValueChange={(value) => setValue('bedId', value)}
                disabled={!selectedWardId || loadingBeds || isSubmitting}
              >
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder={
                    !selectedWardId 
                      ? "Select ward first" 
                      : loadingBeds 
                        ? "Loading beds..." 
                        : "Select available bed"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredBeds?.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>
                      Bed {bed.bedNumber}
                    </SelectItem>
                  ))}
                  {filteredBeds?.length === 0 && selectedWardId && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available beds in this ward
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            {errors.bedId && (
              <p className="text-sm text-red-500">{errors.bedId.message}</p>
            )}
          </div>

          {/* Reason for Admission */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Admission *</Label>
            <Input
              id="reason"
              placeholder="e.g., Surgery, Observation, Treatment"
              {...register('reason')}
              disabled={isSubmitting}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Input
              id="diagnosis"
              placeholder="Initial diagnosis (optional)"
              {...register('diagnosis')}
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the admission..."
              rows={3}
              {...register('notes')}
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Admitting...
                </>
              ) : (
                'Admit Patient'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
