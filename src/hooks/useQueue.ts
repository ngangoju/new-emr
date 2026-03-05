'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export interface QueueEntry {
  id: string
  patientId: string
  appointmentId?: string
  doctorId: string
  queueNumber: number
  priority: number // 1: Routine, 2: Priority, 3: Urgent, 4: Emergency
  status: 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW'
  checkedInAt: string
  calledAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // Enriched fields
  patientName: string
  doctorName: string
  waitTimeMinutes: number
  phoneNumber?: string
  consultationType?: string
  mewsScore?: number
  acuityColor?: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
}

export interface CreateQueueEntry {
  patientId: string
  appointmentId?: string
  doctorId?: string
  priority?: number | string
  consultationType?: string
  notes?: string
}

export function useQueue(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['queue', 'active'],
    queryFn: async () => {
      const { data } = await api.get<QueueEntry[]>('/api/triage/queue')
      return data
    },
    refetchInterval: 30000,
    enabled: options?.enabled ?? true,
  })
}

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue', 'stats'],
    queryFn: async () => {
      const [waiting, seen] = await Promise.all([
        api.get<number>('/api/queue/waiting/count'),
        api.get<number>('/api/queue/seen/count')
      ])
      return {
        waitingCount: waiting.data,
        seenTodayCount: seen.data
      }
    },
    refetchInterval: 10000
  })
}

export function useAddToQueue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateQueueEntry) => {
      const { data } = await api.post<QueueEntry>('/api/queue', dto)
      return data
    },
    onSuccess: () => {
      toast.success('Patient checked in')
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    }
  })
}

export function useCallNextPatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<QueueEntry>('/api/queue/call-next')
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Calling: ${data.patientName}`)
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    }
  })
}

export function useUpdateQueueStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      let response;
      if (status === 'IN_PROGRESS') {
        response = await api.post<QueueEntry>(`/api/queue/${id}/start`)
      } else if (status === 'COMPLETED') {
        response = await api.post<QueueEntry>(`/api/queue/${id}/complete`)
      } else if (status === 'NO_SHOW') {
        response = await api.post<QueueEntry>(`/api/queue/${id}/no-show`)
      } else {
        throw new Error(`Unsupported status: ${status}`)
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    }
  })
}
