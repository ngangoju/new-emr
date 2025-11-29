import { useMemo } from 'react'
import { mockLabOrders } from '@/lib/mock/lab'
import type { LabOrder, LabResult } from '@/types/lab'

export function useLabOrders() {
  const pending = useMemo(
    () => mockLabOrders.filter((order: LabOrder) => order.status === 'pending'),
    []
  )

  const completed = useMemo(
    () => mockLabOrders.filter((order: LabOrder) => order.status === 'completed'),
    []
  )

  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toDateString()
    const pendingToday = pending.filter((o: LabOrder) => o.orderedAt.toDateString() === today).length
    const completedToday = completed.filter((o: LabOrder) => 
      o.results?.completedAt?.toDateString() === today
    ).length
    return {
      pending: pending.length,
      completed: completed.length,
      pendingToday,
      completedToday,
    }
  }, [pending, completed])

  return { pending, completed, stats }
}

export function useLabResult(orderId: string) {
  return useMemo(
    () => mockLabOrders.find((o: LabOrder) => o.id === orderId),
    [orderId]
  )
}

export function useUploadResult() {
  const uploadResult = (orderId: string, result: LabResult) => {
    console.log('Mock upload result for order', orderId, result)
    // TODO: In real app, POST to API and invalidate queries
    alert('Results uploaded successfully! (mock)')
  }

  return { uploadResult }
}