import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Asset {
  id: string
  assetTag?: string | null
  name: string
  category?: string | null
  location?: string | null
  status: string
}

export interface Ambulance {
  id: string
  vehicleCode?: string | null
  registrationNumber?: string | null
  status: string
  baseLocation?: string | null
}

export interface StaffRecord {
  id: string
  employeeCode?: string | null
  name: string
  department?: string | null
  position?: string | null
  status: string
}

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data } = await api.get<Asset[]>('/api/back-office/assets')
      return data
    },
  })
}

export function useAvailableAmbulances() {
  return useQuery({
    queryKey: ['ambulances', 'available'],
    queryFn: async () => {
      const { data } = await api.get<Ambulance[]>('/api/back-office/ambulances/available')
      return data
    },
  })
}

export function useActiveStaff() {
  return useQuery({
    queryKey: ['staff', 'active'],
    queryFn: async () => {
      const { data } = await api.get<StaffRecord[]>('/api/back-office/staff/active')
      return data
    },
  })
}
