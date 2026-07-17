import type { QueryClient } from '@tanstack/react-query'
import { fetchDashboardStats, fetchTodayAppointments, fetchRecentPatients } from '@/hooks/api/useDashboard'

/**
 * Warm the dashboard queries while the post-login redirect is in flight so the
 * landing page renders from cache instead of showing three loading states.
 * Keys/endpoints must mirror src/hooks/api/useDashboard.ts. Failures are
 * intentionally ignored — the dashboard hooks refetch on mount anyway.
 */
export function prefetchDashboard(queryClient: QueryClient) {
  void queryClient.prefetchQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
  })
  void queryClient.prefetchQuery({
    queryKey: ['dashboard', 'appointments'],
    queryFn: fetchTodayAppointments,
  })
  void queryClient.prefetchQuery({
    queryKey: ['dashboard', 'recent-patients'],
    queryFn: fetchRecentPatients,
  })
}

