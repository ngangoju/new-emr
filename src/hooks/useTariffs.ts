'use client'

import { useState, useEffect, useCallback } from 'react'
import { mockTariffs } from '@/lib/mock/tariffs'
import type { Tariff } from '@/types/billing'

interface UseTariffsOptions {
  search?: string
}

export function useTariffs({ search }: UseTariffsOptions = {}) {
  const [data, setData] = useState<Tariff[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      if (!search?.trim()) {
        setData(mockTariffs)
      } else {
        const lowerSearch = search.toLowerCase()
        const filtered = mockTariffs.filter(
          (tariff) =>
            tariff.name.toLowerCase().includes(lowerSearch) ||
            tariff.category.toLowerCase().includes(lowerSearch)
        )
        setData(filtered)
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const refetch = useCallback(() => {
    // Trigger effect
  }, [])

  return { data, loading, refetch }
}