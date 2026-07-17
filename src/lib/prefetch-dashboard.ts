import type { QueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Warm the dashboard queries while the post-login redirect is in flight so the
 * landing page renders from cache instead of showing three loading states.
 * Keys/endpoints must mirror src/hooks/api/useDashboard.ts. Failures are
 * intentionally ignored — the dashboard hooks refetch on mount anyway.
 */
export function prefetchDashboard(queryClient: QueryClient) {
  void queryClient.prefetchQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => (await api.get('/api/dashboard/stats')).data,
  })
  void queryClient.prefetchQuery({
    queryKey: ['dashboard', 'appointments'],
    queryFn: async () => (await api.get('/api/dashboard/appointments')).data,
  })
  void queryClient.prefetchQuery({
    queryKey: ['dashboard', 'recent-patients'],
    queryFn: async () => (await api.get('/api/dashboard/recent-patients')).data,
  })
}
