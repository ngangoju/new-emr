import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Tariff } from '@/types/billing'

interface UseTariffsOptions {
  search?: string
  category?: string
}

export function useTariffs({ search, category }: UseTariffsOptions = {}) {
  return useQuery({
    queryKey: ['tariffs', search, category],
    queryFn: async () => {
      let url = '/api/tariffs'

      if (search) {
        url = `/api/tariffs/search?searchTerm=${encodeURIComponent(search)}`
      } else if (category) {
        url = `/api/tariffs/category/${category}`
      }

      const { data } = await api.get<Tariff[]>(url)
      return data
    },
    // Add a small delay to debounce search
    enabled: !search || search.length >= 2
  })
}
