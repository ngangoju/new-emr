import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { prefetchDashboard } from '@/lib/prefetch-dashboard'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('Dashboard Prefetch & Cache Integration', () => {
  it('seeds the query cache with the correct unwrapped array format to avoid rendering crash', async () => {
    const mockAppointments = [
      { id: '1', time: '09:00', patientName: 'John Doe', type: 'Consultation', status: 'Scheduled' },
      { id: '2', time: '10:00', patientName: 'Jane Smith', type: 'Follow-up', status: 'Scheduled' },
    ]

    // Mock API responses
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/dashboard/stats') {
        return Promise.resolve({ data: { todayAppointments: 2, pending: 1, seen: 1, avgWait: '15m' } })
      }
      if (url === '/api/dashboard/appointments') {
        return Promise.resolve({ data: { appointments: mockAppointments } })
      }
      if (url === '/api/dashboard/recent-patients') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error('not found'))
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    // Run the prefetch helper
    prefetchDashboard(queryClient)

    // Wait for the queries to settle in queryClient cache
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Retrieve the cached appointments data
    const cachedAppointments = queryClient.getQueryData(['dashboard', 'appointments'])

    // Assert that the cached data is a flat array, NOT the wrapped object { appointments: [...] }
    expect(cachedAppointments).toBeInstanceOf(Array)
    expect(cachedAppointments).toEqual(mockAppointments)
  })
})
