import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Tariff } from '@/types/billing'

interface UseTariffsOptions {
  search?: string
  category?: string
  page?: number
  size?: number
  excludeCategories?: string[]
}

export function useTariffs({ search, category, page = 0, size = 20, excludeCategories }: UseTariffsOptions = {}) {
  return useQuery({
    queryKey: ['tariffs', search, category, page, size, excludeCategories],
    queryFn: async () => {
      if (category) {
        const { data } = await api.get<Tariff[]>(`/api/tariffs/category/${category}`)
        return {
          data,
          meta: {
            page: 0,
            size: data.length,
            totalElements: data.length,
            totalPages: data.length > 0 ? 1 : 0,
            hasNext: false,
            hasPrevious: false,
          },
        }
      }

      const { data } = await api.get<{
        data: Tariff[]
        meta?: {
          page: number
          size: number
          totalElements: number
          totalPages: number
          hasNext: boolean
          hasPrevious: boolean
        }
      }>('/api/tariffs', {
        params: {
          search: search || undefined,
          excludeCategories: excludeCategories?.length ? excludeCategories : undefined,
          page,
          size,
        },
      })

      return data
    },
    enabled: !search || search.length >= 2
  })
}
