'use client'

import { useState, useEffect, useCallback } from 'react'

export interface QueueItem {
  id: number
  queueNumber: number
  patientId: string
  patientName: string
  phoneNumber?: string
  consultationType: string
  status: 'waiting' | 'called' | 'in-consultation' | 'completed'
  joinedAt: Date
  calledAt?: Date
  servedAt?: Date
}

const initialQueue: QueueItem[] = [
  {
    id: 1,
    queueNumber: 1,
    patientId: 'PT-2024-101',
    patientName: 'Alice Johnson',
    phoneNumber: '+250 788 123 456',
    consultationType: 'Follow-up',
    status: 'in-consultation',
    joinedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    calledAt: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: 2,
    queueNumber: 2,
    patientId: 'PT-2024-102',
    patientName: 'Robert Smith',
    phoneNumber: '+250 788 234 567',
    consultationType: 'New Patient',
    status: 'waiting',
    joinedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
  },
  {
    id: 3,
    queueNumber: 3,
    patientId: 'PT-2024-103',
    patientName: 'Emma Wilson',
    phoneNumber: '+250 788 345 678',
    consultationType: 'Checkup',
    status: 'waiting',
    joinedAt: new Date(Date.now() - 8 * 60 * 1000), // 8 min ago
  },
  {
    id: 4,
    queueNumber: 4,
    patientId: 'PT-2024-104',
    patientName: 'Michael Brown',
    consultationType: 'Emergency',
    status: 'waiting',
    joinedAt: new Date(Date.now() - 3 * 60 * 1000), // 3 min ago
  },
]

export function useQueue() {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue)

  // Simulate real-time updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would listen to WebSocket updates
      // For now, we'll just update timestamps to show elapsed time
      setQueue((prev) => [...prev])
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const callNext = useCallback(() => {
    setQueue((prev) => {
      const updated = [...prev]
      const waitingIndex = updated.findIndex((q) => q.status === 'waiting')

      if (waitingIndex > -1) {
        updated[waitingIndex] = {
          ...updated[waitingIndex],
          status: 'called',
          calledAt: new Date(),
        }
      }

      return updated
    })
  }, [])

  const markAsServed = useCallback((patientId: number) => {
    setQueue((prev) => {
      return prev.map((item) => {
        if (item.id === patientId) {
          return {
            ...item,
            status: 'in-consultation',
            servedAt: new Date(),
          }
        }
        return item
      })
    })
  }, [])

  const markAsCompleted = useCallback((patientId: number) => {
    setQueue((prev) => {
      return prev.map((item) => {
        if (item.id === patientId) {
          return {
            ...item,
            status: 'completed',
          }
        }
        return item
      })
    })
  }, [])

  const addToQueue = useCallback((patient: Omit<QueueItem, 'id' | 'queueNumber' | 'status'>) => {
    setQueue((prev) => {
      const maxQueueNumber = Math.max(...prev.map(q => q.queueNumber), 0)
      const newItem: QueueItem = {
        ...patient,
        id: Date.now(),
        queueNumber: maxQueueNumber + 1,
        status: 'waiting',
      }
      return [...prev, newItem]
    })
  }, [])

  return {
    queue,
    callNext,
    markAsServed,
    markAsCompleted,
    addToQueue,
  }
}