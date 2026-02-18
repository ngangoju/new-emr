import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Medication } from '@/types/pharmacy'

function useDebouncedValue<T>(value: T, delay = 350): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => window.clearTimeout(timeout)
    }, [value, delay])

    return debouncedValue
}

/**
 * Search medications from pharmacy inventory
 * Used in DrugRequestForm for selecting medications
 */
export function useMedicationSearch(search: string) {
    const debouncedSearch = useDebouncedValue(search.trim(), 350)

    return useQuery({
        queryKey: ['medications', 'search', debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                return []
            }

            const { data } = await api.get<Medication[]>('/api/pharmacy/medications/search', {
                params: { searchTerm: debouncedSearch },
            })
            return data
        },
        enabled: debouncedSearch.length >= 2,
        retry: false,
        staleTime: 10_000,
    })
}

/**
 * Get all medications from pharmacy inventory
 */
export function useMedications() {
    return useQuery({
        queryKey: ['medications'],
        queryFn: async () => {
            const { data } = await api.get<Medication[]>('/api/pharmacy/medications')
            return data
        },
    })
}
