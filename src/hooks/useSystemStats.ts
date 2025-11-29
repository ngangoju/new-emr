'use client'

import { useMemo } from 'react'
import { getSystemStats } from '@/lib/mock/admin'
import type { SystemMetric } from '@/types/admin'

export interface UseSystemStatsResult {
  stats: SystemMetric
  loading: boolean
}

export function useSystemStats(): UseSystemStatsResult {
  const stats = useMemo(() => getSystemStats(), [])

  return {
    stats,
    loading: false,
  }
}