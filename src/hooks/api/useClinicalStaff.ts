import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface ClinicalStaffOption {
  id: string
  fullName: string
}

interface UseClinicalStaffOptions {
  role?: string
  search?: string
  page?: number
  size?: number
  enabled?: boolean
}

export function useClinicalStaff(options: UseClinicalStaffOptions = {}) {
  const {
    role = 'DOCTOR',
    search,
    page = 0,
    size = 20,
    enabled = true,
  } = options

  return useQuery({
    queryKey: ['clinical-staff', role, search, page, size],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{
        data: ClinicalStaffOption[]
        meta?: {
          page: number
          size: number
          totalElements: number
          totalPages: number
          hasNext: boolean
          hasPrevious: boolean
        }
      }>('/api/users/clinical-staff', {
        params: {
          role,
          search: search || undefined,
          page,
          size,
        },
      })

      return data
    },
  })
}
