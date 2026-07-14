import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface BloodDonor {
  id: string
  donorCode?: string | null
  name: string
  bloodGroup?: string | null
  dateOfBirth?: string | null
  phone?: string | null
  status: string
  lastDonationDate?: string | null
}

export interface BloodUnit {
  id: string
  donorId?: string | null
  bloodGroup: string
  collectionDate?: string | null
  expiryDate?: string | null
  status: string
}

export function useActiveDonors() {
  return useQuery({
    queryKey: ['blood-donors', 'active'],
    queryFn: async () => {
      const { data } = await api.get<BloodDonor[]>('/api/blood-bank/donors/active')
      return data
    },
  })
}

export function useAvailableUnits() {
  return useQuery({
    queryKey: ['blood-units', 'available'],
    queryFn: async () => {
      const { data } = await api.get<BloodUnit[]>('/api/blood-bank/units/available')
      return data
    },
  })
}
