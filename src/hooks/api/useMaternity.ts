import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

type ApiErrorPayload = { response?: { data?: { message?: string } } }

function apiErrorMessage(error: unknown, fallback: string) {
  return (error as ApiErrorPayload).response?.data?.message || fallback
}

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

export function useActiveAntenatalVisits() {
  return useQuery({
    queryKey: ['antenatal', 'active'],
    queryFn: async () => {
      const { data } = await api.get<AntenatalVisit[]>('/api/maternity/antenatal/active')
      return data
    },
  })
}

export interface CreateAntenatalVisitRequest {
  patientId: string
  visitNumber?: number
  gestationalAgeWeeks?: number
  bloodPressure?: string
  weightKg?: number
  foetalHeartRate?: number
}

export function useCreateAntenatalVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: CreateAntenatalVisitRequest) => {
      const { data } = await api.post<AntenatalVisit>('/api/maternity/antenatal', request)
      return data
    },
    onSuccess: () => {
      toast.success('Antenatal visit recorded')
      queryClient.invalidateQueries({ queryKey: ['antenatal'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to record antenatal visit'))
    },
  })
}

export interface PartographObservation {
  id: string
  patientId: string
  observedAt: string
  cervicalDilationCm?: number | null
  descentStation?: number | null
  foetalHeartRate?: number | null
  contractionsPer10min?: number | null
  systolicBp?: number | null
  diastolicBp?: number | null
  notes?: string | null
}

export interface RecordPartographRequest {
  patientId: string
  cervicalDilationCm?: number
  descentStation?: number
  foetalHeartRate?: number
  contractionsPer10min?: number
  systolicBp?: number
  diastolicBp?: number
  notes?: string
}

export function usePartograph(patientId?: string) {
  return useQuery({
    queryKey: ['partograph', patientId],
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
      queryClient.invalidateQueries({ queryKey: ['partograph', variables.patientId] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to record observation'))
    },
  })
}

export interface Delivery {
  id: string
  patientId: string
  deliveryMode: string
  outcome: string
  deliveredAt: string
  apgar1min?: number | null
  apgar5min?: number | null
  birthWeightGrams?: number | null
  newbornPatientId?: string | null
}

export interface RecordDeliveryRequest {
  patientId: string
  deliveryMode: string
  outcome: string
  deliveredAt: string
  apgar1min?: number
  apgar5min?: number
  birthWeightGrams?: number
  estimatedBloodLossMl?: number
  complications?: string
  placentaComplete?: boolean
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

export function useRecordDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: RecordDeliveryRequest) => {
      const { data } = await api.post<Delivery>('/api/maternity/deliveries', request)
      return data
    },
    onSuccess: () => {
      toast.success('Delivery recorded')
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, 'Failed to record delivery'))
    },
  })
}
