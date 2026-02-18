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
      try {
        const { data } = await api.get<SystemMetric>('/dashboard/admin-stats')
        return data
      } catch (error) {
        console.warn('Failed to fetch admin stats, using fallback:', error)
        // Return fallback data on error to prevent UI crash
        return {
          totalPatients: 0,
          totalAppointments: 0,
          totalRevenue: 0,
          totalUsers: 0,
          patientGrowth: 0,
          revenueTrend: 0
        } as SystemMetric
      }
    }
  })

  return {
    stats,
    loading: isLoading,
  }
}
