import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SystemMetric } from '@/types/admin'

export interface UseSystemStatsResult {
  stats: SystemMetric | undefined
  loading: boolean
}

export function useSystemStats(): UseSystemStatsResult {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get<SystemMetric>('/dashboard/admin-stats')
      return data
    }
  })

  return {
    stats,
    loading: isLoading,
  }
}