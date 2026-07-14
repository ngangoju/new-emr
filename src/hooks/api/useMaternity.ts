import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

type ApiErrorPayload = { response?: { data?: { message?: string } } }

function apiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiErrorPayload).response?.data?.message || fallback
}

// === Antenatal visits ===

export interface AntenatalVisit {
  id: string
  patientId: string
  visitNumber?: number | null
  gestationalAgeWeeks?: number | null
  bloodPressure?: string | null
  weightKg?: number | null
  foetalHeartRate?: number | null
  visitDate?: string | null
  status: string
}

export interface CreateAntenatalVisitRequest {
  patientId: string
  visitNumber?: number
  gestationalAgeWeeks?: number
  bloodPressure?: string
  weightKg?: number
  foetalHeartRate?: number
}

export function useActiveAntenatalVisits() {
  return useQuery({
    queryKey: ['antenatal', 'active'],
    queryFn: async () => {
      const { data } = await api.get<AntenatalVisit[]>('/api/maternity/antenatal/active')
      return data
    },
  })
}

export function useAntenatalVisitsByPatient(patientId?: string) {
  return useQuery({
    queryKey: ['antenatal', 'patient', patientId],
    queryFn: async () => {
      const { data } = await api.get<AntenatalVisit[]>(
        `/api/maternity/antenatal/patient/${patientId}`
      )
      return data
    },
    enabled: Boolean(patientId),
  })
}

export function useCreateAntenatalVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateAntenatalVisitRequest) => {
      const { data } = await api.post<AntenatalVisit>('/api/maternity/antenatal', request)
      return data
    },
    onSuccess: (_data, variables) => {
      toast.success('Antenatal visit recorded')
      queryClient.invalidateQueries({ queryKey: ['antenatal'] })
      queryClient.invalidateQueries({ queryKey: ['antenatal', 'patient', variables.patientId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to record antenatal visit'))
    },
  })
}

// === Partograph observations ===

export interface PartographObservation {
  id: string
  admissionId?: string | null
  patientId?: string | null
  observedAt: string
  cervicalDilationCm?: number | null
  cervicalDilationEffacementPercent?: number | null
  fetalHeartRateBpm?: number | null
  maternalContractionsPer10min?: number | null
  maternalBloodPressureSystolic?: number | null
  maternalBloodPressureDiastolic?: number | null
  fetalPosition?: string | null
  notes?: string | null
}

export interface RecordPartographRequest {
  admissionId?: string
  patientId?: string
  observedAt: string
  cervicalDilationCm?: number
  cervicalDilationEffacementPercent?: number
  fetalHeartRateBpm?: number
  maternalContractionsPer10min?: number
  maternalBloodPressureSystolic?: number
  maternalBloodPressureDiastolic?: number
  fetalPosition?: string
  notes?: string
}

export function usePartographByAdmission(admissionId?: string) {
  return useQuery({
    queryKey: ['partograph', 'admission', admissionId],
    queryFn: async () => {
      const { data } = await api.get<PartographObservation[]>(
        `/api/maternity/partograph/admission/${admissionId}`
      )
      return data
    },
    enabled: Boolean(admissionId),
    refetchInterval: 30_000,
  })
}

export function usePartograph(patientId?: string) {
  return useQuery({
    queryKey: ['partograph', 'patient', patientId],
    queryFn: async () => {
      const { data } = await api.get<PartographObservation[]>(
        `/api/maternity/partograph/${patientId}`
      )
      return data
    },
    enabled: Boolean(patientId),
    refetchInterval: 30_000,
  })
}

export function useRecordPartographObservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: RecordPartographRequest) => {
      const { data } = await api.post<PartographObservation>(
        '/api/maternity/partograph',
        request
      )
      return data
    },
    onSuccess: (_data, variables) => {
      toast.success('Partograph observation recorded')
      if (variables.admissionId) {
        queryClient.invalidateQueries({
          queryKey: ['partograph', 'admission', variables.admissionId],
        })
      }
      if (variables.patientId) {
        queryClient.invalidateQueries({
          queryKey: ['partograph', 'patient', variables.patientId],
        })
      }
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to record observation'))
    },
  })
}

// === Deliveries ===

export interface Delivery {
  id: string
  admissionId?: string | null
  patientId: string
  mode: string
  outcome: string
  deliveredAt?: string | null
  apgar1min?: number | null
  apgar5min?: number | null
  birthWeightGrams?: number | null
  estimatedBloodLossMl?: number | null
  placentaDelivery?: string | null
  newbornPatientId?: string | null
}

export interface RecordDeliveryRequest {
  admissionId: string
  patientId: string
  mode: string
  outcome: string
  deliveredAt?: string
  apgar1min?: number
  apgar5min?: number
  birthWeightGrams?: number
  estimatedBloodLossMl?: number
  complications?: string[]
  placentaDelivery?: string
  notes?: string
  registerNewborn: boolean
  newbornFirstName?: string
  newbornLastName?: string
  newbornGender?: string
}

export function useDeliveries() {
  return useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const { data } = await api.get<Delivery[]>('/api/maternity/deliveries')
      return data
    },
  })
}

export function useDeliveriesByAdmission(admissionId?: string) {
  return useQuery({
    queryKey: ['deliveries', 'admission', admissionId],
    queryFn: async () => {
      const { data } = await api.get<Delivery[]>(
        `/api/maternity/deliveries/admission/${admissionId}`
      )
      return data
    },
    enabled: Boolean(admissionId),
  })
}

export function useRecordDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: RecordDeliveryRequest) => {
      const { data } = await api.post<Delivery>('/api/maternity/deliveries', request)
      return data
    },
    onSuccess: (_data, variables) => {
      toast.success('Delivery recorded')
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      if (variables.admissionId) {
        queryClient.invalidateQueries({
          queryKey: ['deliveries', 'admission', variables.admissionId],
        })
      }
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to record delivery'))
    },
  })
}

// === Newborns ===

export interface Newborn {
  id: string
  deliveryId?: string | null
  motherId?: string | null
  admissionId?: string | null
  birthName?: string | null
  gender?: string | null
  birthWeightGm?: number | null
  birthLengthCm?: number | null
  headCircumferenceCm?: number | null
  apgarScore1min?: number | null
  apgarScore5min?: number | null
  status?: string | null
}

export function useNewbornsByMother(motherId?: string) {
  return useQuery({
    queryKey: ['newborns', 'mother', motherId],
    queryFn: async () => {
      const { data } = await api.get<Newborn[]>(
        `/api/maternity/newborns/mother/${motherId}`
      )
      return data
    },
    enabled: Boolean(motherId),
  })
}

// === Backwards-compatible alias (deprecated) ===

/** @deprecated use {@link useRecordPartographObservation}. */
export type PartographObservationLegacy = PartographObservation

/** @deprecated use {@link usePartographByAdmission}. */
export function usePartographLegacy(patientId?: string) {
  return usePartograph(patientId)
}
